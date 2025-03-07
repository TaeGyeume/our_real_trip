const Review = require('../models/Review');
const User = require('../models/User');
const Accommodation = require('../models/Accommodation');
const TravelItem = require('../models/TravelItem');
const mongoose = require('mongoose');
const accommodationService = require('../services/accommodationService');
const travelItemService = require('../services/travelItemService');

exports.createReview = async reviewData => {
  try {
    const newReview = new Review(reviewData);
    await newReview.save();
    // `productId`를 기반으로 숙소/여행용품 판별
    const productType = await determineProductType(reviewData.productId);
    if (!productType)
      throw new Error('해당 productId에 대한 숙소 또는 여행용품을 찾을 수 없습니다.');

    if (productType === 'accommodation') {
      await accommodationService.updateAccommodationRating(reviewData.productId);
    } else {
      await travelItemService.updateTravelItemRating(reviewData.productId);
    }
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

    // 삭제할 이미지 처리 (JSON 변환 없이 배열로 처리)
    if (updateData.removedImages && updateData.removedImages.length > 0) {
      console.log('[서버] 삭제할 이미지 목록:', updateData.removedImages);

      // 리뷰에서 해당 이미지 제거
      review.images = review.images.filter(
        img => !updateData.removedImages.includes(img)
      );
    }

    if (imageFiles && imageFiles.length > 0) {
      const newImagePaths = imageFiles.map(file => `/uploads/${file.filename}`);
      review.images.push(...newImagePaths);
    }

    await review.save();
    // `productId`를 기반으로 숙소/여행용품 판별
    const productType = await determineProductType(review.productId);
    if (productType === 'accommodation') {
      await accommodationService.updateAccommodationRating(review.productId);
    } else {
      await travelItemService.updateTravelItemRating(review.productId);
    }
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

    // `productId`를 기반으로 숙소/여행용품 판별
    const productType = await determineProductType(review.productId);
    if (productType === 'accommodation') {
      await accommodationService.updateAccommodationRating(review.productId);
    } else {
      await travelItemService.updateTravelItemRating(review.productId);
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

exports.toggleLike = async (reviewId, userId) => {
  if (!userId) throw new Error('유저 ID가 없습니다.');

  const review = await Review.findById(reviewId);
  if (!review) throw new Error('리뷰를 찾을 수 없습니다.');

  if (!Array.isArray(review.likedBy)) {
    review.likedBy = [];
  }

  const isLiked = review.likedBy.includes(userId);

  if (isLiked) {
    review.likes -= 1;
    review.likedBy = review.likedBy.filter(id => id.toString() !== userId.toString());
  } else {
    review.likes += 1;
    review.likedBy.push(userId);
  }

  await review.save();

  const updatedReview = await Review.findById(reviewId).populate('userId');

  if (!updatedReview) {
    throw new Error('리뷰 업데이트 후 데이터를 찾을 수 없습니다.');
  }

  return updatedReview;
};

exports.getBestReviews = async productId => {
  const reviews = await Review.find({productId})
    .populate('userId', 'username')
    .sort({likes: -1, createdAt: -1});

  return reviews;
};

// `productId`만으로 숙소/여행용품을 판별하는 함수
const determineProductType = async productId => {
  const objectId = new mongoose.Types.ObjectId(productId);

  // 숙소(Accommodation)인지 확인
  const isAccommodation = await Accommodation.exists({_id: objectId});
  if (isAccommodation) return 'accommodation';

  // 여행용품(TravelItem)인지 확인
  const isTravelItem = await TravelItem.exists({_id: objectId});
  if (isTravelItem) return 'travelItem';

  return null;
};
