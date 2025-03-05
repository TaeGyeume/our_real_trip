const axios = require('axios');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const TourTicket = require('../models/TourTicket');
const Room = require('../models/Room');
const TravelItem = require('../models/TravelItem');
const Flight = require('../models/Flight');
const UserCoupon = require('../models/UserCoupon');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const userMileageService = require('./userMileageService');
const User = require('../models/User');
const usermembershipService = require('./usermembershipService');

let cachedToken = null;
let tokenExpiration = null;

const getPortOneToken = async () => {
  if (cachedToken && tokenExpiration && Date.now() < tokenExpiration) return cachedToken;

  const {data} = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.PORTONE_API_KEY,
    imp_secret: process.env.PORTONE_API_SECRET
  });

  if (data.code !== 0) throw new Error(`포트원 토큰 요청 실패: ${data.message}`);

  cachedToken = data.response.access_token;
  tokenExpiration = data.response.expired_at * 1000;

  return cachedToken;
};

exports.createBooking = async bookingData => {
  try {
    // 단일 상품 배열 변환 유지
    const types = Array.isArray(bookingData.types)
      ? bookingData.types
      : [bookingData.types];

    const productIds = Array.isArray(bookingData.productIds)
      ? bookingData.productIds
      : [bookingData.productIds];

    const counts = Array.isArray(bookingData.counts)
      ? bookingData.counts
      : [bookingData.counts];

    const roomIds = Array.isArray(bookingData.roomIds)
      ? bookingData.roomIds
      : [bookingData.roomIds];

    const startDates = Array.isArray(bookingData.startDates)
      ? bookingData.startDates
      : [bookingData.startDates];

    const endDates = Array.isArray(bookingData.endDates)
      ? bookingData.endDates
      : [bookingData.endDates];

    console.log('[서버] 변환된 데이터:', {roomIds, startDates, endDates});

    const {
      merchant_uid,
      userId,
      couponId,
      totalPrice,
      discountAmount,
      finalPrice,
      usedMileage = 0,
      ...rest
    } = bookingData;

    // merchant_uid 중복 검사
    const existingBooking = await Booking.findOne({merchant_uid});
    if (existingBooking) {
      return {status: 400, message: '이미 존재하는 예약번호입니다.'};
    }

    let appliedCoupon = null;
    if (couponId) {
      console.log(
        `[서버] 쿠폰 예약 처리 시작 - couponId: ${couponId}, userId: ${userId}`
      );

      const userCoupon = await UserCoupon.findOne({
        _id: couponId,
        user: userId,
        isUsed: false,
        expiresAt: {$gte: new Date()}
      });

      if (userCoupon) {
        appliedCoupon = userCoupon._id;
        console.log(`[서버] 쿠폰 예약 처리 완료 - userCouponId: ${appliedCoupon}`);
      } else {
        console.warn(`[서버] 유효한 쿠폰을 찾을 수 없음! couponId: ${couponId}`);
      }
    }

    // `PENDING` 상태일 때 쿠폰을 무조건 `false`로 유지
    if (appliedCoupon) {
      const userCoupon = await UserCoupon.findById(appliedCoupon);
      if (userCoupon) {
        userCoupon.isUsed = false; // PENDING 상태에서는 무조건 false
        await userCoupon.save();
      }
    }

    // 추가: 마일리지 차감 로직
    const user = await User.findById(userId);
    if (!user) {
      return {status: 404, message: '사용자를 찾을 수 없습니다.'};
    }

    if (usedMileage > user.mileage) {
      return {status: 400, message: '마일리지가 부족합니다.'};
    }

    // 최종 결제 금액 업데이트
    const updatedFinalPrice = totalPrice - discountAmount - usedMileage;
    if (updatedFinalPrice < 0) {
      return {status: 400, message: '사용할 마일리지가 결제 금액보다 클 수 없습니다.'};
    }

    // 하나의 예약 데이터로 생성
    const newBooking = new Booking({
      userId,
      types,
      productIds,
      counts,
      roomIds,
      startDates,
      endDates,
      merchant_uid,
      totalPrice: bookingData.totalPrice,
      discountAmount: discountAmount || 0,
      finalPrice: updatedFinalPrice, // 마일리지 반영된 최종 가격
      usedMileage, // 사용한 마일리지 저장
      userCouponId: appliedCoupon, // 사용한 유저 쿠폰 저장
      paymentsStatus: 'PENDING',
      ...rest
    });

    await newBooking.save();
    exports.scheduleAutoConfirm(newBooking._id, newBooking.createdAt);
    return {status: 200, booking: newBooking, message: '예약 생성 완료'};
  } catch (error) {
    console.error('예약 생성 오류:', error);
    // 오류 발생 시 쿠폰 복구
    if (appliedCoupon) {
      console.warn(
        `[서버] 예약 오류 발생으로 쿠폰 복구 진행 - couponId: ${appliedCoupon}`
      );
      try {
        const userCoupon = await UserCoupon.findById(appliedCoupon);
        if (userCoupon) {
          userCoupon.isUsed = false; // 다시 사용 가능하도록 변경
          await userCoupon.save();
          console.log(`[서버] 쿠폰 복구 완료 - couponId: ${appliedCoupon}`);
        }
      } catch (couponError) {
        console.error(`[서버] 쿠폰 복구 중 오류 발생: ${couponError.message}`);
      }
    }

    // 오류 발생 시 마일리지 복구
    if (usedMileage > 0) {
      try {
        const user = await User.findById(bookingData.userId);
        if (user) {
          user.mileage += usedMileage;
          await user.save();
          console.log(`[서버] 오류 발생으로 사용된 마일리지 복구 완료 - ${usedMileage}P`);
          // 사용된 마일리지를 복구하는 내역도 기록
          await userMileageService.addMileageWithHistory(
            user,
            usedMileage,
            `예약 오류로 마일리지 환불 (${usedMileage.toLocaleString()}P)`
          );
          console.log(`[서버] 오류 발생 시 마일리지 복구 내역 저장 완료`);
        }
      } catch (mileageError) {
        console.error(`[서버] 마일리지 복구 중 오류 발생: ${mileageError.message}`);
      }
    }

    return {status: 500, message: '예약 생성 중 오류 발생'};
  }
};

