require('dotenv').config({path: require('path').resolve(__dirname, '../.env')});

const mongoose = require('mongoose');
const axios = require('axios');
const moment = require('moment-timezone');
// const pLimit = require('p-limit'); // 필요 시 동시성 제어용
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

// 공항별 좌표 (예시, 필요한 공항 추가)
const AIRPORT_COORDS = {
  GMP: {lat: 37.5583, lng: 126.7906},
  ICN: {lat: 37.4602, lng: 126.4407},
  PUS: {lat: 35.1796, lng: 128.9382},
  CJU: {lat: 33.5104, lng: 126.492},
  TAE: {lat: 35.901, lng: 128.6086},
  KWJ: {lat: 35.1595, lng: 126.8526},

  CJJ: {lat: 36.717, lng: 127.491},
  RSU: {lat: 34.758, lng: 127.662},
  MWX: {lat: 34.991, lng: 126.382},

  HND: {lat: 35.5494, lng: 139.7798},
  NRT: {lat: 35.7767, lng: 140.3183},
  JFK: {lat: 40.6413, lng: -73.7781},
  CDG: {lat: 49.0097, lng: 2.5479},
  PEK: {lat: 40.0801, lng: 116.5846},
  PKX: {lat: 39.509, lng: 116.41},
  TSA: {lat: 25.0697, lng: 121.5528},
  LHR: {lat: 51.47, lng: -0.4543},
  SYD: {lat: -33.9399, lng: 151.1753},
  BKK: {lat: 13.69, lng: 100.7501}
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

// 거리 계산 함수 (Haversine 공식)
function toRad(value) {
  return (value * Math.PI) / 180;
}

function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

// 거리 기반 기본 가격 계산 함수
function getBasePriceByDistance(distance, isInternational) {
  if (isInternational) {
    // 국제선: 장거리에서는 가격 상승폭을 완화하기 위해 제곱근 함수를 사용
    return Math.sqrt(distance) * 5000 + Math.random() * 50000;
  } else {
    // 국내선: 기존 선형 방식
    return distance * 100 + Math.random() * 20000;
  }
}

// 노선별 가격 산정: 거리 기반 기본 가격에 좌석 등급 가중치 적용
function getRandomSeatAndPrice(deptCode, arrCode, isInternational) {
  const coordDept = AIRPORT_COORDS[deptCode];
  const coordArr = AIRPORT_COORDS[arrCode];
  const distance = calculateDistance(coordDept, coordArr);
  let basePrice = getBasePriceByDistance(distance, isInternational);

  // 좌석 등급 결정: 확률 (특가 10%, 이코노미 70%, 비즈니스 20%)
  const rand = Math.random();
  let seatClass;
  if (rand < 0.1) {
    seatClass = '특가석';
    basePrice *= 0.7; // 할인 적용
  } else if (rand < 0.8) {
    seatClass = '이코노미석';
    // 기본 가격 그대로
  } else {
    seatClass = '비즈니스석';
    basePrice *= 1.5; // 추가 비용 적용
  }
  const price = Math.floor(basePrice);
  return {seatClass, price};
}

// 데이터 저장 함수 (국내선 & 국제선 공용)
// dayOffset: 오늘부터 몇 일 후인지 (0: 오늘, 1: 내일 등)
const saveFlightToDB = async (flight, deptCode, arrCode, isInternational, dayOffset) => {
  const airline = flight.airlineKorean || 'Unknown Airline';
  const flightNumber =
    flight.domesticNum ||
    flight.internationalNum ||
    `FL-${Math.random().toString(36).substr(2, 5)}`;

  const departureTime = flight.domesticStartTime || flight.internationalTime || '0000';
  const arrivalTime = flight.domesticArrivalTime || flight.internationalTime || '0000';

  // 오늘 + dayOffset일
  const departureDate = moment()
    .tz('Asia/Seoul')
    .add(dayOffset, 'days')
    .startOf('day')
    .toDate();
  const arrivalDate = moment()
    .tz('Asia/Seoul')
    .add(dayOffset, 'days')
    .startOf('day')
    .toDate();

  const operatingDays = getOperatingDays(flight);
  const seatsAvailable = Math.floor(Math.random() * 10) + 1;
  const {seatClass, price} = getRandomSeatAndPrice(deptCode, arrCode, isInternational);

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
    `저장 완료: ${flightNumber} (${airline}), ${moment(departureDate)
      .tz('Asia/Seoul')
      .format(
        'YYYY-MM-DD'
      )} / 시간: ${departureTime}, 좌석: ${seatsAvailable}, 가격: ${price.toLocaleString()}원, 등급: ${seatClass}`
  );
};

