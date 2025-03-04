const reviewService = require('../services/reviewService');

exports.createReview = async (req, res) => {
  try {
    const {userId, productId, bookingId, rating, content, images} = req.body;

    if (!userId || !bookingId || !productId) {
      return res
        .status(400)
        .json({message: '리뷰 등록 오류: userId, bookingId, productId가 필요합니다.'});
    }

    // 주문번호까지 포함하여 기존 리뷰 여부 체크
    const hasReview = await reviewService.checkExistingReview(
      userId,
      productId,
      bookingId
    );

    if (hasReview) {
      return res
        .status(400)
        .json({message: '이미 해당 주문 건에 대한 리뷰를 작성하셨습니다!'});
    }

    // 새로운 리뷰 생성
    const newReview = await reviewService.createReview({
      userId,
      productId,
      bookingId,
      rating,
      content,
      images
    });
    res.status(201).json(newReview);
  } catch (error) {
    console.error('리뷰 등록 오류:', error);
    res.status(500).json({message: `리뷰 등록 오류: ${error.message}`});
  }
};

exports.getReviews = async (req, res) => {
  const {productId} = req.params;

  try {
    const {reviews, totalReviews, averageRating} =
      await reviewService.getReviewsByProduct(productId);

    res.status(200).json({
      reviews,
      totalReviews,
      averageRating
    });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    res.status(500).json({message: error.message});
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    console.log('[서버] 삭제 요청된 리뷰 ID:', reviewId);

    if (!reviewId || reviewId === 'productType') {
      return res.status(400).json({message: '리뷰 ID가 제공되지 않았습니다.'});
    }

    await reviewService.deleteReview(reviewId);
    res.status(200).json({message: '리뷰가 삭제되었습니다.'});
  } catch (error) {
    console.error('[서버] 리뷰 삭제 실패:', error.message);
    res.status(500).json({message: `리뷰 삭제 실패: ${error.message}`});
  }
};

exports.updateReview = async (req, res) => {
  const {id: reviewId} = req.params;
  const {content} = req.body;
  const imageFiles = req.files;

  const removedImages = req.body.removedImages
    ? Array.isArray(req.body.removedImages)
      ? req.body.removedImages
      : [req.body.removedImages]
    : [];

  try {
    const updatedReview = await reviewService.updateReview(
      reviewId,
      {content, removedImages},
      imageFiles
    );

    res.status(200).json({
      message: '리뷰가 성공적으로 수정되었습니다.',
      review: updatedReview
    });
  } catch (error) {
    console.error('[서버] 리뷰 수정 컨트롤러 에러:', error.message);
    res.status(400).json({message: error.message});
  }
};

// 댓글 작성 (관리자 인증)
exports.addComment = async (req, res) => {
  try {
    const {reviewId} = req.params;
    const userId = req.user.id;
    const {content} = req.body;

    const updatedReview = await reviewService.addComment(reviewId, userId, content);

    res.status(200).json({
      message: '댓글이 성공적으로 추가되었습니다.',
      review: updatedReview
    });
  } catch (error) {
    res.status(400).json({message: error.message});
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const {reviewId, commentId} = req.params;
    const userId = req.user.id;

    const result = await reviewService.deleteComment(reviewId, commentId, userId);

    res.status(200).json({message: '댓글이 성공적으로 삭제되었습니다.', review: result});
  } catch (error) {
    console.error('[서버] 댓글 삭제 실패:', error.message);
    res.status(500).json({message: error.message});
  }
};

exports.updateComment = async (req, res) => {
  try {
    const {reviewId, commentId} = req.params;
    const {content} = req.body;
    const userId = req.user.id;

    const updatedReview = await reviewService.updateComment(
      reviewId,
      commentId,
      userId,
      content
    );

    res.status(200).json({
      message: '댓글이 성공적으로 수정되었습니다.',
      review: updatedReview
    });
  } catch (error) {
    console.error('[서버] 댓글 수정 실패:', error.message);
    res.status(400).json({message: error.message});
  }
};

exports.toggleLike = async (req, res) => {
  try {
    if (!req.body || !req.body.userId) {
      return res.status(400).json({message: '유저 ID가 없습니다.'});
    }

    const userId = req.body.userId;

    const updatedReview = await reviewService.toggleLike(req.params.reviewId, userId);

    res.status(200).json(updatedReview);
  } catch (error) {
    res.status(500).json({message: '서버 내부 오류'});
  }
};

exports.getBestReviews = async (req, res) => {
  try {
    const {productId} = req.params;
    const reviews = await reviewService.getBestReviews(productId);

    res.json({reviews});
  } catch (error) {
    res.status(500).json({message: '베스트 리뷰 불러오기 실패', error: error.message});
  }
};
