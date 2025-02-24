// controllers/notificationController.js
const notificationService = require('../services/notificationService');

exports.sendNotification = async (req, res) => {
  const {message} = req.body;

  if (!message) {
    return res.status(400).json({error: '메시지를 입력해주세요.'});
  }

  try {
    notificationService.sendNotificationToAll(message);
    res.status(200).json({success: true, message: '알림 전송 성공'});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: '알림 전송 실패'});
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await notificationService.getNotificationsByUserId(userId);

    res.status(200).json({notifications});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: '알림 조회 중 서버 오류 발생'});
  }
};

// 읽음 처리 컨트롤러 추가
exports.markAllAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await notificationService.markAllNotificationsAsRead(userId);
    res.status(200).json({success: true, updatedCount: result.modifiedCount});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
};

exports.sendBookingReminderNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.sendBookingReminders();

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({error: '예약 알림 전송 중 오류 발생'});
  }
};
