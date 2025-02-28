import React, {useEffect, useState, useRef} from 'react';
import {
  getReviews,
  deleteReview,
  updateReview,
  addComment,
  deleteComment,
  updateComment,
  toggleLike
} from '../../api/review/reviewService';
import {
  AiOutlineLike,
  AiFillLike,
  AiOutlineMore,
  AiFillStar,
  AiOutlineStar
} from 'react-icons/ai';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import {FaStarHalfAlt, FaStar} from 'react-icons/fa';
import './styles/ReviewList.css';
import authAPI from '../../api/auth/auth';
import {useAuthStore} from '../../store/authStore';
import {Button} from '@mui/material';

const ReviewList = ({productId, setRatingInfo, ratingInfo, showOnlySummary = false}) => {
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedImages, setEditedImages] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [activeCommentBox, setActiveCommentBox] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');

  const [topReview, setTopReview] = useState(null); // 좋아요 많은 리뷰
  const [visibleReviews, setVisibleReviews] = useState(0); // 초기 표시 개수

  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsData, userData] = await Promise.allSettled([
          getReviews(productId),
          authAPI.getUserProfile()
        ]);

        let validReviews = [];

        if (reviewsData.status === 'fulfilled') {
          const {reviews = []} = reviewsData.value;

          validReviews = Array.isArray(reviews) ? reviews : [];
          setReviews(validReviews);
        } else {
          console.error('리뷰 불러오기 실패:', reviewsData.reason);
        }

        if (userData.status === 'fulfilled') {
          setCurrentUser(userData.value);
        } else {
          setCurrentUser(null); // 비로그인 상태
        }

        // 평점 계산
        const totalRating = validReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating =
          validReviews.length > 0 ? (totalRating / validReviews.length).toFixed(1) : 0;

        const sortedReviews = [...validReviews].sort((a, b) => b.likes - a.likes);

        setRatingInfo({avgRating, reviewCount: validReviews.length});
        setTopReview(sortedReviews.length > 0 ? sortedReviews[0] : null);
        setReviews(sortedReviews.slice(1)); // 나머지 리뷰 저장
      } catch (err) {
        console.error('데이터 불러오기 오류:', err);
      }
    };

    fetchData();
  }, [productId, setRatingInfo]);

  useEffect(() => {
    const handleDocumentClick = () => {
      setMenuOpen(null); // 외부 클릭 시 드롭다운 닫기
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // `showOnlySummary === true`일 때는 평점 & 리뷰 개수만 표시
  if (showOnlySummary) {
    return (
      <div className="rating-summary">
        <strong>
          <FaStar color="dodgerblue" size={16} />
          &nbsp;{ratingInfo?.avgRating || 0}
        </strong>{' '}
        ({ratingInfo?.reviewCount || 0} 리뷰)
      </div>
    );
  }

  // 평점 통계 계산
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
      const {user} = useAuthStore.getState();
      if (!user || !user._id) {
        return;
      }

      const updatedReview = await toggleLike(reviewId, user._id);

      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === updatedReview._id
            ? {...updatedReview, userId: review.userId}
            : review
        )
      );
    } catch (error) {
      console.error('좋아요 요청 실패:', error);
    }
  };

  const handleDelete = async reviewId => {
    try {
      await deleteReview(reviewId);
      alert('리뷰가 삭제되었습니다.');
      const updatedReviews = reviews.filter(review => review._id !== reviewId);
      setReviews(updatedReviews);
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

      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {...review, content: editedContent, images: editedImages}
            : review
        )
      );
    } catch (error) {
      alert(`리뷰 수정 실패: ${error.message}`);
    }
  };

  const handleAddComment = async reviewId => {
    if (!commentInput.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    try {
      const newComment = await addComment(reviewId, commentInput);
      alert('댓글이 작성되었습니다.');
      setCommentInput('');
      setActiveCommentBox(null);

      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {...review, comments: [...review.comments, newComment]}
            : review
        )
      );
    } catch (error) {
      alert(`댓글 추가 실패: ${error.message}`);
    }
  };

  const handleDeleteComment = async (reviewId, commentId) => {
    try {
      await deleteComment(reviewId, commentId);
      alert('댓글이 성공적으로 삭제되었습니다.');

      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                comments: review.comments.filter(comment => comment._id !== commentId)
              }
            : review
        )
      );
    } catch (error) {
      console.error('[프론트] 댓글 삭제 실패:', error.message);
      alert(`댓글 삭제 실패: ${error.message}`);
    }
  };

  const handleUpdateComment = async (reviewId, commentId) => {
    if (!editedCommentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    console.log('댓글 수정 요청:', {reviewId, commentId, editedCommentContent});

    if (!reviewId || !commentId) {
      alert('잘못된 리뷰 ID 또는 댓글 ID입니다.');
      return;
    }

    try {
      await updateComment(reviewId, commentId, editedCommentContent);
      alert('댓글이 성공적으로 수정되었습니다.');
      setEditingCommentId(null);

      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                comments: review.comments.map(comment =>
                  comment._id === commentId
                    ? {...comment, content: editedCommentContent}
                    : comment
                )
              }
            : review
        )
      );
    } catch (error) {
      alert(`댓글 수정 실패: ${error.message}`);
    }
  };

  const handleAddCommentClick = reviewId => {
    setActiveCommentBox(reviewId);
    setMenuOpen(null);
  };

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setEditedImages(prevImages => [...prevImages, ...files]);
  };

  const handleRemoveImage = index => {
    setEditedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const isAdmin = currentUser?.roles?.includes('admin');
  const remainingReviews = reviews;

  return (
    <div className="review-list">
      {reviews.length === 0 ? (
        <p className="no-reviews">등록된 리뷰가 없습니다.</p>
      ) : (
        <>
          {/* 가장 좋아요 많은 리뷰 1개 최상단 고정 */}
          {topReview && (
            <div key={topReview._id} className="review-card top-review">
              <div className="review-header">
                <div className="review-user-info">
                  <span className="review-username">
                    <AccountCircleRoundedIcon style={{color: 'gray'}} />{' '}
                    {topReview.userId?.username || '익명 사용자'}
                  </span>
                  <span className="review-date">
                    &nbsp; {new Date(topReview.createdAt).toISOString().substring(0, 10)}
                  </span>
                </div>

                <div className="review-actions">
                  <button onClick={() => handleLike(topReview._id)}>
                    {topReview.likedBy.includes(currentUser?._id) ? (
                      <AiFillLike color="dodgerblue" />
                    ) : (
                      <AiOutlineLike />
                    )}
                    {topReview.likes}
                  </button>

                  {/* 베스트 메뉴 -> 케밥 메뉴 */}
                  {(currentUser?._id === topReview.userId?._id || isAdmin) && (
                    <div className="kebab-menu">
                      <AiOutlineMore
                        onClick={e => toggleMenu(topReview._id, e)}
                        className="kebab-icon"
                      />
                      {menuOpen === topReview._id && (
                        <div
                          className="menu-options"
                          onMouseDown={e => e.stopPropagation()}>
                          {currentUser ? (
                            <>
                              {currentUser._id === topReview.userId._id && (
                                <>
                                  <button onClick={() => handleEditReview(topReview)}>
                                    수정하기
                                  </button>
                                  <button onClick={() => handleDelete(topReview._id)}>
                                    삭제하기
                                  </button>
                                </>
                              )}
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleAddCommentClick(topReview._id)}>
                                    댓글 달기
                                  </button>
                                  <button onClick={() => handleDelete(topReview._id)}>
                                    삭제하기
                                  </button>
                                </>
                              )}

                              {!isAdmin && currentUser._id !== topReview.userId._id && (
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

              {/* 베스트 메뉴 -> 리뷰 수정 모드 */}
              {editingReviewId === topReview._id ? (
                <div className="edit-review">
                  <textarea
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    placeholder="리뷰를 수정하세요..."
                  />

                  <div className="edit-images">
                    {editedImages.map((img, index) => (
                      <div key={index} className="edit-image">
                        {img instanceof File ? (
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`업로드 이미지 ${index + 1}`}
                            width="100"
                          />
                        ) : (
                          <img
                            src={`http://localhost:5000${img}`}
                            alt={`기존 이미지 ${index + 1}`}
                            width="100"
                          />
                        )}
                        <button onClick={() => handleRemoveImage(index)}>삭제</button>
                      </div>
                    ))}
                  </div>

                  <input type="file" multiple onChange={handleImageChange} />
                  <button onClick={() => handleUpdateReview(topReview._id)}>저장</button>
                  <button onClick={() => setEditingReviewId(null)}>취소</button>
                </div>
              ) : (
                <>
                  <p className="review-text">{topReview.content}</p>

                  {topReview.images && topReview.images.length > 0 && (
                    <div className="review-images">
                      {topReview.images.map((image, index) => (
                        <img
                          key={index}
                          src={`http://localhost:5000${image}`}
                          alt={`리뷰 이미지 ${index + 1}`}
                          className="review-thumbnail"
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 별점 표시 */}
              <div className="review-rating">
                {[...Array(5)].map((_, index) => {
                  const currentStar = index + 1;
                  return (
                    <span key={index}>
                      {topReview.rating >= currentStar ? (
                        <AiFillStar color="dodgerblue" size={20} />
                      ) : topReview.rating >= currentStar - 0.5 ? (
                        <FaStarHalfAlt color="dodgerblue" size={20} />
                      ) : (
                        <AiOutlineStar color="#E0E0E0" size={20} />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* 베스트 리뷰 댓글 작성 */}
              {activeCommentBox === topReview._id && (
                <div className="comment-box">
                  <textarea
                    placeholder="댓글을 입력하세요..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                  />
                  <button onClick={() => handleAddComment(topReview._id)}>
                    댓글 등록
                  </button>
                </div>
              )}

              {/* 베스트 리뷰 댓글 리스트 */}
              {topReview.comments && topReview.comments.length > 0 && (
                <div className="comment-list">
                  {topReview.comments.map((comment, index) => (
                    <div key={comment._id || index} className="comment">
                      {editingCommentId === comment._id ? (
                        <>
                          <textarea
                            value={editedCommentContent}
                            onChange={e => setEditedCommentContent(e.target.value)}
                            placeholder="댓글을 수정하세요..."
                          />
                          <button
                            onClick={() =>
                              handleUpdateComment(topReview._id, comment._id)
                            }>
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

                          {/* 관리자일 때만 수정/삭제 버튼 표시 */}
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
                                  handleDeleteComment(topReview._id, comment._id)
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
          )}

          {/* 나머지 리뷰들 */}
          {reviews.slice(0, visibleReviews).map(review => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="review-user-info">
                  <span className="review-username">
                    <AccountCircleRoundedIcon style={{color: 'gray'}} />{' '}
                    {review.userId?.username || '익명 사용자'}
                  </span>
                  <span className="review-date">
                    &nbsp; {new Date(review.createdAt).toISOString().substring(0, 10)}
                  </span>
                </div>

                <div className="review-actions">
                  <button onClick={() => handleLike(review._id)}>
                    {review.likedBy.includes(currentUser?._id) ? (
                      <AiFillLike color="dodgerblue" />
                    ) : (
                      <AiOutlineLike />
                    )}
                    {review.likes}
                  </button>

                  {/* 나머지 메뉴 -> 케밥 메뉴 */}
                  {(currentUser?._id === review.userId?._id || isAdmin) && (
                    <div className="kebab-menu" onMouseDown={e => e.stopPropagation()}>
                      <AiOutlineMore
                        onClick={e => toggleMenu(review._id, e)}
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
                                  <button onClick={() => handleEditReview(review)}>
                                    수정하기
                                  </button>
                                  <button onClick={() => handleDelete(review._id)}>
                                    삭제하기
                                  </button>
                                </>
                              )}
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleAddCommentClick(review._id)}>
                                    댓글 달기
                                  </button>
                                  <button onClick={() => handleDelete(review._id)}>
                                    삭제하기
                                  </button>
                                </>
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

              {/* 리뷰 수정 모드 */}
              {editingReviewId === review._id ? (
                <div className="edit-review">
                  <textarea
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    placeholder="리뷰를 수정하세요..."
                  />

                  <div className="edit-images">
                    {editedImages.map((img, index) => (
                      <div key={index} className="edit-image">
                        {img instanceof File ? (
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`업로드 이미지 ${index + 1}`}
                            width="100"
                          />
                        ) : (
                          <img
                            src={`http://localhost:5000${img}`}
                            alt={`기존 이미지 ${index + 1}`}
                            width="100"
                          />
                        )}
                        <button onClick={() => handleRemoveImage(index)}>삭제</button>
                      </div>
                    ))}
                  </div>

                  <input type="file" multiple onChange={handleImageChange} />

                  <button onClick={() => handleUpdateReview(review._id)}>저장</button>
                  <button onClick={() => setEditingReviewId(null)}>취소</button>
                </div>
              ) : (
                <>
                  {/* 리뷰 내용 및 이미지 표시 */}
                  <p className="review-text">{review.content}</p>

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
                </>
              )}

              {/* 별점 표시 */}
              <div className="review-rating">
                {[...Array(5)].map((_, index) => {
                  const currentStar = index + 1;
                  return (
                    <span key={index}>
                      {review.rating >= currentStar ? (
                        <AiFillStar color="dodgerblue" size={20} />
                      ) : review.rating >= currentStar - 0.5 ? (
                        <FaStarHalfAlt color="dodgerblue" size={20} />
                      ) : (
                        <AiOutlineStar color="#E0E0E0" size={20} />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* 댓글 작성 */}
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

              {/* 댓글 리스트 */}
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
                          {isAdmin && (
                            <div className="comment-actions">
                              <button onClick={() => setEditingCommentId(comment._id)}>
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
          ))}

          {/* 리뷰 더 보기 버튼 */}
          {visibleReviews < reviews.length && (
            <button
              className="load-more-btn"
              onClick={() => setVisibleReviews(prev => prev + 5)}>
              리뷰 더 보기 ▼
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewList;
