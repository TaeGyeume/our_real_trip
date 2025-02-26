const Review = require('../models/Review');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
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
    const reviews = await Review.find({productId})
      .populate('userId', 'username')
      .populate('comments.userId', 'username roles');

    const totalReviews = reviews.length;

    const averageRating = totalReviews
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = [0, 0, 0, 0, 0]; // [5성, 4성, 3성, 2성, 1성]

    // 이미지 포함된 리뷰만 추출
    const imageReviews = reviews.filter(
      review => review.images && review.images.length > 0
    );

    return {
      reviews,
      totalReviews,
      averageRating,
      averageRating: parseFloat(averageRating.toFixed(1)),
      imageReviews
    };
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

exports.updateReview = async (reviewId, updateData, imageFiles) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error('유효하지 않은 리뷰 ID입니다.');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    if (updateData.content) {
      review.content = updateData.content;
    }

    if (imageFiles && imageFiles.length > 0) {
      const newImagePaths = imageFiles.map(file => `/uploads/${file.filename}`);
      review.images.push(...newImagePaths);
    }

    await review.save();
    return review;
  } catch (error) {
    console.error('[서버] 리뷰 수정 실패:', error.message);
    throw new Error(error.message);
  }
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

    console.log('[서버] 리뷰 및 댓글 삭제 성공');
  } catch (error) {
    console.error('[서버] 리뷰 삭제 실패:', error.message);
    throw error;
  }
};

exports.addComment = async (reviewId, userId, commentContent) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error('유효하지 않은 리뷰 ID입니다.');
    }

    let review = await Review.findById(reviewId);

    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    // 사용자 정보 가져오기 (username, roles 포함)
    const user = await User.findById(userId).select('username roles');

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (!user.roles || !user.roles.includes('admin')) {
      throw new Error('댓글 작성 권한이 없습니다.');
    }

    // 댓글 추가 (user 정보 포함)
    const newComment = {
      userId: user._id,
      content: commentContent,
      createdAt: new Date(Date.now() + 9 * 60 * 60 * 1000)
    };

    review.comments.push(newComment);
    await review.save();

    // 댓글 작성자 정보까지 포함해서 populate
    review = await Review.findById(reviewId)
      .populate('userId', 'username')
      .populate('comments.userId', 'username roles'); // 댓글 작성자 정보
  } catch (error) {
    console.error('[서버] 댓글 추가 실패:', error.message);
    throw error;
  }
};

// 댓글 삭제
exports.deleteComment = async (reviewId, commentId, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error('유효하지 않은 리뷰 ID입니다.');
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new Error('유효하지 않은 댓글 ID입니다.');
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    // 사용자 정보 확인
    const user = await User.findById(userId);

    if (!user || !user.roles.includes('admin')) {
      throw new Error('댓글 삭제 권한이 없습니다.');
    }

    // 댓글 삭제
    const initialLength = review.comments.length;
    review.comments = review.comments.filter(
      comment => comment._id.toString() !== commentId
    );

    if (initialLength === review.comments.length) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }

    await review.save();

    return review;
  } catch (error) {
    console.error('[서버] 댓글 삭제 실패:', error.message);
    throw error;
  }
};

exports.updateComment = async (reviewId, commentId, userId, newContent) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(reviewId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      throw new Error('유효하지 않은 ID입니다.');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    const user = await User.findById(userId);

    if (!user || !user.roles.includes('admin')) {
      throw new Error('댓글 수정 권한이 없습니다.');
    }

    const comment = review.comments.id(commentId);

    if (!comment) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }

    // 댓글 내용 수정
    comment.content = newContent;
    comment.updatedAt = new Date();

    await review.save();

    console.log(`[서버] 댓글 ${commentId}가 성공적으로 수정되었습니다.`);
    return review;
  } catch (error) {
    console.error('[서버] 댓글 수정 실패:', error.message);
    throw error;
  }
};
