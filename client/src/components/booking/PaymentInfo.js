import React from 'react';

const PaymentInfo = ({booking, translatePaymentStatus, translateType}) => {
  return (
    <>
      <h2>예약 상세 정보</h2>
      <p>
        <strong>예약 번호:</strong> {booking.merchant_uid || '정보 없음'}
      </p>
      <p>
        <strong>상품 유형:</strong>
        {booking.types && booking.types.length > 0
          ? booking.types.map(type => translateType(type)).join(', ')
          : '정보 없음'}
      </p>
      <p>
        <strong>결제 상태:</strong>{' '}
        {translatePaymentStatus(booking.paymentStatus) || '정보 없음'}
      </p>
      <p>
        <strong>총 금액:</strong> ₩{booking.totalPrice?.toLocaleString() || 0}
      </p>
      <p>
        <strong>할인 금액:</strong> ₩{booking.discountAmount?.toLocaleString() || 0}
      </p>
      <p>
        <strong>최종 결제 금액:</strong> ₩{booking.finalPrice?.toLocaleString() || 0}
      </p>
    </>
  );
};

export default PaymentInfo;
