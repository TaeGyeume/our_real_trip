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
