// services/notificationService.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const Booking = require('../models/Booking');
const {getIO} = require('../config/socket');

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

exports.getNotificationsByUserId = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({
    'recipients.userId': userId
  })
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit);

  const totalNotifications = await Notification.countDocuments({
    'recipients.userId': userId
  });

  const hasMore = page * limit < totalNotifications;

  const formattedNotifications = notifications.map(noti => {
    const recipientInfo = noti.recipients.find(
      recipient => recipient.userId.toString() === userId.toString()
    );

    return {
      _id: noti._id,
      message: noti.message,
      createdAt: noti.createdAt,
      read: recipientInfo ? recipientInfo.read : false,
      readAt: recipientInfo ? recipientInfo.readAt : null,
      bookingId: noti.relatedBooking || null,
      bookingType: noti.bookingType || null
    };
  });

  return {
    notifications: formattedNotifications,
    currentPage: page,
    totalPages: Math.ceil(totalNotifications / limit),
    hasMore
  };
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

  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const startOfDay = new Date(threeDaysLater.setHours(0, 0, 0, 0));
  const endOfDay = new Date(threeDaysLater.setHours(23, 59, 59, 999));

  const bookings = await Booking.find({
    startDates: {$elemMatch: {$gte: startOfDay, $lte: endOfDay}},
    paymentStatus: {$in: ['CONFIRMED', 'COMPLETED']}
  });

  for (const booking of bookings) {
    const bookingType = booking.types[0]; // 예를 들어 첫번째 타입 사용
    const message = `예약하신 ${translateBookingType(bookingType)} 일정이 3일 남았습니다. 일정을 확인해 주세요.`;

    const notification = new Notification({
      message,
      recipients: [{userId: booking.userId}],
      relatedBooking: booking._id,
      bookingType
    });

    await notification.save();

    io.to(booking.userId.toString()).emit('notification', {
      notificationId: notification._id,
      message,
      bookingType,
      bookingId: booking._id,
      createdAt: notification.createdAt
    });
  }
};

const translateBookingType = type => {
  switch (type) {
    case 'flight':
      return '항공편';
    case 'accommodation':
      return '숙박';
    case 'tourTicket':
      return '투어/티켓';
    case 'travelItem':
      return '여행용품';
    default:
      return '예약';
  }
};
