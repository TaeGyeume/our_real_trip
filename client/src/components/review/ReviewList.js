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
import {FaStarHalfAlt, FaStar, FaChevronDown} from 'react-icons/fa';
import './styles/ReviewList.css';
import authAPI from '../../api/auth/auth';
import {useAuthStore} from '../../store/authStore';
import {ButtonGroup, Button} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ReviewImageGallery from './ReviewImageGallery';

const ReviewList = ({
  productId,
  setRatingInfo,
  ratingInfo,
  showOnlySummary = false,
  showReviewCount = false
}) => {
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
  const [removedImages, setRemovedImages] = useState([]); // 삭제된 기존 이미지

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);

  const [topReview, setTopReview] = useState(null); // 좋아요 많은 리뷰
  const [visibleReviews, setVisibleReviews] = useState(0); // 초기 표시 개수

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsData, userData] = await Promise.allSettled([
          getReviews(productId),
          authAPI.getUserProfile()
        ]);

        let validReviews = [];

        if (
          reviewsData.status === 'fulfilled' &&
          Array.isArray(reviewsData.value.reviews)
        ) {
          validReviews = reviewsData.value.reviews;
        } else {
          console.error('리뷰 불러오기 실패: 응답 데이터가 올바르지 않음', reviewsData);
          return;
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

        // 좋아요 순으로 정렬
        const sortedReviews = [...validReviews].sort((a, b) => b.likes - a.likes);

        // 리뷰 개수 및 평점 업데이트
        // setRatingInfo({avgRating, reviewCount: validReviews.length});
        if (validReviews.length > 0) {
          setRatingInfo(prev => {
            const updatedInfo = {
              avgRating: parseFloat(avgRating),
              reviewCount: validReviews.length
            };

            return updatedInfo;
          });
        }

        // 좋아요 가장 많은 리뷰 설정 (없으면 `null`)
        setTopReview(sortedReviews.length > 0 ? sortedReviews[0] : null);

        // 나머지 리뷰 설정
        setReviews(sortedReviews.length > 1 ? sortedReviews.slice(1) : []);
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

  // showReviewCount === true일 때 리뷰 카운트만 표시
  if (showReviewCount) {
    return <div>{ratingInfo?.reviewCount || 0}</div>;
  }

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

      // 일반 리뷰 업데이트
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === updatedReview._id
            ? {
                ...updatedReview,
                userId:
                  typeof updatedReview.userId === 'object'
                    ? updatedReview.userId // userId가 객체면 그대로 유지
                    : review.userId, // userId가 문자열이면 기존 객체 유지
                comments: updatedReview.comments.map(comment => ({
                  ...comment,
                  userId:
                    typeof comment.userId === 'object'
                      ? comment.userId // 댓글 userId가 객체면 그대로 유지
                      : review.comments.find(c => c._id === comment._id)?.userId // ✅ 기존 댓글 userId 유지
                }))
              }
            : review
        )
      );

      // 베스트 리뷰 업데이트
      setTopReview(prevTopReview =>
        prevTopReview && prevTopReview._id === updatedReview._id
          ? {
              ...updatedReview,
              userId:
                typeof updatedReview.userId === 'object'
                  ? updatedReview.userId
                  : prevTopReview.userId,
              comments: updatedReview.comments.map(comment => ({
                ...comment,
                userId:
                  typeof comment.userId === 'object'
                    ? comment.userId
                    : prevTopReview.comments.find(c => c._id === comment._id)?.userId // ✅ 기존 댓글 userId 유지
              }))
            }
          : prevTopReview
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

    // 새로 추가된 이미지
    editedImages.forEach(img => {
      if (img instanceof File) {
        formData.append('images', img);
      } else if (!removedImages.includes(img)) {
        formData.append('existingImages', img); // 기존 이미지 유지
      }
    });

    // 삭제할 이미지 목록을 FormData에 추가 (JSON 변환 제거)
    removedImages.forEach(img => {
      formData.append('removedImages', img);
    });

    // FormData 디버깅 로그 추가
    console.log('📌 [클라이언트] 서버로 보낼 데이터:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      await updateReview(reviewId, formData);
      alert('리뷰가 성공적으로 수정되었습니다.');
      setEditingReviewId(null);

      // 삭제된 이미지 제외하고 업데이트
      const filteredImages = editedImages.filter(img => !removedImages.includes(img));
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {...review, content: editedContent, images: filteredImages}
            : review
        )
      );

      setTopReview(prevTopReview =>
        prevTopReview && prevTopReview._id === reviewId
          ? {...prevTopReview, content: editedContent, images: filteredImages}
          : prevTopReview
      );

      setRemovedImages([]); // 삭제 목록 초기화
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

      setEditingCommentId(null);
      setEditedCommentContent('');
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
    setEditedImages(prevImages => {
      const newImages = [...prevImages];
      const removedImage = newImages[index];

      if (typeof removedImage === 'string') {
        // 기존 이미지인 경우 삭제 목록에 추가
        setRemovedImages(prev => [...prev, removedImage]);
      }

      return newImages.filter((_, i) => i !== index); // 배열에서 제거
    });
  };

  const handleOpenModal = (index, images) => {
    setCurrentImageIndex(index); // 선택된 이미지 인덱스 저장
    setSelectedImages(images); // 이미지 리스트 저장
    setIsModalOpen(true); // 모달 열기
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prevIndex =>
      prevIndex === 0 ? selectedImages.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prevIndex =>
      prevIndex === selectedImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  const getImageUrl = imagePath => {
    if (!imagePath) return '/default-image.jpg';

    // 배열인 경우 첫 번째 이미지 선택
    if (Array.isArray(imagePath) && imagePath.length > 0) {
      imagePath = imagePath[0];
    }

    // 문자열이 아닌 경우 기본 이미지 반환
    if (typeof imagePath !== 'string') {
      return '/default-image.jpg';
    }

    // 경로가 '/uploads/'로 시작하면 서버 URL 붙이기
    return imagePath.startsWith('/uploads/') ? `${SERVER_URL}${imagePath}` : imagePath;
  };

  const isAdmin = currentUser?.roles?.includes('admin');

  return (
    <div className="review-list">
      {reviews.length === 0 ? (
        <p className="no-reviews">등록된 리뷰가 없습니다.</p>
      ) : (
        <>
          <ReviewImageGallery topReview={topReview} reviews={reviews} />

          {/* 가장 좋아요 많은 리뷰 1개 최상단 고정 */}
          {topReview && (
            <div key={topReview._id} className="review-card top-review">
              <div className="review-header">
                <div className="review-user-info">
                  <div style={{flexDirection: 'row'}}>
                    {/* 별점 표시 */}
                    <div className="review-rating">
                      {[...Array(5)].map((_, index) => {
                        const currentStar = index + 1;
                        return (
                          <span key={index}>
                            {topReview.rating >= currentStar ? (
                              <AiFillStar color="dodgerblue" size={16} />
                            ) : topReview.rating >= currentStar - 0.5 ? (
                              <FaStarHalfAlt color="dodgerblue" size={16} />
                            ) : (
                              <AiOutlineStar color="#E0E0E0" size={16} />
                            )}
                          </span>
                        );
                      })}
                    </div>

                    <span className="review-username">
                      <AccountCircleRoundedIcon style={{color: 'gray'}} />{' '}
                      {topReview.userId?.username || '관리자'}
                    </span>
                    <span className="review-date">
                      &nbsp;{' '}
                      {new Date(topReview.createdAt).toISOString().substring(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="review-actions">
                  <button
                    className="like-button"
                    onClick={() => handleLike(topReview._id)}>
                    {topReview.likedBy.includes(currentUser?._id) ? (
                      <AiFillLike color="dodgerblue" size={20} />
                    ) : (
                      <AiOutlineLike size={20} />
                    )}
                    <span>{topReview.likes}</span>
                  </button>

                  {/* 베스트 메뉴 -> 케밥 메뉴 */}
                  {(currentUser?._id === topReview.userId?._id || isAdmin) && (
                    <div className="kebab-menu">
                      <AiOutlineMore
                        size={19}
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
                    placeholder="리뷰를 수정하세요."
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  />

                  <div className="edit-images">
                    {editedImages.map((img, index) => (
                      <div key={index} className="edit-image">
                        <div className="delete-btn-container">
                          <IconButton
                            className="delete-btn"
                            onClick={() => handleRemoveImage(index)}
                            size="small">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </div>

                        {img instanceof File ? (
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`업로드 이미지 ${index + 1}`}
                          />
                        ) : (
                          <img
                            // src={`http://localhost:5000${img}`}
                            src={getImageUrl(img)}
                            alt={`기존 이미지 ${index + 1}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="custom-file-upload">
                    <input
                      type="file"
                      id="fileInput"
                      multiple
                      onChange={handleImageChange}
                      style={{display: 'none'}}
                    />
                    <label htmlFor="fileInput" className="file-label">
                      📂 이미지 업로드
                    </label>

                    <div className="button-group">
                      <ButtonGroup variant="outlined" aria-label="Basic button group">
                        <Button onClick={() => handleUpdateReview(topReview._id)}>
                          저장
                        </Button>
                        <Button onClick={() => setEditingReviewId(null)}>취소</Button>
                      </ButtonGroup>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="review-text">{topReview.content}</p>

                  {topReview.images && topReview.images.length > 0 && (
                    <div className="review-images">
                      {topReview.images.map((image, index) => (
                        <img
                          key={index}
                          // src={`http://localhost:5000${image}`}
                          src={getImageUrl(image)}
                          alt={`리뷰 이미지 ${index + 1}`}
                          className="review-thumbnail"
                          onClick={() => {
                            if (topReview.images?.length > 0) {
                              handleOpenModal(index, topReview.images, topReview.content);
                            }
                          }}
                        />
                      ))}

                      {isModalOpen && (
                        <div className="modal-overlay" onClick={handleCloseModal}>
                          <div
                            className="modal-content"
                            onClick={e => e.stopPropagation()}>
                            <IconButton
                              className="modal-close"
                              onClick={handleCloseModal}
                              sx={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                color: 'white',
                                '&:hover': {color: 'rgba(0, 0, 0, 0.6)'}
                              }}>
                              <CloseIcon />
                            </IconButton>

                            <IconButton
                              className="modal-prev"
                              onClick={handlePrevImage}
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '10px',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                '&:hover': {color: 'rgba(0, 0, 0, 0.6)'}
                              }}>
                              <ArrowBackIosNewIcon />
                            </IconButton>

                            {/* 선택된 이미지 */}
                            <img
                              // src={`http://localhost:5000${selectedImages[currentImageIndex]}`}
                              src={getImageUrl(selectedImages[currentImageIndex])}
                              alt="확대된 이미지"
                              className="modal-image"
                            />

                            <IconButton
                              className="modal-next"
                              onClick={handleNextImage}
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: '10px',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                '&:hover': {color: 'rgba(0, 0, 0, 0.6)'}
                              }}>
                              <ArrowForwardIosIcon />
                            </IconButton>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 베스트 리뷰 댓글 작성 */}
              {activeCommentBox === topReview._id && (
                <div className="comment-box">
                  <textarea
                    placeholder="댓글을 입력하세요."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  />

                  <ButtonGroup variant="outlined" aria-label="Basic button group">
                    <Button
                      variant="outlined"
                      onClick={() => handleAddComment(topReview._id)}>
                      등록
                    </Button>
                    <Button variant="outlined" onClick={() => setActiveCommentBox(null)}>
                      취소
                    </Button>
                  </ButtonGroup>
                </div>
              )}

              {/* 베스트 리뷰 댓글 리스트 */}
              {topReview.comments && topReview.comments.length > 0 && (
                <div className="comment-list">
                  {topReview.comments.map((comment, index) => (
                    <div key={comment._id || index} className="comment">
                      {editingCommentId === comment._id ? (
                        <>
                          <div className="comment-box">
                            <textarea
                              value={editedCommentContent}
                              onChange={e => setEditedCommentContent(e.target.value)}
                              placeholder="댓글을 수정하세요."
                              rows={4}
                              cols={100}
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            />
                            <ButtonGroup
                              variant="outlined"
                              aria-label="Basic button group">
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  handleUpdateComment(topReview._id, comment._id)
                                }>
                                저장
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => setEditingCommentId(null)}>
                                취소
                              </Button>
                            </ButtonGroup>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="comment-container">
                            <div className="comment-header">
                              <div className="comment-user">
                                <strong>
                                  {comment.userId?.roles?.includes('admin')
                                    ? '관리자'
                                    : comment.userId?.username || '관리자'}
                                </strong>
                              </div>

                              {/* 관리자일 때만 수정/삭제 버튼 표시 */}
                              {isAdmin && (
                                <div className="comment-actions">
                                  <ButtonGroup
                                    variant="text"
                                    aria-label="Basic button group">
                                    <Button
                                      onClick={() => {
                                        setEditingCommentId(comment._id);
                                        setEditedCommentContent(comment.content);
                                      }}
                                      style={{color: 'rgb(124, 141, 173)'}}>
                                      수정
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleDeleteComment(topReview._id, comment._id)
                                      }
                                      style={{color: 'rgb(184, 135, 135)'}}>
                                      삭제
                                    </Button>
                                  </ButtonGroup>
                                </div>
                              )}
                            </div>
                            <div
                              className="comment-content"
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}>
                              {comment.content}
                            </div>
                          </div>
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
                  <div style={{flexDirection: 'row'}}>
                    {/* 별점 표시 */}
                    <div className="review-rating">
                      {[...Array(5)].map((_, index) => {
                        const currentStar = index + 1;

                        return (
                          <span key={index}>
                            {review.rating >= currentStar ? (
                              <AiFillStar color="dodgerblue" size={16} />
                            ) : review.rating >= currentStar - 0.5 ? (
                              <FaStarHalfAlt color="dodgerblue" size={16} />
                            ) : (
                              <AiOutlineStar color="#E0E0E0" size={16} />
                            )}
                          </span>
                        );
                      })}
                    </div>

                    <span className="review-username">
                      <AccountCircleRoundedIcon style={{color: 'gray'}} />{' '}
                      {review.userId?.username || '익명 사용자'}
                    </span>
                    <span className="review-date">
                      &nbsp; {new Date(review.createdAt).toISOString().substring(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="review-actions">
                  <button className="like-button" onClick={() => handleLike(review._id)}>
                    {review.likedBy.includes(currentUser?._id) ? (
                      <AiFillLike size={20} color="dodgerblue" />
                    ) : (
                      <AiOutlineLike size={20} />
                    )}
                    <span>{review.likes}</span>
                  </button>

                  {/* 나머지 메뉴 -> 케밥 메뉴 */}
                  {(currentUser?._id === review.userId?._id || isAdmin) && (
                    <div className="kebab-menu" onMouseDown={e => e.stopPropagation()}>
                      <AiOutlineMore
                        size={19}
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
                    placeholder="리뷰를 수정하세요."
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  />

                  <div className="edit-images">
                    {editedImages.map((img, index) => (
                      <div key={index} className="edit-image">
                        <div className="delete-btn-container">
                          <IconButton
                            className="delete-btn"
                            onClick={() => handleRemoveImage(index)}
                            size="small">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </div>

                        {img instanceof File ? (
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`업로드 이미지 ${index + 1}`}
                          />
                        ) : (
                          <img
                            // src={`http://localhost:5000${img}`}
                            src={getImageUrl(img)}
                            alt={`기존 이미지 ${index + 1}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="custom-file-upload">
                    <input
                      type="file"
                      id="fileInput"
                      multiple
                      onChange={handleImageChange}
                      style={{display: 'none'}}
                    />
                    <label htmlFor="fileInput" className="file-label">
                      📂 이미지 업로드
                    </label>

                    <div className="button-group">
                      <ButtonGroup variant="outlined" aria-label="Basic button group">
                        <Button onClick={() => handleUpdateReview(review._id)}>
                          저장
                        </Button>
                        <Button onClick={() => setEditingReviewId(null)}>취소</Button>
                      </ButtonGroup>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 리뷰 내용 및 이미지 표시 */}
                  <p
                    className="review-text"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                    {review.content}
                  </p>

                  {review.images && review.images.length > 0 && (
                    <div className="review-images">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          // src={`http://localhost:5000${image}`}
                          src={getImageUrl(image)}
                          alt={`리뷰 이미지 ${index + 1}`}
                          className="review-thumbnail"
                          onClick={() =>
                            handleOpenModal(index, review.images, review.content)
                          }
                          style={{cursor: 'pointer'}}
                        />
                      ))}

                      {isModalOpen && (
                        <div className="modal-overlay" onClick={handleCloseModal}>
                          <div
                            className="modal-content"
                            onClick={e => e.stopPropagation()}>
                            <IconButton
                              className="modal-close"
                              onClick={handleCloseModal}
                              sx={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                color: 'white',
                                '&:hover': {color: 'rgba(0, 0, 0, 0.6)'}
                              }}>
                              <CloseIcon />
                            </IconButton>

                            <IconButton
                              className="modal-prev"
                              onClick={handlePrevImage}
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '10px',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                '&:hover': {color: 'rgba(0, 0, 0, 0.6)'}
                              }}>
                              <ArrowBackIosNewIcon />
                            </IconButton>

                            {/* 선택된 이미지 */}
                            <img
                              // src={`http://localhost:5000${selectedImages[currentImageIndex]}`}
                              src={getImageUrl(selectedImages[currentImageIndex])}
                              alt="확대된 이미지"
                              className="modal-image"
                            />

                            <IconButton
                              className="modal-next"
                              onClick={handleNextImage}
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: '10px',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                '&:hover': {color: 'rgba(0, 0, 0, 0.6)'}
                              }}>
                              <ArrowForwardIosIcon />
                            </IconButton>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 댓글 작성 */}
              {activeCommentBox === review._id && (
                <div className="comment-box">
                  <textarea
                    placeholder="댓글을 입력하세요..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  />
                  <ButtonGroup variant="outlined" aria-label="Basic button group">
                    <Button
                      variant="outlined"
                      onClick={() => handleAddComment(review._id)}>
                      등록
                    </Button>
                    <Button variant="outlined" onClick={() => setActiveCommentBox(null)}>
                      취소
                    </Button>
                  </ButtonGroup>
                </div>
              )}

              {/* 댓글 리스트 */}
              {review.comments && review.comments.length > 0 && (
                <div className="comment-list">
                  {review.comments.map((comment, index) => (
                    <div key={comment._id || index} className="comment">
                      {editingCommentId === comment._id ? (
                        <>
                          <div className="comment-box">
                            <textarea
                              value={editedCommentContent}
                              onChange={e => setEditedCommentContent(e.target.value)}
                              placeholder="댓글을 수정하세요."
                              rows={4}
                              cols={100}
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            />
                            <ButtonGroup
                              variant="outlined"
                              aria-label="Basic button group">
                              <Button
                                onClick={() =>
                                  handleUpdateComment(review._id, comment._id)
                                }>
                                저장
                              </Button>
                              <Button onClick={() => setEditingCommentId(null)}>
                                취소
                              </Button>
                            </ButtonGroup>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="comment-container">
                            <div className="comment-header">
                              <div className="comment-user">
                                <strong>
                                  {comment.userId?.roles?.includes('admin')
                                    ? '관리자'
                                    : comment.userId?.username || '관리자'}
                                </strong>
                              </div>

                              {isAdmin && (
                                <div className="comment-actions">
                                  <ButtonGroup
                                    variant="text"
                                    aria-label="Basic button group">
                                    <Button
                                      onClick={() => {
                                        setEditingCommentId(comment._id);
                                        setEditedCommentContent(comment.content);
                                      }}
                                      style={{color: 'rgb(124, 141, 173)'}}>
                                      수정
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleDeleteComment(review._id, comment._id)
                                      }
                                      style={{color: 'rgb(184, 135, 135)'}}>
                                      삭제
                                    </Button>
                                  </ButtonGroup>
                                </div>
                              )}
                            </div>
                            <div
                              className="comment-content"
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}>
                              {comment.content}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 리뷰 더 보기 버튼 */}
          <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
            {visibleReviews < reviews.length && (
              <button
                className="load-more-btn"
                onClick={() => setVisibleReviews(prev => prev + 5)}>
                리뷰 더 보기&nbsp; <FaChevronDown />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewList;
