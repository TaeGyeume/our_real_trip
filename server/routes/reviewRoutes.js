const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/create', upload, reviewController.createReview);

router.get('/:productId', reviewController.getReviews);

router.delete('/delete/:id', authMiddleware, reviewController.deleteReview);

router.post('/:reviewId/comments', authMiddleware, reviewController.addComment);

router.delete(
  '/:reviewId/comments/:commentId',
  authMiddleware,
  reviewController.deleteComment
);

router.patch(
  '/:reviewId/comments/:commentId',
  authMiddleware,
  reviewController.updateComment
);

module.exports = router;
