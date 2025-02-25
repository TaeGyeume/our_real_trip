import React, {useEffect, useState} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import {getRoomById} from '../../api/room/roomService';
import {createBooking, verifyPayment} from '../../api/booking/bookingService';
import {authAPI} from '../../api/auth/index';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import {cancelBooking} from '../../api/booking/bookingService';
import CouponSelector from './CouponSelector';

const BookingForm = () => {
  const {roomId} = useParams();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const defaultStartDate = searchParams.get('startDate') || '';
  const defaultEndDate = searchParams.get('endDate') || '';

  const [formData, setFormData] = useState({
    rooms: [{startDate: defaultStartDate, endDate: defaultEndDate, count: 1}]
  });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomData = await getRoomById(roomId);
        setRoom(roomData);
        await fetchUserData(roomData); // roomData를 fetchUserData에 전달
      } catch (error) {
        console.error('객실 정보를 불러오는 중 오류 발생:', error);
      }
    };

    const fetchUserData = async roomData => {
      // roomData 파라미터 추가
      try {
        const userData = await authAPI.getUserProfile();
        setUser(userData);
        const coupons = await fetchUserCoupons(userData._id);

        // 최소 예약 금액 충족하는 쿠폰만 필터링
        const validCoupons = coupons.filter(
          coupon =>
            !coupon.isUsed && coupon.coupon.minPurchaseAmount <= roomData.pricePerNight
        );

        setUserCoupons(validCoupons);
      } catch (error) {
        console.error('사용자 정보를 불러오는 중 오류 발생:', error);
      }
    };

    fetchRoom();
  }, [roomId]);

  if (!room || !user) {
    return <p>객실 정보를 불러오는 중...</p>;
  }

  // 입력값 변경 핸들러 (객실 개별 데이터 변경)
  const handleRoomChange = (index, key, value) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[index][key] = value;
    setFormData({...formData, rooms: updatedRooms});
  };

  // 새로운 객실 추가
  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [...formData.rooms, {startDate: '', endDate: '', count: 1}]
    });
  };

  // 특정 객실 삭제
  const removeRoom = index => {
    if (formData.rooms.length === 1) return; // 최소 1개 객실 유지
    const updatedRooms = formData.rooms.filter((_, i) => i !== index);
    setFormData({...formData, rooms: updatedRooms});
  };

  // 쿠폰 선택 핸들러
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setDiscountAmount(discount);
  };

  /* 예약 생성 및 결제 요청 */
  const handlePayment = async () => {
    if (formData.rooms.some(room => !room.startDate || !room.endDate)) {
      alert('모든 객실의 체크인 및 체크아웃 날짜를 선택하세요.');
      return;
    }

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // 한국 시간
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, ''); // YYMMDDHHMMSS
    const merchant_uid = `${user.username}_${formattedDate}`;

    const startDates = formData.rooms.map(room => room.startDate);
    const endDates = formData.rooms.map(room => room.endDate);
    const counts = formData.rooms.map(room => room.count);

    const nights = formData.rooms.map(room =>
      Math.ceil(
        (new Date(room.endDate) - new Date(room.startDate)) / (1000 * 60 * 60 * 24)
      )
    );
    const checkInTimes = formData.rooms.map(() => room.checkInTime || '15:00');
    const checkOutTimes = formData.rooms.map(() => room.checkOutTime || '11:00');

    const totalPrice = nights.reduce(
      (sum, night, i) => sum + night * room.pricePerNight * counts[i],
      0
    );

    const finalPrice = totalPrice - discountAmount;

    try {
      console.log('예약 요청 데이터:', {
        types: Array(formData.rooms.length).fill('accommodation'),
        productIds: Array(formData.rooms.length).fill(room.accommodation),
        roomIds: Array(formData.rooms.length).fill(room._id),
        counts,
        merchant_uid,
        startDates,
        endDates,
        totalPrice, // 총 결제 금액 (할인 전) 추가
        discountAmount, // 할인 금액 추가
        finalPrice, // 최종 결제 금액 (할인 후) 추가
        userId: user._id,
        couponId: selectedCoupon ? selectedCoupon._id : null,
        reservationInfo: {
          name: user.username,
          email: user.email,
          phone: user.phone
        },
        checkInTimes,
        checkOutTimes
      });

      const bookingResponse = await createBooking({
        types: Array(formData.rooms.length).fill('accommodation'),
        productIds: Array(formData.rooms.length).fill(room.accommodation),
        roomIds: Array(formData.rooms.length).fill(room._id),
        counts,
        merchant_uid,
        startDates,
        endDates,
        totalPrice, // 총 결제 금액 (할인 전) 추가
        discountAmount, // 할인 금액 추가
        finalPrice, // 최종 결제 금액 (할인 후) 추가
        userId: user._id,
        couponId: selectedCoupon ? selectedCoupon._id : null,
        reservationInfo: {
          name: user.username,
          email: user.email,
          phone: user.phone
        },
        checkInTimes,
        checkOutTimes
      });

      console.log('예약 생성 응답:', bookingResponse);

      if (!bookingResponse || !bookingResponse.booking) {
        throw new Error('예약 생성 실패');
      }

      const {IMP} = window;
      IMP.init('imp22685348');

      IMP.request_pay(
        {
          pg: 'html5_inicis.INIpayTest',
          pay_method: 'card',
          merchant_uid,
          name: room.name,
          amount: finalPrice,
          buyer_email: user.email,
          buyer_name: user.username,
          buyer_tel: user.phone
        },
        async rsp => {
          if (rsp.success) {
            try {
              const verifyResponse = await verifyPayment({
                imp_uid: rsp.imp_uid,
                merchant_uid,
                couponId: selectedCoupon ? selectedCoupon._id : null,
                userId: user._id
              });

              if (verifyResponse.message === '결제 검증 성공') {
                alert('예약 및 결제가 완료되었습니다.');
              } else {
                alert(`결제 검증 실패: ${verifyResponse.message}`);
              }
            } catch (error) {
              console.error('결제 검증 중 오류 발생:', error);
              alert('결제 검증 중 오류가 발생했습니다.');
            }
          } else {
            alert(`결제 실패: ${rsp.error_msg}`);
            if (selectedCoupon) {
              console.log('[클라이언트] 결제 취소, 예약 취소 요청 보냄:', merchant_uid);
              await cancelBooking(merchant_uid);
            }
          }
        }
      );
    } catch (error) {
      console.error('예약 요청 오류:', error);
      alert('예약 요청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="booking-form">
      <h3>🏨 객실명: {room.name}</h3>
      <p>💰 1박 가격: {room.pricePerNight.toLocaleString()} 원</p>

      {formData.rooms.map((roomData, index) => (
        <div key={index} className="room-group">
          <h4>🏨 객실 {index + 1}</h4>
          <label>📅 체크인 날짜</label>
          <input
            type="date"
            name="startDate"
            value={roomData.startDate}
            onChange={e => handleRoomChange(index, 'startDate', e.target.value)}
          />

          <label>📅 체크아웃 날짜</label>
          <input
            type="date"
            name="endDate"
            value={roomData.endDate}
            onChange={e => handleRoomChange(index, 'endDate', e.target.value)}
          />

          <label>🏨 예약할 객실 개수</label>
          <input
            type="number"
            name="count"
            value={roomData.count}
            min="1"
            max={room.availableCount}
            onChange={e => handleRoomChange(index, 'count', e.target.value)}
          />

          <CouponSelector
            userCoupons={userCoupons}
            itemPrice={room.pricePerNight}
            count={formData.rooms[0].count}
            onCouponSelect={handleCouponSelect}
          />

          <p>
            최종 결제 금액:{' '}
            {(
              room.pricePerNight * formData.rooms[0].count -
              discountAmount
            ).toLocaleString()}{' '}
            원
          </p>

          {formData.rooms.length > 1 && (
            <button onClick={() => removeRoom(index)}>🗑 객실 삭제</button>
          )}
        </div>
      ))}

      <button onClick={addRoom}>➕ 객실 추가</button>

      <button onClick={handlePayment} className="payment-btn">
        💳 결제하기
      </button>
    </div>
  );
};

export default BookingForm;
