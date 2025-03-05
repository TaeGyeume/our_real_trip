import React, {useEffect, useState, useRef} from 'react';
import {getTourTicketById} from '../../api/tourTicket/tourTicketService';
import {getReviews} from '../../api/review/reviewService';
import {useParams, useNavigate} from 'react-router-dom';
import {useReviewContext} from '../../contexts/ReviewContext';
import authAPI from '../../api/auth/auth';
import './styles/UserDetail.css';
import ReviewList from '../review/ReviewList';
import {
  FaChevronRight,
  FaChevronDown,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaCreditCard,
  FaShareAlt,
  FaBolt,
  FaQuestionCircle
} from 'react-icons/fa';
import {Alert, Snackbar, Button, TextField} from '@mui/material';

const TourTicketDetail = () => {
  const {id} = useParams();
  const {reviewStatus, setReviewStatus} = useReviewContext();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [user, setUser] = useState(null);

  const [ratingInfo, setRatingInfo] = useState({avgRating: 0, reviewCount: 0});
  const [showDetails, setShowDetails] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  const reviewSectionRef = useRef(null);

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  const scrollToReviews = () => {
    if (reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  // 기본 이미지 설정 (이미지 에러 발생 시 변경)
  let imageUrl = '/default-image.jpg';

  if (ticket && Array.isArray(ticket.images) && ticket.images.length > 0) {
    imageUrl = ticket.images[0];

    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `${SERVER_URL}${imageUrl}`;
    }
  }

  useEffect(() => {
    // 로그인된 사용자 정보 가져오기
    const fetchUserProfile = async () => {
      try {
        const userProfile = await authAPI.getUserProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      }
    };

    const fetchTicket = async () => {
      try {
        const data = await getTourTicketById(id);
        setTicket(data);
      } catch (error) {
        console.error('상품 정보를 가져오는 중 오류 발생:', error);
      }
    };

    const fetchReviews = async () => {
      try {
        const data = await getReviews(id);

        const updatedReviewStatus = {};

        // 유저 정보가 있을 때만 리뷰 상태 확인
        if (user && user._id) {
          data.forEach(review => {
            if (review.userId._id === user._id) {
              const key = `${review.productId}_${review.bookingId}`;
              updatedReviewStatus[key] = true;
            }
          });
        }

        setReviewStatus(prev => ({...prev, ...updatedReviewStatus}));
      } catch (err) {
        console.error('리뷰 조회 오류:', err);
      }
    };

    fetchUserProfile().then(() => {
      fetchTicket();
      fetchReviews();
    });
  }, [id, setReviewStatus]);

  if (!ticket) {
    return <p>상품 정보를 불러오는 중...</p>;
  }

  const handleReserve = () => {
    navigate(`/tourTicket/booking/${id}`);
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.href;

    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        setOpenAlert(true);
        setTimeout(() => setOpenAlert(false), 3000);
      })
      .catch(err => console.error('링크 복사 실패:', err));
  };

  // 현재 예약 건에 대한 리뷰 여부 체크
  const hasReview = user
    ? Object.keys(reviewStatus).some(key => key.startsWith(`${id}_`) && reviewStatus[key])
    : false;

  return (
    <div className="tour-ticket-container">
      {/* 왼쪽 div 배치 */}
      <div className="tour-ticket-detail">
        <div className="ticket-header">
          <div className="ticket-location">
            <span>대한민국&nbsp;</span>
            <FaChevronRight />
            &nbsp;
            <FaMapMarkerAlt />
            <span>{ticket.location}</span>
          </div>

          <h1 className="ticket-title">{ticket.title}</h1>

          <div className="review-summary">
            <FaShareAlt
              style={{
                top: '10px',
                right: '10px',
                border: 'none',
                background: 'none',
                fontSize: '18px',
                color: 'dark gray'
              }}
              onClick={handleCopyLink}
            />{' '}
            &nbsp;&nbsp;
            <Snackbar
              open={openAlert}
              anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
              <Alert severity="success" variant="filled">
                링크 복사 완료 🎉
              </Alert>
            </Snackbar>
            <ReviewList
              productId={id}
              setRatingInfo={setRatingInfo}
              ratingInfo={ratingInfo}
              showOnlySummary={true}
            />
            <FaChevronRight className="more-icon" onClick={scrollToReviews} />
          </div>
        </div>

        <hr className="sun" />

        <div className="credit">
          <p>
            <FaCheckCircle color="green" />
            &nbsp; <b>즉시확정</b> 구매 즉시 예약 확정 (일부 상품 이용일 추가 예약 필요)
          </p>
          <p>
            {' '}
            <FaCreditCard /> &nbsp;<b>최대 5개월 무이자 할부 가능</b>
          </p>
        </div>

        <hr className="sun" />

        <br />
        <div className="ticket-description">{ticket.description}</div>

        <div className="details-section">
          <div className="image-list">
            <div className="image-wrapper">
              {/* <img src={`http://localhost:5000${ticket.images[0]}`} alt={ticket.title} /> */}
              {/* 서버 적용 시, 주석 해제 */}
              <img src={`${imageUrl}`} alt={ticket.title} />
              {!showDetails && (
                <div className="image-overlay">
                  <button className="toggle-button" onClick={() => setShowDetails(true)}>
                    상품 설명 더 보기 &nbsp;
                    <FaChevronDown />
                  </button>
                </div>
              )}
            </div>

            {showDetails &&
              ticket.images.slice(1).map((image, index) => (
                <div className="image-wrapper" key={index}>
                  {/* <img
                    src={`http://localhost:5000${image}`}
                    alt={`${ticket.title} 이미지 ${index + 2}`}
                  /> */}
                  <img src={`${imageUrl}`} alt={`${ticket.title} 이미지 ${index + 2}`} />
                </div>
              ))}
          </div>
        </div>

        <hr className="sun" />

        <div>
          <h2
            ref={reviewSectionRef}
            style={{
              fontSize: '24px',
              textAlign: 'left',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center', // 세로 정렬
              gap: '8px' // 간격 추가
            }}>
            여행자 리뷰
            <span style={{fontSize: '24px', color: 'dodgerblue', fontWeight: 'bold'}}>
              <ReviewList
                productId={id}
                setRatingInfo={setRatingInfo}
                ratingInfo={ratingInfo}
                showReviewCount={true}
              />
            </span>
          </h2>
          <ReviewList
            productId={id}
            setRatingInfo={setRatingInfo}
            ratingInfo={ratingInfo}
            showOnlySummary={false}
          />
        </div>
      </div>

      {/* 오른쪽 div 배치 */}
      <div className="empty-space">
        <br />
        <div className="right-space">
          <div className="price-info">
            <p
              style={{
                fontFamily: `"Apple SD Gothic", "Malgun Gothic", sans-serif`,
                color: 'gray',
                fontSize: '14px'
              }}>
              일반가
            </p>
            <p className="original-price">{ticket.price.toLocaleString()}원</p>
          </div>

          {hasReview ? (
            <button className="completed-btn" disabled>
              리뷰 작성 완료
            </button>
          ) : (
            <button className="reserve-button" onClick={handleReserve}>
              ⚡ 예약하기
            </button>
          )}

          <p className="instant-confirmation">
            <FaBolt /> 구매 후 즉시 확정됩니다. <FaQuestionCircle />
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourTicketDetail;
