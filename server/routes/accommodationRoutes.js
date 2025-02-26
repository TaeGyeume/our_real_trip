const express = require('express');
const router = express.Router();
const accommodationController = require('../controllers/accommodationController');
const upload = require('../middleware/uploadMiddleware');

// 숙소 생성 API (POST /api/accommodations)
router.post('/new', upload, accommodationController.createAccommodation);

// 자동완성 검색
router.get('/autocomplete', accommodationController.autocompleteSearch);

// 날짜 및 인원수에 맞는 숙소 검색
router.get('/search', accommodationController.getAccommodationsBySearch);

// 조회수 순으로 가져오기
router.get('/popular', accommodationController.getPopularAccommodations);

// 특정 숙소의 검색 조건에 맞는 객실 조회 API
router.get(
  '/:accommodationId/rooms',
  accommodationController.getAvailableRoomsByAccommodation
);

// 숙소 전체 리스트 조회 API (GET /api/accommodations/list)
router.get('/list', accommodationController.getAllAccommodations);

// 숙소 업데이트 API (PATCH /api/accommodations/:accommodationId)
router.patch('/:accommodationId', upload, accommodationController.updateAccommodation);

// 숙소 이름 검색 API
router.get('/searchByName', accommodationController.searchAccommodationsByName);

// 특정 숙소 상세 정보 조회 API
router.get('/:accommodationId', accommodationController.getAccommodationById);

// 숙소 이미지 삭제 API (DELETE)
router.delete(
  '/:accommodationId/images',
  accommodationController.deleteAccommodationImage
);

// 숙소 삭제 API (DELETE /api/accommodations/:accommodationId)
router.delete('/:accommodationId', accommodationController.deleteAccommodation);

module.exports = router;
