// services/notificationService.js
const Notification = require('../models/Notification');
const User = require('../models/User');
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
    console.log(`알림 전송 대상자: ${user._id}`); // 추가
    io.to(user._id.toString()).emit('notification', {
      notificationId: notification._id,
      message,
      createdAt: notification.createdAt
    });
  });

  console.log('알림 전송 및 emit 완료!'); // 추가
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
