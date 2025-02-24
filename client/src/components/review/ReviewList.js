import React, {useEffect, useState, useRef} from 'react';
import {
  getReviews,
  likeReview,
  deleteReview,
  addComment
} from '../../api/review/reviewService';
import {AiOutlineLike, AiOutlineMore} from 'react-icons/ai';
import './styles/ReviewList.css';
import authAPI from '../../api/auth/auth';

const ReviewList = ({productId}) => {
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [activeCommentBox, setActiveCommentBox] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getReviews(productId);
        // console.log('Fetched review data:', data);
        setReviews(data);
      } catch (err) {
        console.error('리뷰 조회 오류:', err);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const user = await authAPI.getUserProfile();
        setCurrentUser(user);
      } catch (err) {
        console.error('사용자 정보 불러오기 오류:', err);
      }
    };

    fetchReviews();
    fetchCurrentUser();
  }, [productId]);

  const toggleMenu = reviewId => {
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
      alert('리뷰가 성공적으로 삭제되었습니다.');
      setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
    } catch (err) {
      console.error('[프론트] 리뷰 삭제 에러:', err.message);
      alert(`리뷰 삭제 실패: ${err.message}`);
    }
  };

  const handleAddCommentClick = reviewId => {
    setActiveCommentBox(reviewId);
    setMenuOpen(null);
  };

  const handleAddComment = async reviewId => {
    if (!commentInput.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    try {
      await addComment(reviewId, commentInput);
      alert('댓글이 성공적으로 추가되었습니다.');
      setCommentInput('');
      setActiveCommentBox(null);

      // 리뷰 목록 다시 가져오기
      const updatedReviews = await getReviews(productId);
      setReviews(updatedReviews);
    } catch (error) {
      console.error('[프론트] 댓글 추가 실패:', error.message);
      alert(`댓글 추가 실패: ${error.message}`);
    }
  };

  return (
    <div className="review-list">
      {reviews.length === 0 ? (
        <p className="no-reviews">등록된 리뷰가 없습니다.</p>
      ) : (
        reviews.map(review => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <span className="review-username">
                {review.userId?.username || '익명 사용자'}
              </span>
              <span className="review-date">
                {new Date(review.createdAt).toISOString().substring(0, 10)}
              </span>

              <div className="review-actions" ref={dropdownRef}>
                <button className="like-button" onClick={() => handleLike(review._id)}>
                  <AiOutlineLike /> {review.likes || 0}
                </button>

                <div className="kebab-menu">
                  <AiOutlineMore
                    onClick={() => toggleMenu(review._id)}
                    className="kebab-icon"
                  />

                  {menuOpen === review._id && (
                    <div className="menu-options">
                      {currentUser ? (
                        <>
                          {currentUser._id === review.userId._id && (
                            <>
                              <button
                                onClick={() => alert(`리뷰 ${review._id} 수정하기`)}>
                                수정하기
                              </button>
                              <button onClick={() => handleDelete(review._id)}>
                                삭제하기
                              </button>
                            </>
                          )}

                          {currentUser.roles?.includes('admin') && (
                            <>
                              <button onClick={() => handleAddCommentClick(review._id)}>
                                댓글 달기
                              </button>
                              <button onClick={() => handleDelete(review._id)}>
                                삭제하기
                              </button>
                            </>
                          )}

                          {!currentUser.roles?.includes('admin') &&
                            currentUser._id !== review.userId._id && (
                              <p>권한이 없습니다</p>
                            )}
                        </>
                      ) : (
                        <p>로그인이 필요합니다</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

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

            <p className="review-text">{review.content}</p>

            {activeCommentBox === review._id && (
              <div className="comment-box">
                <textarea
                  placeholder="댓글을 입력하세요..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                />
                <button onClick={() => handleAddComment(review._id)}>댓글 등록</button>
              </div>
            )}

            {review.comments && review.comments.length > 0 && (
              <div className="comment-list">
                {review.comments.map((comment, index) => (
                  <div key={comment.createdAt || index} className="comment">
                    <p>
                      <strong>{comment.userId?.username || '익명 사용자'}</strong>:{' '}
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewList;
