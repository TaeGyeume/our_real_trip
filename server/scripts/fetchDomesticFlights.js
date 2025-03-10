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
// const saveFlightToDB = async (flight, deptCode, arrCode, isInternational) => {
//   const airline = flight.airlineKorean || 'Unknown Airline';
//   const flightNumber =
//     flight.domesticNum ||
//     flight.internationalNum ||
//     `FL-${Math.random().toString(36).substr(2, 5)}`;

//   const departureTime = flight.domesticStartTime || flight.internationalTime || '0000';
//   const arrivalTime = flight.domesticArrivalTime || flight.internationalTime || '0000';

//   const departureDate = moment().tz('Asia/Seoul').startOf('day').toDate();
//   const arrivalDate = moment().tz('Asia/Seoul').startOf('day').toDate();

//   const operatingDays = getOperatingDays(flight);
//   const seatsAvailable = Math.floor(Math.random() * 10) + 1;

//   // 이코노미석(70%), 비즈니스석(20%), 특가석(10%) 비율로 배정
//   const {seatClass, price} = getRandomSeatAndPrice();

//   // let seatClass;
//   // if (price < 50000) {
//   //   seatClass = '특가석';
//   // } else if (price < 100000) {
//   //   seatClass = '이코노미석';
//   // } else {
//   //   seatClass = '비즈니스석';
//   // }

//   await Flight.updateOne(
//     {flightNumber, 'departure.date': departureDate},
//     {
//       airline,
//       flightNumber,
//       departure: {
//         airport: deptCode,
//         city: AIRPORT_NAMES[deptCode] || deptCode,
//         date: departureDate,
//         time: departureTime
//       },
//       arrival: {
//         airport: arrCode,
//         city: AIRPORT_NAMES[arrCode] || arrCode,
//         date: arrivalDate,
//         time: arrivalTime
//       },
//       operatingDays,
//       price,
//       seatsAvailable,
//       seatClass
//     },
//     {upsert: true}
//   );

//   console.log(
//     `저장 완료: ${flightNumber} (${airline}), ${moment(departureDate).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm')}, 좌석: ${seatsAvailable}, 가격: ${price.toLocaleString()}원, 등급: ${seatClass}`
//   );
// };
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
  const {seatClass, price} = getRandomSeatAndPrice(isInternational);

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

// 이 함수 안에서 등급과 가격을 결정 (isInternational 값에 따라 다르게 처리)
function getRandomSeatAndPrice(isInternational) {
  const rand = Math.random();
  let seatClass, price;

  if (!isInternational) {
    // 국내선 가격 범위
    if (rand < 0.1) {
      // 10% 확률: 특가석 (30,000원 이상 50,000원 미만)
      seatClass = '특가석';
      price = Math.floor(Math.random() * (50000 - 30000)) + 30000;
    } else if (rand < 0.8) {
      // 70% 확률: 이코노미석 (50,000원 이상 70,000원 미만)
      seatClass = '이코노미석';
      price = Math.floor(Math.random() * (70000 - 50000)) + 50000;
    } else {
      // 20% 확률: 비즈니스석 (70,000원 이상 130,000원 미만)
      seatClass = '비즈니스석';
      price = Math.floor(Math.random() * (130000 - 70000)) + 70000;
    }
  } else {
    // 국제선 가격 범위
    if (rand < 0.1) {
      // 10% 확률: 특가석 (100,000원 이상 200,000원 미만)
      seatClass = '특가석';
      price = Math.floor(Math.random() * (200000 - 100000)) + 100000;
    } else if (rand < 0.8) {
      // 70% 확률: 이코노미석 (200,000원 이상 500,000원 미만)
      seatClass = '이코노미석';
      price = Math.floor(Math.random() * (500000 - 200000)) + 200000;
    } else {
      // 20% 확률: 비즈니스석 (700,000원 이상 2,000,000원 미만)
      seatClass = '비즈니스석';
      price = Math.floor(Math.random() * (2000000 - 700000)) + 700000;
    }
  }

  return {seatClass, price};
}

// // 국내선 데이터 수집
// const fetchDomesticFlights = async () => {
//   console.log('국내선 데이터 수집 시작...');
//   for (const deptCity of Object.keys(AIRPORT_NAMES)) {
//     for (const arrCity of Object.keys(AIRPORT_NAMES)) {
//       if (deptCity === arrCity) continue;
//       console.log(`Fetching domestic flights from ${deptCity} → ${arrCity}`);

