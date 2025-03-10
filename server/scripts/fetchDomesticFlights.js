require('dotenv').config({path: require('path').resolve(__dirname, '../.env')});

const mongoose = require('mongoose');
const axios = require('axios');
const moment = require('moment-timezone');
const Flight = require('../models/Flight');

const {DB_URI, SERVICE_KEY} = process.env;

if (!DB_URI || !SERVICE_KEY) {
  console.error('환경 변수(DB_URI 또는 SERVICE_KEY)가 설정되지 않았습니다.');
  process.exit(1);
}

// MongoDB 연결
mongoose
  .connect(DB_URI)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.error('MongoDB 연결 실패:', err));

// 공항 코드와 공항명 매핑
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
  CDG: '샤를 드골공항',
  PEK: '베이징공항',
  PKX: '베이징 다싱공항',
  TSA: '타이베이 송산공항',
  LHR: '런던 히드로공항',
  SYD: '시드니공항',
  BKK: '방콕공항'
};

// 운항 요일 변환 함수 (국내선/국제선 공통)
const getOperatingDays = flight => {
  return [
    flight.domesticSun === 'Y' || flight.internationalSun === 'Y' ? '일요일' : null,
    flight.domesticMon === 'Y' || flight.internationalMon === 'Y' ? '월요일' : null,
    flight.domesticTue === 'Y' || flight.internationalTue === 'Y' ? '화요일' : null,
    flight.domesticWed === 'Y' || flight.internationalWed === 'Y' ? '수요일' : null,
    flight.domesticThu === 'Y' || flight.internationalThu === 'Y' ? '목요일' : null,
    flight.domesticFri === 'Y' || flight.internationalFri === 'Y' ? '금요일' : null,
    flight.domesticSat === 'Y' || flight.internationalSat === 'Y' ? '토요일' : null
  ].filter(Boolean);
};

// 데이터 저장 함수 (국내선 & 국제선 공용)
const saveFlightToDB = async (flight, deptCode, arrCode, isInternational) => {
  const airline = flight.airlineKorean || 'Unknown Airline';
  const flightNumber =
    flight.domesticNum ||
    flight.internationalNum ||
    `FL-${Math.random().toString(36).substr(2, 5)}`;

  const departureTime = flight.domesticStartTime || flight.internationalTime || '0000';
  const arrivalTime = flight.domesticArrivalTime || flight.internationalTime || '0000';

  const departureDate = moment().tz('Asia/Seoul').startOf('day').toDate();
  const arrivalDate = moment().tz('Asia/Seoul').startOf('day').toDate();

  const operatingDays = getOperatingDays(flight);
  const seatsAvailable = Math.floor(Math.random() * 10) + 1;
  let price = 100; // 기본 가격

  let seatClass;
  if (price < 50000) {
    seatClass = '특가석';
  } else if (price < 100000) {
    seatClass = '이코노미석';
  } else {
    seatClass = '비즈니스석';
  }

  await Flight.updateOne(
    {flightNumber, 'departure.date': departureDate},
    {
      airline,
      flightNumber,
      departure: {
        airport: deptCode,
        city: AIRPORT_NAMES[deptCode] || deptCode,
        date: departureDate,
        time: departureTime
      },
      arrival: {
        airport: arrCode,
        city: AIRPORT_NAMES[arrCode] || arrCode,
        date: arrivalDate,
        time: arrivalTime
      },
      operatingDays,
      price,
      seatsAvailable,
      seatClass
    },
    {upsert: true}
  );

  console.log(
    `저장 완료: ${flightNumber} (${airline}), ${moment(departureDate).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm')}, 좌석: ${seatsAvailable}, 가격: ${price.toLocaleString()}원, 등급: ${seatClass}`
  );
};

// 국내선 데이터 수집
const fetchDomesticFlights = async () => {
  console.log('국내선 데이터 수집 시작...');
  for (const deptCity of Object.keys(AIRPORT_NAMES)) {
    for (const arrCity of Object.keys(AIRPORT_NAMES)) {
      if (deptCity === arrCity) continue;
      console.log(`Fetching domestic flights from ${deptCity} → ${arrCity}`);

      const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getDflightScheduleList`;
      const params = {
        serviceKey: SERVICE_KEY,
        schDate: moment().tz('Asia/Seoul').format('YYYYMMDD'),
        schDeptCityCode: deptCity,
        schArrvCityCode: arrCity,
        schAirLine: '',
        schFlightNum: '',
        _type: 'json'
      };

      try {
        const response = await axios.get(url, {params});
        const flights = response.data?.response?.body?.items?.item || [];

        for (const flight of flights) {
          await saveFlightToDB(flight, deptCity, arrCity, false);
        }
      } catch (error) {
        console.error(`API 요청 실패 (${deptCity} → ${arrCity}):`, error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// 국제선 데이터 수집
const fetchInternationalFlights = async () => {
  console.log('🌍 국제선 데이터 수집 시작...');
  for (const deptCity of Object.keys(AIRPORT_NAMES)) {
    for (const arrCity of Object.keys(AIRPORT_NAMES)) {
      if (deptCity === arrCity) continue;
      console.log(`Fetching international flights from ${deptCity} → ${arrCity}`);

      const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getIflightScheduleList`;
      const params = {
        serviceKey: SERVICE_KEY,
        schDate: moment().tz('Asia/Seoul').format('YYYYMMDD'),
        schDeptCityCode: deptCity,
        schArrvCityCode: arrCity,
        schAirLine: '',
        schFlightNum: '',
        _type: 'json'
      };

      try {
        const response = await axios.get(url, {params});
        const flights = response.data?.response?.body?.items?.item || [];

        for (const flight of flights) {
          await saveFlightToDB(flight, deptCity, arrCity, true);
        }
      } catch (error) {
        console.error(` API 요청 실패 (${deptCity} → ${arrCity}):`, error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// 실행
fetchDomesticFlights();
fetchInternationalFlights();
