import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  getMyBookings,
  cancelBooking,
  confirmBooking
} from '../../api/booking/bookingService';
import {getReviews} from '../../api/review/reviewService';
import {useReviewContext} from '../../contexts/ReviewContext';
import {useAuthStore} from '../../store/authStore';
import './styles/MyBookingList.css';

const MyBookingList = ({status}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {reviewStatus, setReviewStatus} = useReviewContext();
  const navigate = useNavigate();

  const {user} = useAuthStore();
  const userId = user?._id;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getMyBookings();

        if (!data || data.length === 0) {
          setError('예약 내역이 없습니다.');
          return;
        }

        const reviewsStatus = {};
        const uniqueProductIds = new Set();

        data.forEach(booking => {
          booking.productIds.forEach(product => {
            const productId = product._id || product;
            uniqueProductIds.add(productId.toString());
          });
        });

        await Promise.all(
          Array.from(uniqueProductIds).map(async productId => {
            const response = await getReviews(productId.toString()).catch(err => {
              console.error(`리뷰 조회 실패 (Product ID: ${productId}):`, err);
              return []; // 에러 발생 시 빈 배열 반환
            });

            const reviews = Array.isArray(response) ? response : response.reviews || [];

            if (!Array.isArray(reviews)) {
              console.error(`리뷰 데이터가 배열이 아닙니다.`, reviews);
              return; // 배열이 아니면 해당 productId 스킵
            }

            data.forEach(booking => {
              const merchant_uid = booking.merchant_uid;

              const hasReview = reviews.some(
                r =>
                  String(r.userId?._id || r.userId) === String(userId) &&
                  r.bookingId?.toString() === booking._id?.toString()
              );

              if (!reviewsStatus[productId]) {
                reviewsStatus[productId] = {};
              }

              reviewsStatus[productId][merchant_uid] = hasReview;
            });
          })
        );

        setReviewStatus(prev => ({...prev, ...reviewsStatus}));
        setBookings(data);
      } catch (err) {
        console.error('예약 내역 불러오기 실패:', err);
        setError('예약 내역 불러오기 실패');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [setReviewStatus, userId]);

  const handleCancel = async bookingId => {
    try {
      const response = await cancelBooking(bookingId);
      if (response.status === 200) {
        alert('예약이 정상적으로 취소되었습니다.');
        setBookings(prev =>
          prev.map(booking =>
            booking._id === bookingId ? {...booking, paymentStatus: 'CANCELED'} : booking
          )
        );
      } else {
        alert(`예약 취소 실패: ${response.message}`);
      }
    } catch (error) {
      alert(`예약 취소 오류 발생: ${error.message}`);
    }
  };

  const handleConfirm = async bookingId => {
    try {
      const response = await confirmBooking(bookingId);
      if (response.status === 200) {
        alert('구매가 확정되었습니다.');
        setBookings(prev =>
          prev.map(booking =>
            booking._id === bookingId ? {...booking, paymentStatus: 'CONFIRMED'} : booking
          )
        );
      } else {
        alert(`구매 확정 실패: ${response.message}`);
      }
    } catch (error) {
      alert('구매 확정 중 오류 발생');
    }
  };

  const handleReview = (productId, bookingId) => {
    navigate(`/reviews/create?productId=${productId}&bookingId=${bookingId}`);
  };

  if (loading) return <p className="loading-text">로딩 중...</p>;
  if (error) return <p className="error-text">{error}</p>;

  const filteredBookings = bookings
    .filter(booking => {
      if (status === 'completed') {
        return (
          booking.paymentStatus === 'COMPLETED' || booking.paymentStatus === 'CONFIRMED'
        );
      } else if (status === 'canceled') {
        return booking.paymentStatus === 'CANCELED';
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="booking-list-container">
      <h2>{status === 'completed' ? '예약 완료' : '예약 취소'}</h2>
      {filteredBookings.length === 0 ? (
        <p className="no-bookings">해당하는 예약이 없습니다.</p>
      ) : (
        <div className="booking-grid">
          {filteredBookings.map(booking => (
            <div
              key={booking._id}
              className={`booking-card ${status === 'canceled' ? 'canceled' : status === 'confirmed' ? 'confirmed' : ''}`}>
              <div className="booking-header">
                <span className="booking-date">
                  주문 일자:&nbsp;
                  {new Date(booking.createdAt)
                    .toISOString()
                    .replace('T', ' | ')
                    .substring(0, 21)}
                </span>

                {/* 구매 확정 또는 리뷰 버튼 */}
                {status === 'completed' && booking.paymentStatus === 'COMPLETED' && (
                  <div className="booking-buttons">
                    <button
                      className="confirm-button"
                      onClick={() => handleConfirm(booking._id)}>
                      구매 확정
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() => handleCancel(booking._id)}>
                      예약 취소
                    </button>
                  </div>
                )}

                {status === 'completed' && booking.paymentStatus === 'CONFIRMED' && (
                  <div className="booking-buttons">
                    {booking.types.includes('flight') ? (
                      /* 항공 상품이면 리뷰 버튼 없이 구매 확정 완료 버튼 유지 */
                      <button className="confirm-button" disabled>
                        구매 확정 완료
                      </button>
                    ) : /* 리뷰 작성 상태에 따라 버튼 변경 */
                    reviewStatus?.[booking.productIds[0]._id]?.[booking.merchant_uid] ? (
                      <button className="review-done-button" disabled>
                        리뷰 작성 완료
                      </button>
                    ) : (
                      <button
                        className="review-button"
                        onClick={() =>
                          handleReview(booking.productIds[0]._id, booking._id)
                        }>
                        리뷰 작성
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 예약 상세 정보 */}
              {booking.productIds.map((product, idx) => (
                <React.Fragment key={idx}>
                  {idx === 0 ? (
                    <div className="booking-content">
                      <p>주문번호: {booking.merchant_uid}</p>
                      <p>수량: {booking.counts.length}개</p>
                      <p>가격: {booking.totalPrice.toLocaleString()} 원</p>
                      <strong>
                        {booking.paymentStatus === 'COMPLETED'
                          ? '🟢 완료'
                          : booking.paymentStatus === 'CANCELED'
                            ? '🔴 취소됨'
                            : booking.paymentStatus === 'CONFIRMED'
                              ? '🔵 구매 확정'
                              : ''}
                      </strong>
                    </div>
                  ) : idx === 1 ? (
                    <div className="booking-content">
                      <br />
                      <p>그 외 상품 {booking.productIds.length - 1}개</p>
                    </div>
                  ) : null}
                </React.Fragment>
              ))}

              {/* 상세 페이지 링크 */}
              <div className="booking-footer">
                <a href={`/booking/detail/${booking._id}`} className="detail-link">
                  {'>> 상세 페이지로 이동'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingList;
