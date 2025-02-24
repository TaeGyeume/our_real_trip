// services/notificationService.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const Booking = require('../models/Booking');
const {getIO} = require('../config/socket');
const mongoose = require('mongoose');

exports.sendNotificationToAll = async message => {
  const io = getIO();

  const users = await User.find({roles: {$ne: 'admin'}});

  const notification = new Notification({
    message,
    recipients: users.map(user => ({userId: user._id}))
  });

  await notification.save();

  users.forEach(user => {
    io.to(user._id.toString()).emit('notification', {
      notificationId: notification._id,
      message,
      createdAt: notification.createdAt
    });
  });
};

exports.getNotificationsByUserId = async userId => {
  const notifications = await Notification.find({
    'recipients.userId': new mongoose.Types.ObjectId(userId)
  }).sort({createdAt: -1});

  return notifications.map(noti => {
    const recipientInfo = noti.recipients.find(
      recipient => recipient.userId.toString() === userId.toString()
    );

    return {
      _id: noti._id,
      message: noti.message,
      createdAt: noti.createdAt,
      read: recipientInfo ? recipientInfo.read : false,
      readAt: recipientInfo ? recipientInfo.readAt : null
    };
  });
};

// 읽음 처리 함수 추가
exports.markAllNotificationsAsRead = async userId => {
  const result = await Notification.updateMany(
    {
      'recipients.userId': userId,
      'recipients.read': false
    },
    {
      $set: {
        'recipients.$[elem].read': true,
        'recipients.$[elem].readAt': new Date(Date.now() + 9 * 60 * 60 * 1000)
      }
    },
    {
      arrayFilters: [{'elem.userId': userId, 'elem.read': false}]
    }
  );

  return result;
};

// 예약 3일 전 사용자들에게 알림 전송
exports.sendBookingReminders = async () => {
  const io = getIO();

  // 현재 날짜로부터 3일 후 날짜 구하기 (한국시간 기준)
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  // 날짜만 추출해서 비교를 쉽게하기 위한 작업 (시간 제거)
  const startOfDay = new Date(threeDaysLater.setHours(0, 0, 0, 0));
  const endOfDay = new Date(threeDaysLater.setHours(23, 59, 59, 999));

  // 예약 시작 날짜가 3일 후인 예약 찾기
  const bookings = await Booking.find({
    startDates: {$elemMatch: {$gte: startOfDay, $lte: endOfDay}},
    paymentStatus: 'CONFIRMED'
  });

  for (const booking of bookings) {
    const message = '예약하신 일정이 3일 남았습니다. 일정을 확인해 주세요.';

    const notification = new Notification({
      message,
      recipients: [{userId: booking.userId}]
    });

    await notification.save();

    io.to(booking.userId.toString()).emit('notification', {
      notificationId: notification._id,
      message,
      createdAt: notification.createdAt
    });
  }
};
