const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/create', upload, reviewController.createReview);

router.get('/:productId', reviewController.getReviews);

router.delete('/delete/:id', reviewController.deleteReview);

router.post('/:reviewId/comments', authMiddleware, reviewController.addComment);

module.exports = router;
