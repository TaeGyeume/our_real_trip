import React from 'react';

const ReservationInfo = ({booking}) => {
  if (!booking.reservationInfo) return <p>예약자 정보 없음</p>;

  return (
    <>
      <h4>예약자 정보</h4>
      <p>
        <strong>이름:</strong> {booking.reservationInfo.name || '정보 없음'}
      </p>
      <p>
        <strong>이메일:</strong> {booking.reservationInfo.email || '정보 없음'}
      </p>
      <p>
        <strong>연락처:</strong> {booking.reservationInfo.phone || '정보 없음'}
      </p>
    </>
  );
};

export default ReservationInfo;
