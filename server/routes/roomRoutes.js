const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// 객실 추가 API (POST /api/rooms)
router.post(
  '/',
  upload,
  authMiddleware,
  authorizeRoles('admin'),
  roomController.createRoom
);

// 객실 업데이트 (PATCH /api/rooms/:roomId)
router.patch(
  '/:roomId',
  upload,
  authMiddleware,
  authorizeRoles('admin'),
  roomController.updateRoom
);

// 객실 삭제 (DELETE /api/rooms/:roomId)
router.delete(
  '/:roomId',
  authMiddleware,
  authorizeRoles('admin'),
  roomController.deleteRoom
);

// 객실 이미지 삭제 API (DELETE)
router.post(
  '/:roomId/images/delete',
  authMiddleware,
  authorizeRoles('admin'),
  roomController.deleteRoomImage
);

// 특정 객실 조회 (GET /api/rooms/:roomId)
router.get('/:roomId', roomController.getRoomById);

// 특정 날짜의 예약 가능 객실 개수 조회
router.get('/:roomId/availability/:date', roomController.getAvailableRoomsByDate);

module.exports = router;
