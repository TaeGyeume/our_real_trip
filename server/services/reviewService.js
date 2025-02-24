const Review = require('../models/Review');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createReview = async reviewData => {
  try {
    const newReview = new Review(reviewData);
    await newReview.save();
    return newReview;
  } catch (error) {
    console.error('리뷰 등록 오류:', error);
    throw new Error(`리뷰 등록 오류: ${error.message}`);
  }
};

exports.getReviewsByProduct = async productId => {
  try {
    const reviews = await Review.find({productId}).populate('userId', 'username');
    return reviews;
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    throw new Error(`리뷰 조회 오류: ${error.message}`);
  }
};

exports.checkExistingReview = async (userId, productId, bookingId) => {
  try {
    const existingReview = await Review.findOne({userId, productId, bookingId});
    return !!existingReview; // true or false 반환
  } catch (error) {
    console.error('리뷰 확인 오류:', error);
    throw new Error(`리뷰 확인 오류: ${error.message}`);
  }
};

exports.toggleLike = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error('리뷰를 찾을 수 없습니다.');

  const index = review.likes.indexOf(userId);
  if (index === -1) {
    review.likes.push(userId);
  } else {
    review.likes.splice(index, 1);
  }
  await review.save();
  return review;
};

exports.updateReview = async (id, data, files) => {
  console.log('[서버] 리뷰 수정 서비스 호출 - id:', id, 'data:', data);
  const imagePaths = files ? files.map(file => `/uploads/${file.filename}`) : [];
  const updatedData = {...data, images: imagePaths.length > 0 ? imagePaths : data.images};
  const review = await Review.findByIdAndUpdate(id, updatedData, {new: true});
  console.log('[서버] 리뷰 수정 성공:', review);
  return review;
};

exports.deleteReview = async id => {
  try {
    console.log('[서버] 리뷰 삭제 서비스 호출 - id:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('유효하지 않은 ObjectId 형식입니다.');
    }

    // 리뷰 삭제
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    // 관련 댓글 삭제
    // await Comment.deleteMany({reviewId: id});
    console.log('[서버] 리뷰 및 댓글 삭제 성공');
  } catch (error) {
    console.error('[서버] 리뷰 삭제 실패:', error.message);
    throw error;
  }
};

// 댓글 추가 (관리자만)
exports.addComment = async (reviewId, userId, commentContent) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error('유효하지 않은 리뷰 ID입니다.');
    }

    let review = await Review.findById(reviewId);

    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (!user.roles || !user.roles.includes('admin')) {
      throw new Error('댓글 작성 권한이 없습니다.');
    }

    const newComment = {
      userId: userId,
      content: commentContent,
      createdAt: new Date(Date.now() + 9 * 60 * 60 * 1000)
    };

    review.comments.push(newComment);
    await review.save();

    // 댓글 작성자 정보 포함해서 다시 조회
    review = await Review.findById(reviewId)
      .populate('userId', 'username')
      .populate('comments.userId', 'username');

    console.log('[서버] 최종 리뷰 데이터:', JSON.stringify(review, null, 2));

    return review;
  } catch (error) {
    console.error('[서버] 댓글 추가 실패:', error.message);
    throw error;
  }
};

// 댓글 삭제
exports.deleteComment = async commentId => {
  await Comment.findByIdAndDelete(commentId);
};
