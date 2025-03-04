const User = require('../models/User');

exports.updateUserSpending = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');

    // 총 결제 금액 업데이트
    user.totalSpent = Math.max(user.totalSpent + amount, 0); // 최소 0 이상 유지

    // 등급 업데이트
    user.updateMembership();

    await user.save();
    return user;
  } catch (error) {
    throw new Error('유저 결제 금액 업데이트 중 오류 발생: ' + error.message);
  }
};
