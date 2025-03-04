const express = require('express');
const flightController = require('../controllers/flightController');

const router = express.Router();

// 모든 항공편 조회
router.get('/', flightController.getFlights);
router.get('/list', flightController.getFlights);

// 항공편 검색
router.get('/search', flightController.searchFlights);

// 출발지 & 도착지 기반 항공편 검색 API
router.get('/search-by-route', flightController.searchFlightsByRoute);

router.get('/:id', flightController.getFlightById);

router.post('/create', flightController.createFlight);

router.put('/:id', flightController.updateFlight);

router.delete('/:id', flightController.deleteFlight);

module.exports = router;
