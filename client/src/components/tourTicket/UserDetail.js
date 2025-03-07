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
import {Alert, Snackbar, Button, TextField, Typography} from '@mui/material';

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

  let imageUrls = ['/default-image.jpg']; // 기본 이미지 설정

  // 이미지 경로 처리 (모든 이미지 처리)
  if (ticket && Array.isArray(ticket.images) && ticket.images.length > 0) {
    imageUrls = ticket.images.map(image => {
      if (image.startsWith('/uploads/')) {
        // 서버 경로로 이미지 URL을 변환
        return `${SERVER_URL}${image}`;
      }
      return image; // 이미 절대 URL인 경우 그대로 사용
    });
  }

  console.log(imageUrls);

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
    <div className="user-detail-tour-ticket-container">
      {/* 왼쪽 div 배치 */}
      <div className="user-detail-tour-ticket-detail">
        <div className="user-detail-ticket-header">
          <div className="user-detail-ticket-location">
            <span>대한민국&nbsp;</span>
            <FaChevronRight />
            &nbsp;
            <FaMapMarkerAlt />
            <span>{ticket.location}</span>
          </div>

          <h1 className="user-detail-ticket-title">{ticket.title}</h1>

          <div className="user-detail-review-summary">
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
            <FaChevronRight className="user-detail-more-icon" onClick={scrollToReviews} />
          </div>
        </div>

        <hr className="user-detail-sun" />

        <div className="user-detail-credit">
          <p>
            <FaCheckCircle color="green" />
            &nbsp; <b>즉시확정</b> 구매 즉시 예약 확정 (일부 상품 이용일 추가 예약 필요)
          </p>
          <p>
            {' '}
            <FaCreditCard /> &nbsp;<b>최대 5개월 무이자 할부 가능</b>
          </p>
        </div>

        <hr className="user-detail-sun" />

        <br />

        <Typography variant="body1" className="user-detail-ticket-description">
          {ticket.description.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </Typography>

        <div className="user-detail-details-section">
          <div className="user-detail-image-list">
            <div className="user-detail-image-wrapper">
              <img src={`${imageUrls[0]}`} alt={ticket.title} />
              {!showDetails && (
                <div className="user-detail-image-overlay">
                  <button className="user-detail-toggle-button" onClick={() => setShowDetails(true)}>
                    상품 설명 더 보기 &nbsp;
                    <FaChevronDown />
                  </button>
                </div>
              )}
            </div>

            {showDetails &&
              imageUrls.slice(1).map((image, index) => (
                <div className="user-detail-image-wrapper" key={index}>
                  <img src={image} alt={`${ticket.title} 이미지 ${index + 2}`} />
                </div>
              ))}
          </div>
        </div>

        <hr className="user-detail-sun" />

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
      <div className="user-detail-empty-space">
        <br />
        <div className="user-detail-right-space">
          <div className="user-detail-price-info">
            <p
              style={{
                fontFamily: `"Apple SD Gothic", "Malgun Gothic", sans-serif`,
                color: 'gray',
                fontSize: '14px'
              }}>
              일반가
            </p>
            <p className="user-detail-original-price">{ticket.price.toLocaleString()}원</p>
          </div>

          {hasReview ? (
            <button className="user-detail-completed-btn" disabled>
              리뷰 작성 완료
            </button>
          ) : (
            <button className="user-detail-reserve-button" onClick={handleReserve}>
              ⚡ 예약하기
            </button>
          )}

          <p className="user-detail-instant-confirmation">
            <FaBolt /> 구매 후 즉시 확정됩니다. <FaQuestionCircle />
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourTicketDetail;
