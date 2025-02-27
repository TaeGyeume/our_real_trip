// require('dotenv').config({path: require('path').resolve(__dirname, '../.env')});

// const mongoose = require('mongoose');
// const axios = require('axios');
// const moment = require('moment-timezone');
// const Flight = require('../models/Flight');

// const {DB_URI, SERVICE_KEY} = process.env;

// if (!DB_URI || !SERVICE_KEY) {
//   console.error('환경 변수(DB_URI 또는 SERVICE_KEY)가 설정되지 않았습니다.');
//   process.exit(1);
// }

// // MongoDB 연결
// mongoose
//   .connect(DB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 60000,
//     socketTimeoutMS: 60000
//   })
//   .then(() => console.log('MongoDB 연결 성공'))
//   .catch(err => console.error('MongoDB 연결 실패:', err));

// // const AIRPORT_NAMES = {
// //   GMP: '김포공항',
// //   ICN: '인천공항',
// //   PUS: '김해공항',
// //   CJU: '제주공항',
// //   TAE: '대구공항',
// //   KWJ: '광주공항',
// //   CJJ: '청주공항',
// //   RSU: '여수공항',
// //   MWX: '무안공항'
// // };

// // ✅ 여러 개의 출발/도착 공항 코드 설정
// const DEPARTURE_AIRPORTS = [
//   'GMP',
//   'ICN',
//   'PUS',
//   'CJU',
//   'TAE',
//   'KWJ',
//   'CJJ',
//   'RSU',
//   'MWX'
// ]; // 출발지 공항 리스트
// const ARRIVAL_AIRPORTS = ['PUS', 'CJU', 'GMP', 'ICN', 'TAE', 'KWJ', 'CJJ', 'RSU', 'MWX']; // 도착지 공항 리스트

// // // 필터링할 항공사
// // const ALLOWED_AIRLINES = [
// //   '대한항공',
// //   '아시아나항공',
// //   '에어서울',
// //   '이스타항공',
// //   '진에어',
// //   '티웨이항공',
// //   '제주항공'
// // ];

// // API 요청 함수
// const fetchAndSaveFlights = async () => {
//   try {
//     const serviceKey = SERVICE_KEY;

//     const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getDflightScheduleList`;
//     const params = {
//       serviceKey: serviceKey,
//       schDate: '20250226', // 조회 날짜
//       schDeptCityCode: 'GMP', // 출발 도시 코드
//       schArrvCityCode: 'PUS', // 도착 도시 코드
//       schAirLine: '', // 항공사 코드
//       schFlightNum: '', // 항공편 번호
//       _type: 'json'
//     };

//     axios
//       .get(url, {params})
//       .then(response => {
//         console.log('API Response:', response.data);
//       })
//       .catch(error => {
//         console.error('API Request Failed:', error.message);
//       });

//     // API 요청
//     const response = await axios.get(url, {params});
//     const flightData = response.data.response.body.items.item;

//     if (!flightData || flightData.length === 0) {
//       console.log('No flight data available');
//       return;
//     }

//     // 데이터 변환 및 저장
//     const flightsToSave = flightData.map(flight => ({
//       airline: flight.airlineKorean,
//       airlineKorean: flight.airlineKorean,
//       airlineHomepageUrl: flight.airlineHomepageUrl,

//       departure: {
//         airport: flight.startcity,
//         city: flight.startcity,
//         date: new Date(), // 원본 API 데이터에 날짜 정보 없을 경우 현재 날짜 사용
//         time: flight.domesticStartTime
//       },

//       arrival: {
//         airport: flight.arrivalcity,
//         city: flight.arrivalcity,
//         date: new Date(),
//         time: flight.domesticArrivalTime
//       },

//       flightNumber: flight.domesticNum,
//       operatingDays: [
//         flight.domesticSun === 'Y' ? 'Sunday' : null,
//         flight.domesticMon === 'Y' ? 'Monday' : null,
//         flight.domesticTue === 'Y' ? 'Tuesday' : null,
//         flight.domesticWed === 'Y' ? 'Wednesday' : null,
//         flight.domesticThu === 'Y' ? 'Thursday' : null,
//         flight.domesticFri === 'Y' ? 'Friday' : null,
//         flight.domesticSat === 'Y' ? 'Saturday' : null
//       ].filter(day => day !== null), // 'N'은 제외하고 'Y'만 필터링

//       price: 100,
//       // Math.floor(Math.random() * 300000) + 50000, // 임의의 가격 생성 (50,000 ~ 350,000)
//       seatsAvailable: Math.floor(Math.random() * 200) + 10, // 임의의 좌석 수 (10~200)
//       seatClass: 'Economy', // 기본 값 설정

//       totalCount: flight.totalCount,
//       numOfRows: flight.numOfRows,
//       pageNo: flight.pageNo
//     }));

//     await Flight.insertMany(flightsToSave);
//     console.log('Flight data saved successfully');
//   } catch (error) {
//     console.error('Error fetching flight data:', error);
//   } finally {
//     mongoose.connection.close(); // 작업 완료 후 DB 연결 종료
//   }
// };

// // 실행
// fetchAndSaveFlights();

