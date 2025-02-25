import React from 'react';
import {useNavigate} from 'react-router-dom';

const TourTicketInfo = ({booking}) => {
  const navigate = useNavigate();

  const handleTourTicketClick = ticket => {
    if (!ticket?._id) return;
    navigate(`/tourTicket/list/${ticket._id}`);
  };

  if (!booking.types?.includes('tourTicket') || booking.productIds?.length === 0)
    return null;

  return (
    <>
      <h4>투어/티켓 정보</h4>
      {booking.productIds.map((product, index) => (
        <div
          key={product._id}
          className="card p-2 mb-2"
          style={{cursor: 'pointer'}}
          onClick={() => handleTourTicketClick(product)}>
          <p>
            <strong>상품명:</strong> {product.name || '정보 없음'}
          </p>
          <p>
            <strong>가격:</strong> ₩{product.price?.toLocaleString() || '정보 없음'}
          </p>
          <p>
            <strong>구매 수량:</strong> {booking.counts?.[index] || '정보 없음'}
          </p>
        </div>
      ))}
    </>
  );
};

export default TourTicketInfo;
