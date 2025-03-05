const Flight = require('../models/Flight');
const moment = require('moment-timezone');
const flightsService = require('../services/flightsService');

// 모든 항공편 조회 컨트롤러
exports.getFlights = async (req, res) => {
  try {
    const flights = await flightsService.getFlights();
    res.status(200).json(flights);
  } catch (error) {
    console.error('항공편 조회 오류:', error.message);
    res.status(500).json({message: error.message});
  }
};

// 편도 항공편 검색 컨트롤러
exports.searchFlights = async (req, res) => {
  try {
    const {departure, arrival, date, passengers} = req.query;
    const flights = await flightsService.searchFlights(
      departure,
      arrival,
      date,
      passengers
    );
    res.status(200).json(flights);
  } catch (error) {
    console.error('항공편 검색 오류:', error.message);
    res.status(400).json({error: error.message});
  }
};

//  출발지 & 도착지 검색 컨트롤러
exports.searchFlightsByRoute = async (req, res) => {
  try {
    const {departure, arrival} = req.query;
    const flights = await flightsService.searchFlightsByRoute(departure, arrival);
    res.status(200).json(flights);
  } catch (error) {
    console.error('출발지-도착지 검색 오류:', error.message);
    res.status(400).json({error: error.message});
  }
};

//  항공편 추가 (Create)
exports.createFlight = async (req, res) => {
  try {
    const flight = await flightsService.createFlight(req.body);
    res.status(201).json({message: '항공편이 성공적으로 추가되었습니다.', flight});
  } catch (error) {
    res.status(500).json({message: '항공편 추가 중 오류 발생', error: error.message});
  }
};

//  항공편 수정 (Update)
exports.updateFlight = async (req, res) => {
  try {
    const flight = await flightsService.updateFlight(req.params.id, req.body);
    res.status(200).json({message: '항공편 수정 완료!', flight});
  } catch (error) {
    res.status(500).json({message: '항공편 수정 중 오류 발생', error: error.message});
  }
};

//  항공편 삭제 (Delete)
exports.deleteFlight = async (req, res) => {
  try {
    await flightsService.deleteFlight(req.params.id);
    res.status(200).json({message: '항공편이 성공적으로 삭제되었습니다.'});
  } catch (error) {
    res.status(500).json({message: '항공편 삭제 중 오류 발생', error: error.message});
  }
};

exports.getFlightById = async (req, res) => {
  try {
    const {id} = req.params;
    const flight = await flightsService.getFlightById(id);
    if (!flight) {
      return res.status(404).json({message: '해당 항공편이 존재하지 않습니다.'});
    }
    res.status(200).json(flight);
  } catch (error) {
    console.error('특정 항공편 조회 오류:', error); // 여기서 찍히는 메시지 확인
    res.status(500).json({message: error.message});
  }
};
