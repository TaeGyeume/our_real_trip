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

    console.log('[서버] PortOne 결제 정보:', data.response); // 결제 정보 로그 추가
    const paymentData = data.response;

    // 해당 merchant_uid에 대한 모든 예약 찾기
    const bookings = await Booking.find({merchant_uid});
    console.log('[서버] 조회된 예약 정보:', bookings); // 예약 데이터 확인

    if (!bookings.length) throw new Error('예약 데이터를 찾을 수 없습니다.');

    let totalUsedMileage = bookings.reduce(
      (sum, booking) => sum + (booking.usedMileage || 0),
      0
    );

    // 전체 예약 가격 합산
    let totalOriginalPrice = bookings.reduce(
      (sum, booking) => sum + (booking.totalPrice || 0),
      0
    );
    console.log('[서버] 예약 총 가격:', totalOriginalPrice);

    let discountAmount = 0;

    let expectedFinalAmount = totalOriginalPrice - discountAmount - totalUsedMileage;
    console.log('[서버] 예상 결제 금액:', expectedFinalAmount);

    const mongoose = require('mongoose');
    // ObjectId 변환 함수
    const toObjectId = id => {
      return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    };

    // 쿠폰 검증
    if (couponId) {
      console.log('[서버] 쿠폰 검증 시작 - couponId:', couponId, 'userId:', userId);

      const userCoupon = await UserCoupon.findOne({
        _id: toObjectId(couponId), // 쿠폰 ID 변환
        user: toObjectId(userId), // 사용자 ID 변환
        isUsed: false,
        expiresAt: {$gte: new Date()}
      }).populate('coupon'); // 실제 쿠폰 데이터 가져오기

      console.log('[서버] 조회된 UserCoupon:', userCoupon);

      if (!userCoupon || !userCoupon.coupon) {
        console.error('[서버] 쿠폰을 찾을 수 없음 또는 만료됨!');
        return {status: 400, message: '사용 가능한 쿠폰을 찾을 수 없습니다.'};
      }

      const actualCouponId = userCoupon.coupon._id; // `UserCoupon`에서 `coupon._id`를 가져옴
      console.log('[서버] 변환된 실제 쿠폰 ID:', actualCouponId);

      const coupon = userCoupon.coupon;

      // 최소 구매 금액 체크
      if (totalOriginalPrice < coupon.minPurchaseAmount) {
        return {
          status: 400,
          message: `이 쿠폰은 ${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시 사용 가능합니다.`
        };
      }

      // 할인 금액 계산
      if (coupon.discountType === 'percentage') {
        discountAmount = (totalOriginalPrice * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount > 0) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      }

      // 최종 결제 금액 업데이트
      expectedFinalAmount = totalOriginalPrice - discountAmount;

      // 쿠폰을 사용 처리
      userCoupon.isUsed = true;
      await userCoupon.save();
    }

    // 결제 예상 금액 재계산 (쿠폰 & 마일리지 동시 적용)
    expectedFinalAmount = Math.max(
      totalOriginalPrice - discountAmount - totalUsedMileage,
      0
    );
    console.log(
      `[서버] 예상 결제 금액: ${expectedFinalAmount}원 (쿠폰 ${discountAmount}원 적용, 마일리지 ${totalUsedMileage}P 적용)`
    );

    if (Math.abs(paymentData.amount - expectedFinalAmount) >= 0.01) {
      console.error(
        `결제 금액 불일치! 포트원: ${paymentData.amount}, 예상 결제 금액: ${expectedFinalAmount}`
      );

      return {status: 400, message: '결제 금액 불일치'};
    }

    // [1] 마일리지 사용 확정
    if (totalUsedMileage > 0) {
      await userMileageService.useMileage(
        userId,
        totalUsedMileage,
        `예약 결제 확정 (${totalUsedMileage.toLocaleString()}P 사용)`
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
                // 항공편 좌석 감소 로직 추가
                product = await Flight.findById(productId);
                if (!product) {
                  throw new Error('항공편 정보를 찾을 수 없습니다.');
                }

                // 좌석 감소 처리
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

                  // 해당 날짜의 예약 개수 가져오기
                  let reservedIndex = product.reservedDates.findIndex(
                    d => d.date.toISOString().split('T')[0] === dateStr
                  );
                  let reservedCountOnDate =
                    reservedIndex !== -1 ? product.reservedDates[reservedIndex].count : 0;

                  // 예약 가능 여부 체크
                  if (reservedCountOnDate + counts[index] > product.availableCount) {
                    console.error(`${dateStr} 날짜에 예약 가능한 객실 부족!`);
                    return {
                      status: 400,
                      message: `${dateStr} 날짜에 예약 가능한 객실이 부족합니다.`
                    };
                  }

                  // 예약 반영
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

                // 객실 가용 여부 업데이트 (availableCount 반영)
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
            }

            if (!product) throw new Error(`${types[index]} 상품을 찾을 수 없습니다.`);
            await product.save();
          })
        );

        // 마일리지 1% 적립
        const earnedMileage = Math.floor(booking.totalPrice * 0.01);
        await userMileageService.addMileageWithHistory(
          userId,
          earnedMileage,
          `예약 결제 적립 (${booking.totalPrice.toLocaleString()}원 기준)`
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

    console.log('[서버] 결제 검증 성공');
    return {status: 200, message: '결제 검증 성공'};
  } catch (error) {
    console.error('결제 검증 오류:', error);

    // 결제 실패 시 사용한 마일리지 복구 (중복 방지)
    const bookings = await Booking.find({merchant_uid});
    await Promise.all(
      bookings.map(async booking => {
        if (booking.usedMileage > 0) {
          // 예약이 이미 취소된 상태면 복구 실행 안 함
          if (booking.paymentStatus === 'CANCELED') {
            console.log(
              `[서버] 예약 ${booking._id}은 취소 상태이므로 마일리지 복구 생략`
            );
            return;
          }

          await userMileageService.addMileageWithHistory(
            booking.userId,
            booking.usedMileage,
            `결제 실패로 마일리지 환불 (${booking.usedMileage.toLocaleString()}P)`
          );
          console.log(`[서버] 마일리지 복구 완료: ${booking.usedMileage}P`);
        }
      })
    );

    // 결제 실패 시 쿠폰을 다시 사용 가능하게 복원
    const booking = await Booking.findOne({merchant_uid});
    if (booking && booking.userCouponId) {
      console.warn(
        `[서버] 결제 실패로 쿠폰 복원 - userCouponId: ${booking.userCouponId}`
      );

      const userCoupon = await UserCoupon.findById(booking.userCouponId);
      if (userCoupon && userCoupon.isUsed === 'reserved') {
        userCoupon.isUsed = false; // 결제 실패 시 다시 사용 가능하도록 설정
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
          totalPrice
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

        // 적립된 마일리지 차감 (중복 방지)
        const earnedMileage = Math.floor(totalPrice * 0.01); // 적립된 마일리지 계산
        if (earnedMileage > 0) {
          try {
            await userMileageService.useMileage(
              userId,
              earnedMileage,
              `예약 취소로 마일리지 적립 취소 (${earnedMileage.toLocaleString()}P)`
            );
          } catch (mileageError) {
            console.error(
              `[서버] 적립된 마일리지 차감 중 오류 발생: ${mileageError.message}`
            );
          }
        }

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
                  `예약 취소로 마일리지 복구 (${usedMileage.toLocaleString()}P)`
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

exports.getBookingDetails = async bookingId => {
  try {
    // 예약 정보 조회 + 연관된 데이터 가져오기
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email phone') // 사용자 정보 포함
      .populate('userCouponId', 'discountAmount') // 쿠폰 정보 포함
      .populate('roomIds', 'name pricePerNight reservedDates'); // 객실 정보 포함

    if (!booking) {
      return {status: 404, message: '예약 정보를 찾을 수 없습니다.'};
    }

    // productIds를 동적으로 populate (투어티켓이면 title 가져오기)
    const populatedProducts = await Promise.all(
      booking.productIds.map(async (productId, index) => {
        const model = booking.types[index]; // 현재 productId의 타입 가져오기
        if (!model) return null; // 모델이 없으면 null 반환

        const product = await mongoose.model(model).findById(productId);

        if (!product) return null;

        return {
          _id: product._id,
          name: model === 'tourTicket' ? product.title : product.name, // 투어티켓이면 title, 그 외 name
          price: product.price
        };
      })
    );

    // `toObject()`로 Mongoose 객체를 일반 JavaScript 객체로 변환
    const bookingData = booking.toObject();
    bookingData.productIds = populatedProducts.filter(p => p !== null); // productIds에 각 모델에서 가져온 실제 데이터 추가

    return {status: 200, data: bookingData};
  } catch (error) {
    console.error('예약 상세 조회 오류:', error);
    return {status: 500, message: '서버 오류'};
  }
};
