import React, {useEffect, useState, useRef} from 'react';
import {
  getReviews,
  likeReview,
  deleteReview,
  updateReview,
  addComment,
  deleteComment,
  updateComment
} from '../../api/review/reviewService';
import {AiOutlineLike, AiOutlineMore, AiFillStar, AiOutlineStar} from 'react-icons/ai';
import {FaStarHalfAlt} from 'react-icons/fa';
import './styles/ReviewList.css';
import authAPI from '../../api/auth/auth';

const ReviewList = ({productId}) => {
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);

  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedImages, setEditedImages] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [activeCommentBox, setActiveCommentBox] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsData, userData] = await Promise.allSettled([
          getReviews(productId),
          authAPI.getUserProfile()
        ]);

        if (reviewsData.status === 'fulfilled') {
          const {reviews = []} = reviewsData.value;

          // ✅ 배열 확인 및 상태 업데이트
          const validReviews = Array.isArray(reviews) ? reviews : [];
          setReviews(validReviews);
          calculateRatingStats(validReviews);
        } else {
          console.error('리뷰 불러오기 실패:', reviewsData.reason);
        }

        if (userData.status === 'fulfilled') {
          setCurrentUser(userData.value);
        } else {
          setCurrentUser(null); // 비로그인 상태
        }
      } catch (err) {
        console.error('데이터 불러오기 오류:', err);
      }
    };

    fetchData();
  }, [productId]);

  useEffect(() => {
    const handleDocumentClick = () => {
      setMenuOpen(null); // 외부 클릭 시 드롭다운 닫기
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // ✅ 평점 통계 계산
  const calculateRatingStats = reviews => {
    const total = reviews.length;
    const sumRatings = reviews.reduce((acc, review) => acc + review.rating, 0);
    const avgRating = total ? (sumRatings / total).toFixed(1) : 0;

    const distribution = [0, 0, 0, 0, 0]; // 5~1점 순서
    reviews.forEach(review => {
      const idx = 5 - Math.round(review.rating);
      distribution[idx]++;
    });

    setTotalReviews(total);
    setAverageRating(avgRating);
    setRatingDistribution(distribution);
  };

  const toggleMenu = (reviewId, e) => {
    if (e) e.stopPropagation();
    setMenuOpen(prev => (prev === reviewId ? null : reviewId));
  };

  const handleLike = async reviewId => {
    try {
      const data = await likeReview(reviewId);
      setReviews(prevReviews =>
        prevReviews.map(r => (r._id === reviewId ? {...r, likes: data.likes} : r))
      );
    } catch (err) {
      alert('좋아요 처리 실패');
    }
  };

  const handleDelete = async reviewId => {
    try {
      await deleteReview(reviewId);
      alert('리뷰가 삭제되었습니다.');
      const updatedReviews = reviews.filter(review => review._id !== reviewId);
      setReviews(updatedReviews);
      calculateRatingStats(updatedReviews);
    } catch (err) {
      alert(`리뷰 삭제 실패: ${err.message}`);
    }
  };

  const handleEditReview = review => {
    setEditingReviewId(review._id);
    setEditedContent(review.content);
    setEditedImages(review.images || []);
  };

  const handleUpdateReview = async reviewId => {
    const formData = new FormData();
    formData.append('content', editedContent);

    editedImages.forEach(img => {
      if (img instanceof File) {
        formData.append('images', img);
      }
    });

    try {
      await updateReview(reviewId, formData);
      alert('리뷰가 성공적으로 수정되었습니다.');
      setEditingReviewId(null);

      const updatedReviews = await getReviews(productId);
      setReviews(updatedReviews);
      calculateRatingStats(updatedReviews);
    } catch (error) {
      alert(`리뷰 수정 실패: ${error.message}`);
    }
  };

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setEditedImages(prevImages => [...prevImages, ...files]);
  };

  const handleRemoveImage = index => {
    setEditedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const isAdmin = currentUser?.roles?.includes('admin');

  return (
    <div className="review-list">
      {/* ✅ 평점 통계 결과 */}
      <div className="review-summary">
        <h2>리뷰 {totalReviews}</h2>
        <div className="average-rating">
          <h3>{averageRating}</h3>
          <div className="stars">
            {[...Array(5)].map((_, index) => (
              <span key={index}>
                {averageRating >= index + 1 ? (
                  <AiFillStar color="#FFD700" size={20} />
                ) : averageRating >= index + 0.5 ? (
                  <FaStarHalfAlt color="#FFD700" size={20} />
                ) : (
                  <AiOutlineStar color="#E0E0E0" size={20} />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ✅ 별점 분포 */}
        <div className="rating-distribution">
          {ratingDistribution.map((count, idx) => (
            <div key={5 - idx} className="rating-bar">
              <span>{5 - idx} ★</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{width: `${(count / totalReviews) * 100}%`}}
                />
              </div>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ 리뷰 목록 */}
      {reviews.length === 0 ? (
        <p className="no-reviews">등록된 리뷰가 없습니다.</p>
      ) : (
        reviews.map(review => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <div className="review-user-info">
                <span className="review-username">
                  👤 {review.userId?.username || '익명 사용자'}
                </span>
                <span className="review-date">
                  {new Date(review.createdAt).toISOString().substring(0, 10)}
                </span>
              </div>

              <button className="like-button" onClick={() => handleLike(review._id)}>
                <AiOutlineLike /> {review.likes?.length || 0}
              </button>
            </div>

            <p className="review-text">{review.content}</p>

            {/* 리뷰 이미지 */}
            {review.images && review.images.length > 0 && (
              <div className="review-images">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={`http://localhost:5000${image}`}
                    alt={`리뷰 이미지 ${index + 1}`}
                    className="review-thumbnail"
                  />
                ))}
              </div>
            )}

            {/* 별점 표시 */}
            <div className="review-rating">
              {[...Array(5)].map((_, index) => (
                <span key={index}>
                  {review.rating >= index + 1 ? (
                    <AiFillStar color="#FFD700" size={20} />
                  ) : review.rating >= index + 0.5 ? (
                    <FaStarHalfAlt color="#FFD700" size={20} />
                  ) : (
                    <AiOutlineStar color="#E0E0E0" size={20} />
                  )}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewList;
