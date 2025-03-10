const express = require('express');
const router = express.Router();
const userCouponController = require('../controllers/userCouponController');
const authMiddleware = require('../middleware/authMiddleware');

// 쿠폰 받기 (POST /api/user-coupons/claim) - 로그인한 사용자만 가능
router.post('/claim', authMiddleware, userCouponController.claimCoupon);

// 사용자가 받은 쿠폰 조회 (GET /api/user-coupons/:userId)
router.get('/:userId', authMiddleware, userCouponController.getUserCoupons);

module.exports = router;
