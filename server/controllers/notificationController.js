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
    console.log('현재 조회하는 사용자 ID:', userId); // 이 로그 추가

    const notifications = await notificationService.getNotificationsByUserId(userId);
    console.log('조회된 알림 목록:', notifications); // 기존 로그 유지

    res.status(200).json({notifications});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: '알림 조회 중 서버 오류 발생'});
  }
};
