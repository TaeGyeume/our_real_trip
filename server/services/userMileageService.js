const User = require('../models/User');
const MileageHistory = require('../models/MileageHistory');
const mongoose = require('mongoose');

// 마일리지 적립 (User에 반영 + MileageHistory에 기록)
exports.addMileageWithHistory = async (userId, amount, description = '예약 적립') => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');

    // User 마일리지 업데이트
    user.mileage = (user.mileage || 0) + amount;
    await user.save();

    // MileageHistory에 적립 내역 저장
    const mileageRecord = new MileageHistory({
      userId,
      type: 'earn',
      amount,
      description,
      balanceAfter: user.mileage
    });
    await mileageRecord.save();
    return mileageRecord;
  } catch (error) {
    throw new Error('마일리지 적립 실패');
  }
};

// 마일리지 사용 (User에 반영 + MileageHistory에 기록)
exports.useMileage = async (userId, amount, description = '마일리지 사용') => {
  try {
    // 사용자 찾기
    const user = await User.findById(userId);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');
    if (user.mileage < amount) throw new Error('마일리지가 부족합니다.');

    // 마일리지 차감 후 저장
    user.mileage -= amount;
    await user.save();

    // 마일리지 사용 내역 저장
    const mileageHistory = new MileageHistory({
      userId,
      type: 'use',
      amount: -amount,
      description,
      balanceAfter: user.mileage
    });
    await mileageHistory.save();
    return mileageHistory;
  } catch (error) {
    throw new Error('마일리지 사용 실패');
  }
};

// 마일리지 내역 조회
exports.getMileageHistory = async userId => {
  try {
    const history = await MileageHistory.find({userId}).sort({createdAt: -1});
    return history;
  } catch (error) {
    console.error('마일리지 내역 조회 실패:', error);
    throw new Error('마일리지 내역 조회 실패');
  }
};