exports.verifyPayment = async ({imp_uid, merchant_uid, couponId = null, userId}) => {
  try {
    const accessToken = await getPortOneToken();
    const {data} = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: {Authorization: accessToken}
    });
    console.log('[서버] PortOne 결제 정보:', data.response);
    const paymentData = data.response;
    const bookings = await Booking.find({merchant_uid});
    console.log('[서버] 조회된 예약 정보:', bookings);
    if (!bookings.length) throw new Error('예약 데이터를 찾을 수 없습니다.');

    let totalUsedMileage = bookings.reduce(
      (sum, booking) => sum + (booking.usedMileage || 0),
      0
    );
    let totalOriginalPrice = bookings.reduce(
      (sum, booking) => sum + (booking.totalPrice || 0),
      0
    );
    console.log('[서버] 예약 총 가격:', totalOriginalPrice);
    let discountAmount = 0;
    let expectedFinalAmount = totalOriginalPrice - discountAmount - totalUsedMileage;
    console.log('[서버] 예상 결제 금액:', expectedFinalAmount);

    const toObjectId = id =>
      mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    if (couponId) {
      console.log('[서버] 쿠폰 검증 시작 - couponId:', couponId, 'userId:', userId);
      const userCoupon = await UserCoupon.findOne({
        _id: toObjectId(couponId),
        user: toObjectId(userId),
        isUsed: false,
        expiresAt: {$gte: new Date()}
      }).populate('coupon');
      console.log('[서버] 조회된 UserCoupon:', userCoupon);
      if (!userCoupon || !userCoupon.coupon) {
        console.error('[서버] 쿠폰을 찾을 수 없음 또는 만료됨!');
        return {status: 400, message: '사용 가능한 쿠폰을 찾을 수 없습니다.'};
      }
      const actualCouponId = userCoupon.coupon._id;
      console.log('[서버] 변환된 실제 쿠폰 ID:', actualCouponId);
      const coupon = userCoupon.coupon;
      if (totalOriginalPrice < coupon.minPurchaseAmount) {
        return {
          status: 400,
          message: `이 쿠폰은 ${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시 사용 가능합니다.`
        };
      }
      if (coupon.discountType === 'percentage') {
        discountAmount = (totalOriginalPrice * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount > 0) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      }
      expectedFinalAmount = totalOriginalPrice - discountAmount;
      userCoupon.isUsed = true;
      await userCoupon.save();
    }

    // 패키지 예약 여부 확인: 모든 예약이 패키지 타입이면 true
    const isPackageBooking = bookings.every(booking => booking.types.includes('package'));
    if (isPackageBooking) {
      // 패키지 예약은 finalPrice 기준으로 검증
      expectedFinalAmount = bookings.reduce(
        (sum, booking) => sum + (booking.finalPrice || 0),
        0
      );
      console.log(
        `[서버] [패키지] 최종 예약 가격 검증: 포트원 결제 금액(${paymentData.amount}) vs 서버 계산 금액(${expectedFinalAmount})`
      );
    } else {
      expectedFinalAmount = Math.max(
        totalOriginalPrice - discountAmount - totalUsedMileage,
        0
      );
      console.log(
        `[서버] [일반상품] 예상 결제 금액: ${expectedFinalAmount}원 (쿠폰 ${discountAmount}원 적용, 마일리지 ${totalUsedMileage}P 적용)`
      );
    }

    if (Math.abs(paymentData.amount - expectedFinalAmount) >= 0.01) {
      console.error(
        `결제 금액 불일치! 포트원: ${paymentData.amount}, 예상 결제 금액: ${expectedFinalAmount}`
      );
      return {status: 400, message: '결제 금액 불일치'};
    }

    if (totalUsedMileage > 0) {
      await userMileageService.useMileage(
        userId,
        totalUsedMileage,
        `예약 확정 (${user.membershipLevel}, ${totalUsedMileage.toLocaleString()}P 사용)`
      );
    }

    await Promise.all(
      bookings.map(async booking => {
        const {types, productIds, counts, roomIds, startDates, endDates} = booking;
        if (
          !Array.isArray(types) ||
          !Array.isArray(productIds) ||
          !Array.isArray(counts) ||
          !Array.isArray(roomIds) ||
          !Array.isArray(startDates) ||
          !Array.isArray(endDates)
        ) {
          throw new Error('예약 데이터 배열이 올바르지 않습니다.');
        }
        await Promise.all(
          productIds.map(async (productId, index) => {
            let product;
            switch (types[index]) {
              case 'tourTicket':
                product = await TourTicket.findById(productId);
                product.stock -= counts[index];
                break;
              case 'flight': {
                product = await Flight.findById(productId);
                if (!product) {
                  throw new Error('항공편 정보를 찾을 수 없습니다.');
                }
                if (product.seatsAvailable < counts[index]) {
                  throw new Error(
                    `잔여 좌석이 부족합니다. (남은 좌석: ${product.seatsAvailable})`
                  );
                }
                product.seatsAvailable -= counts[index];
                await product.save();
                console.log(`항공편(${productId}) 좌석 ${counts[index]}석 감소 완료`);
                break;
              }
              case 'accommodation': {
                if (!roomIds[index])
                  return {status: 400, message: '객실 정보가 누락되었습니다.'};
                product = await Room.findById(roomIds[index]);
                if (!product)
                  return {status: 404, message: '객실 정보를 찾을 수 없습니다.'};
                const startDate = new Date(startDates[index]);
                const endDate = new Date(endDates[index]);
                let currentDate = new Date(startDate);
                while (currentDate < endDate) {
                  const dateStr = currentDate.toISOString().split('T')[0];
                  let reservedIndex = product.reservedDates.findIndex(
                    d => d.date.toISOString().split('T')[0] === dateStr
                  );
                  let reservedCountOnDate =
                    reservedIndex !== -1 ? product.reservedDates[reservedIndex].count : 0;
                  if (reservedCountOnDate + counts[index] > product.availableCount) {
                    console.error(`${dateStr} 날짜에 예약 가능한 객실 부족!`);
                    return {
                      status: 400,
                      message: `${dateStr} 날짜에 예약 가능한 객실이 부족합니다.`
                    };
                  }
                  if (reservedIndex !== -1) {
                    product.reservedDates[reservedIndex].count += counts[index];
                  } else {
                    product.reservedDates.push({
                      date: new Date(dateStr),
                      count: counts[index]
                    });
                  }
                  currentDate.setDate(currentDate.getDate() + 1);
                }
                const totalReserved = product.reservedDates.reduce(
                  (acc, d) => acc + d.count,
                  0
                );
                product.available = totalReserved < product.availableCount;
                await product.save();
                break;
              }
              case 'travelItem':
                product = await TravelItem.findById(productId);
                product.stock -= counts[index];
                break;
              case 'package': {
                // 패키지 예약의 경우, 재고 감소 처리는 생략합니다.
                break;
              }
              default:
                throw new Error(`알 수 없는 상품 타입: ${types[index]}`);
            }
            if (!product && types[index] !== 'package')
              throw new Error(`${types[index]} 상품을 찾을 수 없습니다.`);
            if (product && types[index] !== 'package') await product.save();
          })
        );
        const user = await User.findById(userId);
        if (!user) {
          return {status: 404, message: '사용자를 찾을 수 없습니다.'};
        }
        let mileageRate = 0.01;
        if (user.membershipLevel === '길잡이') {
          mileageRate = 0.03;
        } else if (user.membershipLevel === '모험왕') {
          mileageRate = 0.05;
        }
        console.log(
          `[서버] 유저 등급: ${user.membershipLevel}, 마일리지 적립률: ${mileageRate * 100}%`
        );
        const earnedMileage = Math.floor(booking.totalPrice * mileageRate);
        await userMileageService.addMileageWithHistory(
          userId,
          earnedMileage,
          `예약 적립 (${user.membershipLevel}, ${booking.totalPrice.toLocaleString()}원 기준)`
        );
        const newPayment = new Payment({
          bookingId: booking._id,
          imp_uid,
          merchant_uid,
          userId: booking.userId,
          amount: paymentData.amount,
          status: 'PAID',
          paymentMethod: paymentData.pay_method,
          paidAt: new Date(paymentData.paid_at * 1000)
        });
        await newPayment.save();
        booking.paymentStatus = 'COMPLETED';
        await booking.save();
      })
    );

    const updatedUser = await usermembershipService.updateUserSpending(
      userId,
      expectedFinalAmount
    );
    console.log(
      `[서버] 유저 등급 업데이트 완료: ${updatedUser.membershipLevel}, 총 결제 금액: ${updatedUser.totalSpent}원`
    );
    console.log('[서버] 결제 검증 성공');
    return {status: 200, message: '결제 검증 성공'};
  } catch (error) {
    console.error('결제 검증 오류:', error);
    const bookings = await Booking.find({merchant_uid});
    // await Promise.all(
    //   bookings.map(async booking => {
    //     if (booking.usedMileage > 0 && booking.paymentStatus !== 'CANCELED') {
    //       await userMileageService.addMileageWithHistory(
    //         booking.userId,
    //         booking.usedMileage,
    //         `결제 실패로 마일리지 환불 (${booking.usedMileage.toLocaleString()}P)`
    //       );
    //       console.log(`[서버] 마일리지 복구 완료: ${booking.usedMileage}P`);
    //     }
    //   })
    // );
    const booking = await Booking.findOne({merchant_uid});
    if (booking && booking.userCouponId) {
      console.warn(
        `[서버] 결제 실패로 쿠폰 복원 - userCouponId: ${booking.userCouponId}`
      );
      const userCoupon = await UserCoupon.findById(booking.userCouponId);
      if (userCoupon && userCoupon.isUsed === 'reserved') {
        userCoupon.isUsed = false;
        await userCoupon.save();
      }
    }
    return {status: 500, message: `결제 검증 중 오류: ${error.message}`};
  }
};

