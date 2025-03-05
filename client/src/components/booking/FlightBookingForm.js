import React, {useEffect, useState} from 'react';
import {createBooking, verifyPayment} from '../../api/booking/bookingService';
import {authAPI} from '../../api/auth/index';
import MileageInput from '../mileage/MileageInput';

const FlightBookingForm = ({selectedFlights, passengers, onBookingSuccess}) => {
  const [user, setUser] = useState(null);
  const [usedMileage, setUsedMileage] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getUserProfile();
        setUser(userData);
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      }
    };
    fetchUser();
  }, []);

  if (!user) return <p>사용자 정보를 불러오는 중...</p>;

  const totalPrice =
    selectedFlights.reduce((sum, flight) => sum + flight.price, 0) * passengers;

  const handleBooking = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // 한국 시간
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, ''); // YYMMDDHHMMSS
    const merchant_uid = `${user.username}_${formattedDate}`;

    const bookingData = {
      types: selectedFlights.map(() => 'flight'),
      productIds: selectedFlights.map(flight => flight._id),
      counts: Array(selectedFlights.length).fill(passengers),
      totalPrice,
      usedMileage,
      userId: user._id,
      reservationInfo: {name: user.username, email: user.email, phone: user.phone},
      merchant_uid,
      startDates: selectedFlights[0].departure.date,
      endDates: selectedFlights[selectedFlights.length - 1].arrival.date
    };

    try {
      const bookingResponse = await createBooking(bookingData);
      console.log('예약 생성 성공:', bookingResponse);

      const {IMP} = window;
      IMP.init('imp22685348');

      const paymentAmount = totalPrice - usedMileage;

      IMP.request_pay(
        {
          pg: 'html5_inicis.INIpayTest',
          pay_method: 'card',
          merchant_uid,
          name: '항공권 예약',
          amount: paymentAmount,
          buyer_email: user.email,
          buyer_name: user.username,
          buyer_tel: user.phone
        },
        async rsp => {
          if (rsp.success) {
            console.log('결제 성공:', rsp);
            const verifyResponse = await verifyPayment({
              imp_uid: rsp.imp_uid,
              merchant_uid,
              userId: user._id,
              usedMileage
            });

            if (verifyResponse.message === '결제 검증 성공') {
              alert('항공권 예약이 완료되었습니다.');
              onBookingSuccess();
            } else {
              alert(`결제 검증 실패: ${verifyResponse.message}`);
            }
          } else {
            alert(`결제 실패: ${rsp.error_msg}`);
          }
        }
      );
    } catch (error) {
      console.error('예약 및 결제 중 오류 발생:', error);
      alert('예약 및 결제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flight-booking-form">
      <h3>✈️ 항공권 예약</h3>
      <p>👥 인원수: {passengers}명</p>
      <p>💰 총 예약 비용: {(totalPrice - usedMileage).toLocaleString()} 원</p>

      <MileageInput
        userMileage={user.mileage}
        totalPrice={totalPrice}
        discountAmount={0}
        onMileageChange={setUsedMileage}
      />

      <button className="btn btn-primary mt-3" onClick={handleBooking}>
        💳 결제 및 예약 확정
      </button>
    </div>
  );
};

export default FlightBookingForm;