// 국내선 데이터 수집
const fetchDomesticFlights = async () => {
  console.log('국내선 데이터 수집 시작...');

  // "오늘부터 10일 뒤"까지 반복 (테스트를 위해 0일만 사용)
  for (let i = 0; i <= 10; i++) {
    const dateStr = moment().tz('Asia/Seoul').add(i, 'days').format('YYYYMMDD');
    console.log(`-- ${dateStr} 기준 국내선 데이터 수집`);

    // 국내선은 DOMESTIC_CODES 배열만 사용
    const DOMESTIC_CODES = [
      'GMP',
      'ICN',
      'PUS',
      'CJU',
      'TAE',
      'KWJ',
      'CJJ',
      'RSU',
      'MWX'
    ];
    for (const deptCity of DOMESTIC_CODES) {
      for (const arrCity of DOMESTIC_CODES) {
        if (deptCity === arrCity) continue;

        const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getDflightScheduleList`;
        const params = {
          serviceKey: SERVICE_KEY,
          schDate: dateStr,
          schDeptCityCode: deptCity,
          schArrvCityCode: arrCity,
          schAirLine: '',
          schFlightNum: '',
          _type: 'json'
        };

        console.log(
          `Fetching domestic flights from ${deptCity} → ${arrCity} (date: ${dateStr})`
        );

        try {
          const response = await axios.get(url, {params});
          const flights = response.data?.response?.body?.items?.item || [];

          for (const flight of flights) {
            await saveFlightToDB(flight, deptCity, arrCity, false, i);
          }
          const delayTime = flights.length === 0 ? 100 : 1000;
          await new Promise(resolve => setTimeout(resolve, delayTime));
        } catch (error) {
          console.error(
            `API 요청 실패 (${deptCity} → ${arrCity}, date: ${dateStr}):`,
            error.message
          );
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
};

// 국제선 데이터 수집
const fetchInternationalFlights = async () => {
  console.log('🌍 국제선 데이터 수집 시작...');

  // 국제선은 전체 공항 코드를 사용
  const internationalCodes = Object.keys(AIRPORT_NAMES);
  for (let i = 0; i <= 10; i++) {
    const dateStr = moment().tz('Asia/Seoul').add(i, 'days').format('YYYYMMDD');
    console.log(`-- ${dateStr} 기준 국제선 데이터 수집`);

    for (const deptCity of internationalCodes) {
      for (const arrCity of internationalCodes) {
        if (deptCity === arrCity) continue;

        const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getIflightScheduleList`;
        const params = {
          serviceKey: SERVICE_KEY,
          schDate: dateStr,
          schDeptCityCode: deptCity,
          schArrvCityCode: arrCity,
          schAirLine: '',
          schFlightNum: '',
          _type: 'json'
        };

        console.log(
          `Fetching international flights from ${deptCity} → ${arrCity} (date: ${dateStr})`
        );

        try {
          const response = await axios.get(url, {params});
          const flights = response.data?.response?.body?.items?.item || [];

          for (const flight of flights) {
            await saveFlightToDB(flight, deptCity, arrCity, true, i);
          }
          const delayTime = flights.length === 0 ? 100 : 1000;
          await new Promise(resolve => setTimeout(resolve, delayTime));
        } catch (error) {
          console.error(
            `API 요청 실패 (${deptCity} → ${arrCity}, date: ${dateStr}):`,
            error.message
          );
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
};

// 실행
(async () => {
  await fetchDomesticFlights();
  await fetchInternationalFlights();
})();