// const axios = require('axios');
// const mongoose = require('mongoose');
// const moment = require('moment-timezone');
// const Flight = require('../models/Flight');

// require('dotenv').config({path: require('path').resolve(__dirname, '../.env')});

// const {DB_URI, SERVICE_KEY} = process.env;

// if (!DB_URI || !SERVICE_KEY) {
//   console.error('환경 변수(DB_URI 또는 SERVICE_KEY)가 설정되지 않았습니다.');
//   process.exit(1);
// }

// // ✅ MongoDB 연결
// mongoose
//   .connect(DB_URI)
//   .then(() => console.log('MongoDB 연결 성공'))
//   .catch(err => console.error('MongoDB 연결 실패:', err));

// // ✅ 출발/도착 공항 코드 리스트
// const DEPARTURE_AIRPORTS = [
//   'GMP',
//   'ICN',
//   'PUS',
//   'CJU',
//   'TAE',
//   'KWJ',
//   'CJJ',
//   'RSU',
//   'MWX'
// ]; // 출발지
// const ARRIVAL_AIRPORTS = ['GMP', 'ICN', 'PUS', 'CJU', 'TAE', 'KWJ', 'CJJ', 'RSU', 'MWX']; // 도착지

// // ✅ 공항 코드와 공항명 매핑
// const AIRPORT_NAMES = {
//   GMP: '김포공항',
//   ICN: '인천공항',
//   PUS: '김해공항',
//   CJU: '제주공항',
//   TAE: '대구공항',
//   KWJ: '광주공항',
//   CJJ: '청주공항',
//   RSU: '여수공항',
//   MWX: '무안공항'
// };

// const fetchAndSaveFlights = async () => {
//   try {
//     let totalFlights = [];

//     for (const deptCity of DEPARTURE_AIRPORTS) {
//       for (const arrvCity of ARRIVAL_AIRPORTS) {
//         if (deptCity === arrvCity) continue;

//         console.log(`Fetching flights from ${deptCity} to ${arrvCity}...`);

//         const url = `http://openapi.airport.co.kr/service/rest/FlightScheduleList/getDflightScheduleList`;
//         const params = {
//           serviceKey: SERVICE_KEY,
//           schDate: '20250226',
//           schDeptCityCode: deptCity,
//           schArrvCityCode: arrvCity,
//           schAirLine: '',
//           schFlightNum: '',
//           _type: 'json'
//         };

//         try {
//           const response = await axios.get(url, {params});
//           const flightData = response.data.response.body.items?.item || [];

//           if (!flightData.length) {
//             console.log(`⚠ No flight data for ${deptCity} → ${arrvCity}`);
//             continue;
//           }

//           // ✅ 데이터 변환
//           const flightsToSave = flightData.map(flight => ({
//             airline: flight.airlineKorean,
//             flightNumber: flight.domesticNum,

//             departure: {
//               airport: deptCity,
//               city: AIRPORT_NAMES[deptCity] || deptCity,
//               date: moment.tz('Asia/Seoul').format(), // 한국 시간 기준 ISO 날짜 저장
//               time: flight.domesticStartTime
//             },

//             arrival: {
//               airport: arrvCity,
//               city: AIRPORT_NAMES[arrvCity] || arrvCity,
//               date: moment.tz('Asia/Seoul').format(),
//               time: flight.domesticArrivalTime
//             },

//             operatingDays: [
//               flight.domesticSun === 'Y' ? '일요일' : null,
//               flight.domesticMon === 'Y' ? '월요일' : null,
//               flight.domesticTue === 'Y' ? '화요일' : null,
//               flight.domesticWed === 'Y' ? '수요일' : null,
//               flight.domesticThu === 'Y' ? '목요일' : null,
//               flight.domesticFri === 'Y' ? '금요일' : null,
//               flight.domesticSat === 'Y' ? '토요일' : null
//             ].filter(day => day !== null),

//             price: 100, // 기본 가격 설정
//             seatsAvailable: Math.floor(Math.random() * 200) + 10, // 임의 좌석 수
//             seatClass: '이코노미석'
//           }));

//           totalFlights = totalFlights.concat(flightsToSave);
//         } catch (error) {
//           console.error(`❌ API 요청 실패 (${deptCity} → ${arrvCity}):`, error.message);
//         }

//         await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 딜레이
//       }
//     }

//     if (totalFlights.length) {
//       await Flight.insertMany(totalFlights);
//       console.log(`🚀 총 ${totalFlights.length}개의 항공편 데이터 저장 완료!`);
//     } else {
//       console.log('⚠ 저장할 데이터가 없습니다.');
//     }
//   } catch (error) {
//     console.error('❌ Error fetching flight data:', error);
//   } finally {
//     mongoose.connection.close();
//   }
// };

// // 실행
// fetchAndSaveFlights();

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
  console.log('✈️ 국내선 데이터 수집 시작...');
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
        console.error(`❌ API 요청 실패 (${deptCity} → ${arrCity}):`, error.message);
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
        console.error(`❌ API 요청 실패 (${deptCity} → ${arrCity}):`, error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// 실행
fetchDomesticFlights();
fetchInternationalFlights();
