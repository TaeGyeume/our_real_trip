import React from 'react';
import {useNavigate} from 'react-router-dom';

const AccommodationInfo = ({booking}) => {
  const navigate = useNavigate();

  const handleAccommodationClick = accommodation => {
    if (!accommodation?._id) return;
    navigate(`/accommodations/${accommodation._id}/detail`);
  };

  if (!booking.types?.includes('accommodation')) return null;

  // 날짜 변환 함수 (ISO 형식 -> YYYY-MM-DD)
  const formatDate = dateString => {
    if (!dateString) return '날짜 없음';
    return new Date(dateString).toISOString().split('T')[0]; // YYYY-MM-DD 형식 변환
  };

  // 체크인 & 체크아웃 날짜 가져오기
  const checkInDate = booking.startDates?.length
    ? formatDate(booking.startDates[0])
    : '날짜 없음';
  const checkOutDate = booking.endDates?.length
    ? formatDate(booking.endDates[0])
    : '날짜 없음';

  return (
    <>
      <h4>숙소 정보</h4>
      <div
        className="card p-2 mb-2"
        style={{cursor: 'pointer'}}
        onClick={() => {
          if (booking.productIds?.length > 0) {
            const firstProduct = booking.productIds.find(product =>
              booking.types.includes('accommodation')
            );
            if (firstProduct) handleAccommodationClick(firstProduct);
          }
        }}>
        {booking.productIds?.length > 0 &&
          booking.productIds
            .filter(product => booking.types.includes('accommodation'))
            .map(product => (
              <p key={product._id}>
                <strong>숙소 상품명:</strong> {product.name || '정보 없음'}
              </p>
            ))}
        {booking.roomIds?.length > 0 &&
          booking.roomIds.map(room => (
            <div key={room._id}>
              <p>
                <strong>객실명:</strong> {room.name}
              </p>
              <p>
                <strong>가격:</strong> ₩{room.pricePerNight?.toLocaleString()} / 박
              </p>
            </div>
          ))}
        {/* 숙소 예약 날짜 정보 추가 */}
        <p>
          <strong>체크인:</strong> {checkInDate}
        </p>
        <p>
          <strong>체크아웃:</strong> {checkOutDate}
        </p>
      </div>
    </>
  );
};

export default AccommodationInfo;
