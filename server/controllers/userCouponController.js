const userCouponService = require('../services/userCouponService');

// 사용자가 쿠폰을 받는 API
exports.claimCoupon = async (req, res) => {
  try {
    const {userId, couponId} = req.body;

    // 필수 값 확인
    if (!userId || !couponId) {
      return res.status(400).json({message: 'userId와 couponId를 모두 입력해주세요.'});
    }

    const newUserCoupon = await userCouponService.claimCoupon(userId, couponId);

    res.status(201).json({
      message: '쿠폰이 성공적으로 지급되었습니다.',
      userCoupon: newUserCoupon
    });
  } catch (error) {
    res.status(400).json({message: '쿠폰 지급 중 오류 발생', error: error.message});
  }
};

// 사용자가 받은 쿠폰 조회 API (GET /api/user-coupons/:userId)
exports.getUserCoupons = async (req, res) => {
  try {
    const {userId} = req.params;
    const userCoupons = await userCouponService.fetchUserCoupons(userId);

    res.status(200).json(userCoupons);
  } catch (error) {
    res.status(500).json({
      message: '사용자 쿠폰 조회 중 오류 발생',
      error: error.message
    });
  }
};
