const Flight = require('../models/Flight');
const moment = require('moment-timezone');

// 공항 코드 → 공항명 매핑
const AIRPORT_NAMES = {
  GMP: '김포공항',
  ICN: '인천공항',
  PUS: '김해공항',
  CJU: '제주공항',
  TAE: '대구공항',
  KWJ: '광주공항',
  CJJ: '청주공항',
  RSU: '여수공항',
  MWX: '무안공항',
  HND: '하네다공항',
  NRT: '나리타공항',
  JFK: '뉴욕 JFK공항',
  CDG: '샤를 드골공항'
};

// 항공편 추가 (CREATE)
exports.createFlight = async flightData => {
  try {
    const newFlight = new Flight({
      ...flightData,
      departure: {
        ...flightData.departure,
        city: AIRPORT_NAMES[flightData.departure.airport] || flightData.departure.city,
        date: moment(flightData.departure.date).tz('Asia/Seoul').toDate()
      },
      arrival: {
        ...flightData.arrival,
        city: AIRPORT_NAMES[flightData.arrival.airport] || flightData.arrival.city,
        date: moment(flightData.arrival.date).tz('Asia/Seoul').toDate()
      }
    });

    await newFlight.save();
    return newFlight;
  } catch (error) {
    throw new Error('항공편 생성 중 오류 발생: ' + error.message);
  }
};

// 모든 항공편 조회 (서비스)
exports.getFlights = async () => {
  try {
    return await Flight.find();
  } catch (error) {
    console.error('항공편 조회 오류:', error.message);
    throw new Error('서버 오류 발생');
  }
};

// ✈️ 편도 항공편 검색 서비스 (UTC 변환 적용)
exports.searchFlights = async (departure, arrival, date, passengers) => {
  try {
    if (!departure || !arrival || !date || !passengers) {
      throw new Error('출발지, 도착지, 날짜, 인원수를 입력해주세요.');
    }

    const parsedPassengers = parseInt(passengers, 10);
    if (isNaN(parsedPassengers) || parsedPassengers <= 0) {
      throw new Error('인원수는 1명 이상이어야 합니다.');
    }

    const searchDateStart = moment
      .tz(date, 'YYYY-MM-DD', 'Asia/Seoul')
      .startOf('day')
      .utc()
      .toDate();
    const searchDateEnd = moment
      .tz(date, 'YYYY-MM-DD', 'Asia/Seoul')
      .endOf('day')
      .utc()
      .toDate();
    const selectedWeekday = moment(date, 'YYYY-MM-DD').locale('ko').format('dddd');

    console.log(
      `변환된 검색 시간 범위 (UTC 기준): ${searchDateStart} ~ ${searchDateEnd}`
    );
    console.log(`요일 필터: ${selectedWeekday}`);

    const flights = await Flight.find({
      'departure.airport': departure,
      'arrival.airport': arrival,
      'departure.date': {$gte: searchDateStart, $lte: searchDateEnd},
      operatingDays: {$in: [selectedWeekday]},
      seatsAvailable: {$gte: parsedPassengers}
    });

    console.log(`검색 결과 개수: ${flights.length}`);

    if (flights.length === 0) {
      throw new Error(
        `🚫 선택한 날짜(${date})(${selectedWeekday})에 ${parsedPassengers}명 좌석이 있는 항공편이 없습니다.`
      );
    }

    return flights;
  } catch (error) {
    console.error('항공편 검색 오류:', error.message);
    throw new Error(error.message);
  }
};

// 출발지 & 도착지만으로 항공편 검색 서비스
exports.searchFlightsByRoute = async (departure, arrival) => {
  try {
    if (!departure || !arrival) {
      throw new Error('출발지와 도착지를 입력해주세요.');
    }

    console.log(`출발지(${departure}) - 도착지(${arrival}) 검색 요청`);

    const flights = await Flight.find({
      'departure.airport': departure,
      'arrival.airport': arrival
    });

    console.log(`검색된 항공편 수: ${flights.length}`);

    if (flights.length === 0) {
      throw new Error('해당 구간의 항공편이 없습니다.');
    }

    return flights;
  } catch (error) {
    console.error('출발지-도착지 검색 오류:', error.message);
    throw new Error(error.message);
  }
};

// 항공편 수정 (UPDATE)
exports.updateFlight = async (flightId, updateData) => {
  try {
    const updatedFlight = await Flight.findByIdAndUpdate(flightId, updateData, {
      new: true
    });

    if (!updatedFlight) {
      throw new Error('해당 항공편을 찾을 수 없습니다.');
    }

    return updatedFlight;
  } catch (error) {
    throw new Error('항공편 수정 중 오류 발생: ' + error.message);
  }
};

// 항공편 삭제 (DELETE)
exports.deleteFlight = async flightId => {
  try {
    const deletedFlight = await Flight.findByIdAndDelete(flightId);

    if (!deletedFlight) {
      throw new Error('해당 항공편을 찾을 수 없습니다.');
    }

    return deletedFlight;
  } catch (error) {
    throw new Error('항공편 삭제 중 오류 발생: ' + error.message);
  }
};
