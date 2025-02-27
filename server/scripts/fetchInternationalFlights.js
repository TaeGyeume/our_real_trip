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
  .connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000
  })
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.error('MongoDB 연결 실패:', err));

const AIRPORT_NAMES = {
  GMP: '김포공항',
  ICN: '인천공항',
  PUS: '김해공항',
  CJU: '제주공항',
  TAE: '대구공항',
  KWJ: '광주공항',
  CJJ: '청주공항',
  RSU: '여수공항',
  MWX: '무안공항'
};

const INTERNATIONAL_DEPARTURE = {
  ICN: '인천공항',
  GMP: '김포공항',
  PUS: '김해공항',
  CJU: '제주공항'
};

const INTERNATIONAL_ARRIVAL = {
  HND: '도쿄',
  NRT: '도쿄',
  JFK: '뉴욕',
  EWR: '뉴욕',
  LGA: '뉴욕',
  CDG: '파리',
  PEK: '베이징',
  PKX: '베이징',
  TSA: '타이베이',
  LGW: '런던',
  LHR: '런던',
  LCY: '런던',
  SYD: '시드니',
  BKK: '방콕'
};

// 필터링할 항공사
const ALLOWED_AIRLINES = [
  '대한항공',
  '아시아나항공',
  '에어서울',
  '이스타항공',
  '진에어',
  '티웨이항공',
  '제주항공'
];

// API 응답 요일 필드를 운항 요일 배열로 변환하는 함수
const getOperatingDays = flight => {
  return [
    flight.domesticSun === 'Y' && '일요일',
    flight.domesticMon === 'Y' && '월요일',
    flight.domesticTue === 'Y' && '화요일',
    flight.domesticWed === 'Y' && '수요일',
    flight.domesticThu === 'Y' && '목요일',
    flight.domesticFri === 'Y' && '금요일',
    flight.domesticSat === 'Y' && '토요일'
  ].filter(Boolean);
};

const getInternationalOperatingDays = flight => {
  return [
    flight.internationalSun === 'Y' && '일요일',
    flight.internationalMon === 'Y' && '월요일',
    flight.internationalTue === 'Y' && '화요일',
    flight.internationalWed === 'Y' && '수요일',
    flight.internationalThu === 'Y' && '목요일',
    flight.internationalFri === 'Y' && '금요일',
    flight.internationalSat === 'Y' && '토요일'
  ].filter(Boolean);
};

// **국제선 항공편 데이터 수집 함수**
const fetchInternationalFlights = async () => {
  console.log('🌍 국제선 항공편 데이터 수집 시작...');

  const today = moment().tz('Asia/Seoul').startOf('day');
  const futureDate = moment().tz('Asia/Seoul').add(1, 'days').endOf('day');

  try {
    let currentDate = moment(today);
    while (currentDate <= futureDate) {
      const formattedDate = currentDate.format('YYYYMMDD');
      console.log(`📆 현재 처리 중인 날짜: ${formattedDate}`);

      for (const deptCode of Object.keys(INTERNATIONAL_DEPARTURE)) {
        for (const arrCode of Object.keys(INTERNATIONAL_ARRIVAL)) {
          if (deptCode === arrCode) continue;

          const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getIflightScheduleList?serviceKey=${encodeURIComponent(
            SERVICE_KEY
          )}&schDate=${formattedDate}&schDeptCityCode=${deptCode}&schArrvCityCode=${arrCode}`;

          try {
            const response = await axios.get(url, {
              headers: {'User-Agent': 'Mozilla/5.0'},
              timeout: 10000
            });

            const items = response.data?.response?.body?.items?.item;
            if (!items) continue;

            const flights = Array.isArray(items) ? items : [items];

            for (const flight of flights) {
              const airline = flight.airlineKorean || 'Unknown Airline';
              const flightNumber =
                flight.internationalNum ||
                `FL-${Math.random().toString(36).substr(2, 5)}`;

              let departureDate = moment(`${formattedDate} 00:00`, 'YYYYMMDD HH:mm')
                .utcOffset(540) // KST (UTC+9)
                .toDate();

              let arrivalDate = moment(`${formattedDate} 00:00`, 'YYYYMMDD HH:mm')
                .utcOffset(540) // KST (UTC+9)
                .toDate();

              const departureTime = flight.internationalTime || '0000';
              const arrivalTime = flight.internationalTime || '0000';
              const operatingDays = getInternationalOperatingDays(flight);

              const seatsAvailable = Math.floor(Math.random() * 10) + 1;
              let price = 100;
              const random = Math.random();

              // if (random < 0.2) {
              //   price = Math.floor(Math.random() * (500000 - 200000) + 200000); // 20만 원 ~ 50만 원
              // } else if (random < 0.8) {
              //   price = Math.floor(Math.random() * (1000000 - 500000) + 500000); // 50만 원 ~ 100만 원
              // } else {
              //   price = Math.floor(Math.random() * (2000000 - 1000000) + 1000000); // 100만 원 ~ 200만 원
              // }

              let seatClass;
              if (price < 500000) {
                seatClass = '이코노미석';
              } else if (price < 1000000) {
                seatClass = '프리미엄 이코노미석';
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
                    city: INTERNATIONAL_DEPARTURE[deptCode],
                    date: departureDate,
                    time: departureTime
                  },
                  arrival: {
                    airport: arrCode,
                    city: INTERNATIONAL_ARRIVAL[arrCode],
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
                `✅ 저장 완료: ${flightNumber} (${airline}), ${moment(departureDate).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm')}, 좌석: ${seatsAvailable}, 가격: ${price.toLocaleString()}원, 등급: ${seatClass}`
              );
            }
          } catch (error) {
            console.error(`❌ API 요청 오류 (${deptCode} → ${arrCode}):`, error.message);
          }
        }
      }

      currentDate.add(1, 'days'); // 하루씩 증가
    }
  } finally {
    mongoose.connection.close();
  }
};

fetchInternationalFlights();
