import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getReviews} from '../../api/review/reviewService';
import {fetchTravelItemDetail} from '../../api/travelItem/travelItemService';
import {useReviewContext} from '../../contexts/ReviewContext';
import authAPI from '../../api/auth/auth';
import './styles/TravelItemDetailPage.css';
import ReviewList from '../../components/review/ReviewList';
import {
  FaChevronRight,
  FaChevronDown,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaCreditCard,
  FaShareAlt,
  FaBolt,
  FaQuestionCircle,
  FaChevronUp
} from 'react-icons/fa';
import {Alert, Snackbar} from '@mui/material';

const TravelItemDetailPage = () => {
  const {itemId} = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [imageError] = useState(false); // 이미지 오류 상태 추가
  const [showDetails, setShowDetails] = useState(false);
  const {setReviewStatus} = useReviewContext();
  const [ratingInfo, setRatingInfo] = useState({avgRating: 0, reviewCount: 0});
  const [openAlert, setOpenAlert] = useState(false);
  const reviewSectionRef = useRef(null);
  const scrollToReviews = () => {
    if (reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfile = await authAPI.getUserProfile();
        return userProfile; // userProfile을 반환
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
        return null;
      }
    };

    const fetchItem = async () => {
      try {
        const data = await fetchTravelItemDetail(itemId);
        setItem(data);
      } catch (error) {
        console.error('상품 상세정보 불러오기 실패:', error);
      }
    };

    const fetchReviews = async currentUser => {
      try {
        const data = await getReviews(itemId);
        if (!Array.isArray(data)) {
          return;
        }

        const updatedReviewStatus = {};
        if (currentUser && currentUser._id) {
          data.forEach(review => {
            if (review.userId._id === currentUser._id) {
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

    fetchUserProfile().then(currentUser => {
      fetchItem();
      fetchReviews(currentUser);
    });
  }, [itemId, setReviewStatus]);

  if (!item) {
    return <p className="text-center">⏳ 상품 정보를 불러오는 중...</p>;
  }

  // 기본 이미지 설정 (이미지 에러 발생 시 변경)
  let imageUrl = '/default-image.jpg';
  if (!imageError && Array.isArray(item.images) && item.images.length > 0) {
    imageUrl = item.images[0];

    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `${SERVER_URL}${imageUrl}`;
    }
  }

  const handleReserve = () => {
    navigate(`/travelItems/purchase/${item._id}`);
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
            <span>서울</span>
          </div>

          <h1 className="user-detail-ticket-title">{item.name}</h1>

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
              productId={itemId}
              setRatingInfo={setRatingInfo}
              ratingInfo={ratingInfo[itemId] || {avgRating: 0, reviewCount: 0}}
              showOnlySummary={true}
            />
            <FaChevronRight className="more-icon" onClick={scrollToReviews} />
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
        <div className="user-detail-ticket-description">{item.description}</div>

        <div className="user-detail-details-section">
          <div className="user-detail-image-list">
            <div className="user-detail-image-wrapper">
              <img src={imageUrl} alt={item.name} />
              {!showDetails && (
                <div className="user-detail-image-overlay">
                  <button
                    className="user-detail-toggle-button"
                    onClick={() => setShowDetails(true)}>
                    상품 설명 더 보기 &nbsp;
                    <FaChevronDown />
                  </button>
                </div>
              )}
            </div>

            {/* 더보기 클릭 시 나머지 이미지 표시 */}
            {showDetails && (
              <>
                {item.images.slice(1).map((image, index) => {
                  let fullImageUrl = image.startsWith('/uploads/')
                    ? `${SERVER_URL}${image}`
                    : image;

                  return (
                    <div className="image-wrapper" key={index}>
                      <img src={fullImageUrl} alt={`${item.name} 이미지 ${index + 2}`} />
                    </div>
                  );
                })}

                {/* 이미지 접기 버튼 */}
                <div
                  style={{display: 'flex', justifyContent: 'center', marginTop: '10px'}}>
                  <button
                    className="user-detail-toggle-button close-btn"
                    onClick={() => setShowDetails(false)}>
                    상품 설명 접기 &nbsp;
                    <FaChevronUp />
                  </button>
                </div>
              </>
            )}
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
                productId={itemId}
                setRatingInfo={setRatingInfo}
                ratingInfo={ratingInfo[itemId] || {avgRating: 0, reviewCount: 0}}
                showOnlySummary={true}
              />
            </span>
          </h2>
          <ReviewList
            productId={itemId}
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
            <p className="user-detail-original-price">{item.price.toLocaleString()}원</p>
          </div>

          <button className="user-detail-reserve-button" onClick={handleReserve}>
            ⚡ 예약하기
          </button>

          <p className="user-detail-instant-confirmation">
            <FaBolt /> 구매 후 즉시 확정됩니다. <FaQuestionCircle />
          </p>
        </div>
      </div>
    </div>
  );
};

export default TravelItemDetailPage;
