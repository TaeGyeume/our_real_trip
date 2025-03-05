const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const verifyToken = require('../middleware/authMiddleware'); // `verifyToken`만 가져오기
const authorizeRoles = require('../middleware/authorizeRoles'); // 별도로 가져오기
const Accommodation = require('../models/Accommodation'); // 숙소 모델 추가
const TourTicket = require('../models/TourTicket'); // 투어/티켓 모델 추가
const Flight = require('../models/Flight'); // 항공 모델 추가
const upload = require('../middleware/uploadMiddleware'); // multer 미들웨어 (이미지 업로드)

// 패키지 생성에 필요한 데이터 가져오기 (숙소, 투어/티켓, 항공)
router.get('/create', packageController.getPackageCreateData);

// 패키지 생성 (관리자만 가능)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'), // 올바르게 적용
  upload, // multer 미들웨어 적용,
  packageController.createPackage
);

// 전체 패키지 목록 조회 (페이징 + 제목 검색 가능) - 모두 접근 가능
router.get('/', packageController.getAllPackages);

// 특정 패키지 상세 조회 - 모두 접근 가능
router.get('/:id', packageController.getPackageById);

// 패키지 수정 (관리자만 가능)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'), // 올바르게 적용
  upload, // multer 미들웨어 적용 (새 이미지 업로드 시)
  packageController.updatePackage
);

// 패키지 삭제 (관리자만 가능)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'), // 올바르게 적용
  packageController.deletePackage
);

module.exports = router;