//       const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getDflightScheduleList`;
//       const params = {
//         serviceKey: SERVICE_KEY,
//         schDate: moment().tz('Asia/Seoul').format('YYYYMMDD'),
//         schDeptCityCode: deptCity,
//         schArrvCityCode: arrCity,
//         schAirLine: '',
//         schFlightNum: '',
//         _type: 'json'
//       };

//       try {
//         const response = await axios.get(url, {params});
//         const flights = response.data?.response?.body?.items?.item || [];

//         for (const flight of flights) {
//           await saveFlightToDB(flight, deptCity, arrCity, false);
//         }
//       } catch (error) {
//         console.error(`API 요청 실패 (${deptCity} → ${arrCity}):`, error.message);
//       }

//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//   }
// };

// // 국제선 데이터 수집
// const fetchInternationalFlights = async () => {
//   console.log('🌍 국제선 데이터 수집 시작...');
//   for (const deptCity of Object.keys(AIRPORT_NAMES)) {
//     for (const arrCity of Object.keys(AIRPORT_NAMES)) {
//       if (deptCity === arrCity) continue;
//       console.log(`Fetching international flights from ${deptCity} → ${arrCity}`);

//       const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getIflightScheduleList`;
//       const params = {
//         serviceKey: SERVICE_KEY,
//         schDate: moment().tz('Asia/Seoul').format('YYYYMMDD'),
//         schDeptCityCode: deptCity,
//         schArrvCityCode: arrCity,
//         schAirLine: '',
//         schFlightNum: '',
//         _type: 'json'
//       };

//       try {
//         const response = await axios.get(url, {params});
//         const flights = response.data?.response?.body?.items?.item || [];

//         for (const flight of flights) {
//           await saveFlightToDB(flight, deptCity, arrCity, true);
//         }
//       } catch (error) {
//         console.error(` API 요청 실패 (${deptCity} → ${arrCity}):`, error.message);
//       }

//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//   }
// };

// 국내선 데이터 수집
const fetchDomesticFlights = async () => {
  console.log('국내선 데이터 수집 시작...');

  // "오늘부터 10일 뒤"까지 반복
  for (let i = 0; i <= 10; i++) {
    // i일 뒤 날짜 (YYYYMMDD 포맷)
    const dateStr = moment().tz('Asia/Seoul').add(i, 'days').format('YYYYMMDD');
    console.log(`-- ${dateStr} 기준 국내선 데이터 수집`);

    for (const deptCity of Object.keys(AIRPORT_NAMES)) {
      for (const arrCity of Object.keys(AIRPORT_NAMES)) {
        if (deptCity === arrCity) continue;

        const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getDflightScheduleList`;
        const params = {
          serviceKey: SERVICE_KEY,
          schDate: dateStr, // ← 날짜 파라미터에 dateStr 사용
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
            // DB에 저장할 때도 i일 뒤 날짜를 넘겨줌
            await saveFlightToDB(flight, deptCity, arrCity, false, i);
          }
          // 데이터가 없으면 짧은 대기, 있으면 1초 대기
          const delayTime = flights.length === 0 ? 100 : 1000;
          await new Promise(resolve => setTimeout(resolve, delayTime));
        } catch (error) {
          console.error(
            `API 요청 실패 (${deptCity} → ${arrCity}, date: ${dateStr}):`,
            error.message
          );
        }

        // 실패 시에도 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
};

// 국제선 데이터 수집
const fetchInternationalFlights = async () => {
  console.log('🌍 국제선 데이터 수집 시작...');

  for (let i = 0; i <= 10; i++) {
    const dateStr = moment().tz('Asia/Seoul').add(i, 'days').format('YYYYMMDD');
    console.log(`-- ${dateStr} 기준 국제선 데이터 수집`);

    for (const deptCity of Object.keys(AIRPORT_NAMES)) {
      for (const arrCity of Object.keys(AIRPORT_NAMES)) {
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
          // 데이터가 없으면 짧은 대기, 있으면 1초 대기
          const delayTime = flights.length === 0 ? 100 : 1000;
          await new Promise(resolve => setTimeout(resolve, delayTime));
        } catch (error) {
          console.error(
            `API 요청 실패 (${deptCity} → ${arrCity}, date: ${dateStr}):`,
            error.message
          );
        }

        // 실패 시에도 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
};

// 실행
fetchDomesticFlights();
fetchInternationalFlights();
