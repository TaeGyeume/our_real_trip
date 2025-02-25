import React from 'react';
import {useNavigate} from 'react-router-dom';

const TravelItemInfo = ({booking}) => {
  const navigate = useNavigate();

  const handleTravelItemClick = travelItem => {
    if (!travelItem?._id) return;
    navigate(`/travelItems/${travelItem._id}`);
  };

  if (!booking.types?.includes('travelItem') || booking.productIds?.length === 0)
    return null;

  return (
    <>
      <h4>여행 용품 정보</h4>
      {booking.productIds.map((product, index) => (
        <div
          key={product._id}
          className="card p-2 mb-2"
          style={{cursor: 'pointer'}}
          onClick={() => handleTravelItemClick(product)}>
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

export default TravelItemInfo;