exports.cancelBooking = async bookingIds => {
  try {
    const isObjectId = id => mongoose.Types.ObjectId.isValid(id);

    // `bookingIds`가 단일 값일 경우 배열로 변환
    if (!Array.isArray(bookingIds)) {
      bookingIds = [bookingIds];
    }

    // `_id`(ObjectId)와 `merchant_uid`(문자열) 구분
    const objectIds = bookingIds.filter(id => isObjectId(id)); // ObjectId만 필터링
    const merchantUids = bookingIds.filter(id => !isObjectId(id)); // merchant_uid 필터링

    console.log(
      '[서버] 취소 요청 - ObjectIds:',
      objectIds,
      'MerchantUids:',
      merchantUids
    );

    // `_id` 또는 `merchant_uid`를 기준으로 예약 조회
    const bookings = await Booking.find({
      $or: [{_id: {$in: objectIds}}, {merchant_uid: {$in: merchantUids}}] // 둘 다 검색 가능하도록 수정
    });

    if (!bookings.length) {
      return {status: 404, message: '취소할 예약을 찾을 수 없습니다.'};
    }

    await Promise.all(
      bookings.map(async booking => {
        // 중복 복구 방지를 위한 체크
        if (booking.paymentStatus === 'CANCELED') {
          console.log(`[서버] 이미 취소된 예약 - Booking ID: ${booking._id}`);
          return;
        }

        const {
          types,
          productIds,
          counts,
          roomIds,
          startDates,
          endDates,
          userCouponId,
          usedMileage,
          userId,
          totalPrice,
          finalPrice
        } = booking;

        const prodIds = Array.isArray(productIds) ? productIds : [productIds];
        const prodTypes = Array.isArray(types) ? types : [types];
        const prodCounts = Array.isArray(counts) ? counts : [counts];
        const bookingRoomIds = Array.isArray(roomIds) ? roomIds : [roomIds];
        const bookingStartDates = Array.isArray(startDates) ? startDates : [startDates];
        const bookingEndDates = Array.isArray(endDates) ? endDates : [endDates];

        await Promise.all(
          prodIds.map(async (productId, index) => {
            let product;

            try {
              switch (prodTypes[index]) {
                case 'tourTicket':
                  product = await TourTicket.findById(productId);
                  product.stock += prodCounts[index];
                  break;

                case 'flight':
                  product = await Flight.findById(productId);
                  if (product) {
                    product.seatsAvailable += prodCounts[index];
                    await product.save();
                    console.log(
                      `[서버] 항공편 좌석 복구 완료 - flightId: ${productId}, 복구 좌석 수: ${prodCounts[index]}`
                    );
                  }
                  break;

                case 'accommodation':
                  product = await Room.findById(bookingRoomIds[index]);
                  if (!product) {
                    console.error(
                      `[서버] 객실 정보 찾을 수 없음 - roomId: ${bookingRoomIds[index]}`
                    );
                    return;
                  }

                  const startDate = new Date(bookingStartDates[index]);
                  const endDate = new Date(bookingEndDates[index]);
                  let currentDate = new Date(startDate);

                  while (currentDate < endDate) {
                    const dateStr = currentDate.toISOString().split('T')[0];

                    // 해당 날짜의 예약 개수 가져오기
                    let reservedIndex = product.reservedDates.findIndex(
                      d => d.date.toISOString().split('T')[0] === dateStr
                    );

                    if (reservedIndex !== -1) {
                      product.reservedDates[reservedIndex].count -= prodCounts[index];

                      // 만약 0개가 되면 해당 날짜 데이터를 제거
                      if (product.reservedDates[reservedIndex].count <= 0) {
                        product.reservedDates.splice(reservedIndex, 1);
                      }
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                  }

                  // 객실 가용 여부 업데이트
                  const totalReserved = product.reservedDates.reduce(
                    (acc, d) => acc + d.count,
                    0
                  );
                  product.available = totalReserved < product.availableCount;

                  await product.save();
                  console.log(
                    `[서버] 객실 예약 취소 완료 - roomId: ${bookingRoomIds[index]}`
                  );
                  break;

                case 'travelItem':
                  product = await TravelItem.findById(productId);
                  product.stock += prodCounts[index];
                  break;
              }

              if (product) await product.save();
            } catch (err) {
              console.error('상품 정보 업데이트 중 오류:', err);
            }
          })
        );

        // 유저 결제 금액 차감 및 등급 업데이트
        const updatedUser = await usermembershipService.updateUserSpending(
          userId,
          -finalPrice
        );
        console.log(
          `[서버] 유저 결제 취소 반영: -${finalPrice}원, 새 등급: ${updatedUser.membershipLevel}, 총 결제 금액: ${updatedUser.totalSpent}원`
        );

        // 사용된 쿠폰 복구 처리
        if (userCouponId) {
          try {
            const userCoupon = await UserCoupon.findById(userCouponId);
            if (userCoupon) {
              userCoupon.isUsed = false; // 쿠폰 다시 사용 가능하도록 변경
              await userCoupon.save();
              console.log(
                `[서버] 취소된 예약의 쿠폰 복구 완료 - couponId: ${userCouponId}`
              );
            }
          } catch (couponError) {
            console.error(`[서버] 쿠폰 복구 중 오류 발생: ${couponError.message}`);
          }
        }

        const user = await User.findById(userId);
        if (!user) {
          console.error(`[서버] 사용자를 찾을 수 없습니다. User ID: ${userId}`);
          return;
        }

        // 등급별 마일리지 적립률 설정
        let mileageRate = 0.01; // 기본 1% (길초보)
        if (user.membershipLevel === '길잡이') {
          mileageRate = 0.03; // 길잡이 3%
        } else if (user.membershipLevel === '모험왕') {
          mileageRate = 0.05; // 모험왕 5%
        }
        console.log(
          `[서버] 유저 등급: ${user.membershipLevel}, 마일리지 차감률: ${mileageRate * 100}%`
        );

        // 취소 시 차감할 마일리지 계산 (등급별 적립된 만큼 차감)
        const deductedMileage = Math.floor(totalPrice * mileageRate);

        try {
          await userMileageService.useMileage(
            userId,
            deductedMileage,
            `예약 취소로 적립 회수 (${user.membershipLevel}, ${totalPrice.toLocaleString()}원 기준)`
          );
          console.log(`[서버] 마일리지 차감 완료: ${deductedMileage}P`);
        } catch (error) {
          console.error(`[서버] 마일리지 차감 오류: ${error.message}`);
        }

        // // 적립된 마일리지 차감 (중복 방지)
        // const earnedMileage = Math.floor(totalPrice * 0.01); // 적립된 마일리지 계산
        // if (earnedMileage > 0) {
        //   try {
        //     await userMileageService.useMileage(
        //       userId,
        //       earnedMileage,
        //       `예약 취소로 마일리지 적립 취소 (${earnedMileage.toLocaleString()}P)`
        //     );
        //   } catch (mileageError) {
        //     console.error(
        //       `[서버] 적립된 마일리지 차감 중 오류 발생: ${mileageError.message}`
        //     );
        //   }
        // }

        booking.paymentStatus = 'CANCELED';

        // 마일리지 복구 (중복 방지)
        if (usedMileage > 0) {
          try {
            const user = await User.findById(userId);
            if (user) {
              // 결제 상태가 PENDING 또는 COMPLETED일 때만 복구 실행
              if (['CANCELED'].includes(booking.paymentStatus)) {
                await user.save();

                // 마일리지 복구 내역 추가
                await userMileageService.addMileageWithHistory(
                  userId,
                  usedMileage,
                  `예약 취소로 복구 (${user.membershipLevel}, ${usedMileage.toLocaleString()}P)`
                );
              } else {
                console.log(
                  `[서버] 예약 상태가 ${booking.paymentStatus}이므로 마일리지 복구 생략`
                );
              }
            }
          } catch (mileageError) {
            console.error(`[서버] 마일리지 복구 중 오류 발생: ${mileageError.message}`);
          }
        }

        booking.updatedAt = Date.now() + 9 * 60 * 60 * 1000;
        await booking.save();
      })
    );

    return {status: 200, message: '모든 예약이 취소되었습니다.'};
  } catch (error) {
    console.error('예약 취소 중 오류:', error);
    return {status: 500, message: '예약 취소 중 오류 발생'};
  }
};

exports.getUserBookings = async userId => {
  try {
    const bookings = await Booking.find({userId}).populate({path: 'productIds'}); // 배열로 된 productIds 전체를 populate

    if (!bookings || bookings.length === 0) {
      return {status: 200, data: [], message: '예약 이력이 없습니다.'};
    }

    return {status: 200, data: bookings};
  } catch (error) {
    console.error('예약 조회 오류:', error);
    return {status: 500, message: '서버 오류'};
  }
};

exports.confirmBooking = async bookingId => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      // 예약이 존재하지 않는 경우
      return {status: 404, message: '예약을 찾을 수 없습니다.'};
    }

    if (booking.paymentStatus === 'COMPLETED') {
      booking.paymentStatus = 'CONFIRMED';
      booking.finalPrice = booking.finalPrice || booking.totalPrice; // 기본값 설정
      await booking.save();
      return {status: 200, message: '구매 확정 완료'};
    }

    return {status: 400, message: '구매 확정 불가 상태'};
  } catch (error) {
    console.error('구매 확정 오류:', error); // 오류 출력 추가
    return {status: 500, message: '구매 확정 중 오류 발생'};
  }
};

