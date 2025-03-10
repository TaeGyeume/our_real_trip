const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// 여행지 추가 (POST /api/locations) - 관리자만 가능
router.post(
  '/',
  authMiddleware, // 먼저 인증 확인
  authorizeRoles('admin'),
  locationController.createLocation // 인증 및 권한 확인 후 실행
);

// 여행지 수정 (PATCH /api/locations/:locationId)
router.patch(
  '/:locationId',
  authMiddleware,
  authorizeRoles('admin'),
  locationController.updateLocation
);

// 여행지 삭제 (DELETE /api/locations/:locationId)
router.delete(
  '/:locationId',
  authMiddleware,
  authorizeRoles('admin'),
  locationController.deleteLocation
);

// 모든 여행지 조회
router.get('/', locationController.getLocations);

// 도시 및 국가 검색 API (GET /api/locations/search?query=서울)
router.get('/search', locationController.searchLocations);

// 국가 목록 조회 (GET /api/locations/countries)
router.get('/countries', locationController.getCountries);

// 특정 국가의 도시 목록 조회 (GET /api/locations/cities?country=대한민국)
router.get('/cities', locationController.getCitiesByCountry);

// 특정 위치 조회 API 추가 (GET /api/locations/:locationId)
router.get('/:locationId', locationController.getLocationById);

module.exports = router;
