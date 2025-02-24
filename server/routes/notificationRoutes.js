// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// 관리자인 경우에만 접근 가능
router.post('/send', notificationController.sendNotification);

// 유저가 받은 알림 목록 조회
router.get('/', authMiddleware, notificationController.getUserNotifications);

// 읽음 처리 라우트 추가
router.patch('/read-all', authMiddleware, notificationController.markAllAsRead);

module.exports = router;