exports.scheduleAutoConfirm = async (bookingId, createdAt) => {
  // createdAt이 KST로 저장되어 있으므로, UTC로 변환
  const utcCreatedAt = new Date(createdAt.getTime() - 9 * 60 * 60 * 1000);

  const confirmTime = new Date(utcCreatedAt.getTime() + 5 * 24 * 60 * 60 * 1000); // 5일 뒤 구매 확정으로 바뀜

  try {
    schedule.scheduleJob(confirmTime, async () => {
      try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          console.log(`예약 ${bookingId} 조회 성공`);
          if (booking.paymentStatus === 'COMPLETED') {
            booking.paymentStatus = 'CONFIRMED';
            await booking.save();
            console.log(`예약 ${bookingId} 구매 확정`);
          } else {
            console.log(`예약 ${bookingId}의 결제 상태가 'COMPLETED'가 아닙니다.`);
          }
        } else {
          console.log(`예약 ${bookingId}을 찾을 수 없습니다.`);
        }
      } catch (error) {
        console.error(`예약 ${bookingId} 확정 처리 중 오류:`, error);
      }
    });
  } catch (error) {
    console.error(`스케줄 설정 중 오류:`, error);
  }
};

// bookingService.js (예시 수정본)
exports.getBookingDetails = async bookingId => {
  try {
    // 1) 예약 정보 조회 + 연관된 데이터 가져오기
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email phone') // 사용자 정보
      .populate('userCouponId', 'discountAmount') // 쿠폰 정보
      .populate('roomIds', 'name pricePerNight reservedDates'); // 객실 정보

    if (!booking) {
      return {status: 404, message: '예약 정보를 찾을 수 없습니다.'};
    }

    // 2) productIds를 동적으로 populate
    //   (tourTicket이면 title, flight면 항공편 전용 필드, package면 'Package' 모델 조회 등)
    const populatedProducts = await Promise.all(
      booking.productIds.map(async (productId, index) => {
        const model = booking.types[index]; // 현재 productId의 타입
        if (!model) return null;

        let product;
        try {
          if (model === 'package') {
            // 🔥 'package' 모델로 찾을 때, 추가로 populate
            product = await mongoose
              .model('package') // 소문자 'package' 모델
              .findById(productId)
              .populate({
                path: 'accommodations', // 1차: accommodations
                populate: {
                  path: 'rooms', // 2차: accommodations 내부의 rooms
                  model: 'Room' // 실제 Room 모델에서 데이터를 가져옴
                }
              })
              .populate('flights.flightId') // 항공편 실제 정보
              .populate('tours'); // 투어 정보

            if (!product) return null;

            // 패키지 전용 필드들 추출
            return {
              _id: product._id,
              name: product.name,
              description: product.description,
              price: product.price,
              discountRate: product.discountRate || 0,
              finalPrice: product.finalPrice || product.price,
              accommodations: product.accommodations || [],
              flights: product.flights || [],
              tours: product.tours || []
            };
          } else if (model === 'flight') {
            // flight 전용 필드
            product = await mongoose.model('flight').findById(productId);
            if (!product) return null;
            return {
              _id: product._id,
              name: product.airline,
              flightNumber: product.flightNumber, // 예) "대한항공 - KE123"
              price: product.price,
              seatsAvailable: product.seatsAvailable,
              departure: product.departure,
              arrival: product.arrival,
              departuredate: product.departure.date
            };
          } else if (model === 'tourTicket') {
            product = await mongoose.model('tourTicket').findById(productId);
            if (!product) return null;
            return {
              _id: product._id,
              name: product.title, // 투어티켓은 title 사용
              price: product.price
            };
          } else {
            // accommodation, travelItem 등 기타 타입
            product = await mongoose.model(model).findById(productId);
            if (!product) return null;
            return {
              _id: product._id,
              name: product.name,
              price: product.price
            };
          }
        } catch (err) {
          console.error(`모델(${model}) 조회 오류:`, err);
          return null;
        }
      })
    );

    // 3) booking 객체를 일반 JS 객체로 변환
    const bookingData = booking.toObject();

    // 4) 전체 상품 목록 대체 (null 제거)
    bookingData.productIds = populatedProducts.filter(p => p !== null);

    // 5) package만 따로 모아서 bookingData.packages 배열 생성
    const packageList = [];
    for (let i = 0; i < booking.types.length; i++) {
      if (booking.types[i] === 'package' && populatedProducts[i]) {
        packageList.push(populatedProducts[i]);
      }
    }
    bookingData.packages = packageList;

    return {status: 200, data: bookingData};
  } catch (error) {
    console.error('예약 상세 조회 오류:', error);
    return {status: 500, message: '서버 오류'};
  }
};
