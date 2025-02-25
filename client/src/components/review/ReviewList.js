import React, {useEffect, useState, useRef} from 'react';
import {
  getReviews,
  likeReview,
  deleteReview,
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
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
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
          setReviews(reviewsData.value);
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

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const toggleMenu = (reviewId, e) => {
    if (e) e.stopPropagation(); // 이벤트 버블링 방지
    setMenuOpen(prev => (prev === reviewId ? null : reviewId)); // 드롭다운 토글
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
      setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
    } catch (err) {
      alert(`리뷰 삭제 실패: ${err.message}`);
    }
  };

  const handleDeleteComment = async (reviewId, commentId) => {
    try {
      await deleteComment(reviewId, commentId);
      alert('댓글이 성공적으로 삭제되었습니다.');

      const updatedReviews = await getReviews(productId);
      setReviews(updatedReviews);
    } catch (error) {
      console.error('[프론트] 댓글 삭제 실패:', error.message);
      alert(`댓글 삭제 실패: ${error.message}`);
    }
  };

  const handleAddComment = async reviewId => {
    if (!commentInput.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    try {
      await addComment(reviewId, commentInput);
      alert('댓글이 작성되었습니다.');
      setCommentInput('');
      setActiveCommentBox(null);

      // 댓글 추가 후 리뷰 목록 새로고침
      const updatedReviews = await getReviews(productId);
      setReviews(updatedReviews);
    } catch (error) {
      alert(`댓글 추가 실패: ${error.message}`);
    }
  };

  const handleUpdateComment = async (reviewId, commentId) => {
    if (!editedCommentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await updateComment(reviewId, commentId, editedCommentContent);
      alert('댓글이 성공적으로 수정되었습니다.');
      setEditingCommentId(null);

      // 리뷰 목록 새로고침
      const updatedReviews = await getReviews(productId);
      setReviews(updatedReviews);
    } catch (error) {
      alert(`댓글 수정 실패: ${error.message}`);
    }
  };

  const handleAddCommentClick = reviewId => {
    setActiveCommentBox(reviewId);
    setMenuOpen(null);
  };

  const isAdmin = currentUser?.roles?.includes('admin');

  return (
    <div className="review-list">
      {reviews.length === 0 ? (
        <p className="no-reviews">등록된 리뷰가 없습니다.</p>
      ) : (
        reviews.map(review => (
          <div
            key={review._id}
            className="review-card"
            onMouseDown={e => e.stopPropagation()}>
            <div className="review-header">
              <div className="review-user-info">
                <span className="review-username">
                  {review.userId?.username || '익명 사용자'}
                </span>
                <span className="review-date">
                  &nbsp;
                  {new Date(review.createdAt).toISOString().substring(0, 10)}
                </span>
              </div>

              <div className="review-actions" ref={dropdownRef}>
                <button className="like-button" onClick={() => handleLike(review._id)}>
                  <AiOutlineLike /> {review.likes?.length || 0}
                </button>

                {(currentUser?._id === review.userId?._id || isAdmin) && (
                  <div className="kebab-menu" onMouseDown={e => e.stopPropagation()}>
                    <AiOutlineMore
                      onClick={e => toggleMenu(review._id)}
                      className="kebab-icon"
                    />

                    {menuOpen === review._id && (
                      <div
                        className="menu-options"
                        onMouseDown={e => e.stopPropagation()}>
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

                            {isAdmin && (
                              <>
                                <button onClick={() => handleAddCommentClick(review._id)}>
                                  댓글 달기
                                </button>
                                <button onClick={() => handleDelete(review._id)}>
                                  삭제하기
                                </button>
                              </>
                            )}

                            {!isAdmin && currentUser._id !== review.userId._id && (
                              <p>권한이 없습니다</p>
                            )}
                          </>
                        ) : (
                          <p>로그인이 필요합니다</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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

            <div className="review-rating">
              {[...Array(5)].map((_, index) => {
                const currentStar = index + 1;
                return (
                  <span key={index}>
                    {review.rating >= currentStar ? (
                      <AiFillStar color="#FFD700" size={20} />
                    ) : review.rating >= currentStar - 0.5 ? (
                      <FaStarHalfAlt color="#FFD700" size={20} />
                    ) : (
                      <AiOutlineStar color="#E0E0E0" size={20} />
                    )}
                  </span>
                );
              })}
            </div>

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
                  <div key={comment._id || index} className="comment">
                    {editingCommentId === comment._id ? (
                      <>
                        <textarea
                          value={editedCommentContent}
                          onChange={e => setEditedCommentContent(e.target.value)}
                          placeholder="댓글을 수정하세요..."
                        />
                        <button
                          onClick={() => handleUpdateComment(review._id, comment._id)}>
                          저장
                        </button>
                        <button onClick={() => setEditingCommentId(null)}>취소</button>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>
                            {comment.userId?.roles?.includes('admin')
                              ? '관리자'
                              : comment.userId?.username || '익명 사용자'}
                          </strong>
                          : {comment.content}
                        </p>

                        {/* 관리자일 때만 수정/삭제 버튼 노출 */}
                        {currentUser?.roles?.includes('admin') && (
                          <div className="comment-actions">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditedCommentContent(comment.content);
                              }}>
                              수정
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteComment(review._id, comment._id)
                              }>
                              삭제
                            </button>
                          </div>
                        )}
                      </>
                    )}
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
