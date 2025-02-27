const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const verifyToken = require('../middleware/authMiddleware'); // `verifyToken`만 가져오기
const authorizeRoles = require('../middleware/authorizeRoles'); // 별도로 가져오기
const Accommodation = require('../models/Accommodation'); // 숙소 모델 추가
const TourTicket = require('../models/TourTicket'); // 투어/티켓 모델 추가
const Flight = require('../models/Flight'); // 항공 모델 추가

// 패키지 생성에 필요한 데이터 가져오기 (숙소, 투어/티켓, 항공)
router.get('/create', async (req, res) => {
  try {
    const accommodations = await Accommodation.find({}); // 숙소 목록 가져오기
    const tourTickets = await TourTicket.find({}); // 투어/티켓 목록 가져오기
    const flights = await Flight.find({}); // 항공 목록 가져오기
    res.json({accommodations, tourTickets, flights}); // 클라이언트에 데이터 반환
  } catch (error) {
    console.error('패키지 생성 데이터 가져오기 실패:', error);
    res.status(500).json({message: '서버 오류'});
  }
});

// 패키지 생성 (관리자만 가능)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'), // 올바르게 적용
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
