const express = require('express');
const router = express.Router();
const {
  getUserMileage,
  getUserMileageHistory
} = require('../controllers/userMileageController');

// 총 마일리지 조회
router.get('/:userId', getUserMileage);

// 마일리지 내역 조회
router.get('/:userId/history', getUserMileageHistory);

module.exports = router;
