import React from 'react';
import {Box, Card, Typography, Divider} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';

dayjs.locale('ko');

const AIRLINE_LOGOS = {
  대한항공: '/images/logos/korean.png',
  아시아나항공: '/images/logos/asiana.png',
  에어서울: '/images/logos/airseoul.png',
  이스타항공: '/images/logos/eastar.png',
  진에어: '/images/logos/jinair.png',
  티웨이항공: '/images/logos/twayair.png',
  제주항공: '/images/logos/jejuair.png',
  에어부산: '/images/logos/airbusan.png',
  피치항공: '/images/logos/peach.png',
  '집에어 도쿄': '/images/logos/zipair_tokyo.png',
  에어재팬화물항공: '/images/logos/airjapan.png',
  전일본공수: '/images/logos/ana.jpg',
  일본항공: '/images/logos/japanair.png',
  에어로케이항공: '/images/logos/airok.png',
  프랑스항공: '/images/logos/airfrance.png',
  중국국제항공: '/images/logos/airchina.png',
  중국남방항공: '/images/logos/chinaair.png',
  중국동방항공: '/images/logos/china.png',
  중화항공: '/images/logos/cchina.jpg',
  '젯스타 에어웨이즈': '/images/logos/jetstar_logo.png',
  '호주항공(콴타스항공)': '/images/logos/QF.png',
  에어프레미아: '/images/logos/YP.png',
  타이항공: '/images/logos/TG.png',
  에바항공: '/images/logos/BR.png',
  '에바항공(장영항공)': '/images/logos/BR.png',
  춘추항공: '/images/logos/chunchu.png'
};

const AIRPORT_OPTIONS = [
  {code: 'GMP', name: '김포'},
  {code: 'ICN', name: '인천'},
  {code: 'PUS', name: '김해'},
  {code: 'CJU', name: '제주'},
  {code: 'TAE', name: '대구'},
  {code: 'KWJ', name: '광주'},
  {code: 'CJJ', name: '청주'},
  {code: 'RSU', name: '여수'},
  {code: 'MWX', name: '무안'},
  {code: 'HND', name: '하네다공항'},
  {code: 'NRT', name: '나리타공항'},
  {code: 'JFK', name: '존 F. 케네디 국제공항'},
  {code: 'CDG', name: '샤를 드골공항'},
  {code: 'PEK', name: '베이징공항'},
  {code: 'PKX', name: '베이징 다싱공항'},
  {code: 'TSA', name: '타이베이 송산공항'},
  {code: 'LHR', name: '런던 히드로공항'},
  {code: 'SYD', name: '시드니공항'},
  {code: 'BKK', name: '방콕공항'}
];

const FlightTimelineInfo = ({booking}) => {
  // booking이 없거나 flight 타입이 없으면 null 반환
  if (!booking || !booking.types?.includes('flight') || !booking.productIds?.length) {
    return null;
  }

  // 기존에는 첫번째 항공편만 사용했으나,
  // 이제 예약된 모든 항공편을 순회하여 각각 렌더링합니다.
  return (
    <Box>
      {booking.productIds.map((flightData, index) => {
        if (!flightData) return null;

        // 날짜/요일 추출 (각 항공편마다 다를 수 있음)
        const rawDate = flightData.departure?.date; // 예: "2023-12-14T00:00:00Z"
        const formattedDate = rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : null;
        const monthDay = formattedDate
          ? `${parseInt(formattedDate.split('-')[1])}월 ${parseInt(formattedDate.split('-')[2])}일`
          : '날짜 없음';
        const dayOfWeek = rawDate ? dayjs(rawDate).format('ddd') : '';

        // 항공사 로고
        const logoSrc = AIRLINE_LOGOS[flightData.name] || '/images/logos/default.png';

        // 상태 배지 (예: '여행완료', '예약완료' 등)
        const statusBadge = '예약완료';

        // 시간 포맷 함수 (시간 문자열이 "HHMM" 형태라고 가정)
        const formatTime = timeString => {
          if (!timeString || typeof timeString !== 'string' || timeString.length !== 4) {
            return '시간 미정';
          }
          return `${timeString.substr(0, 2)}:${timeString.substr(2, 2)}`;
        };

        // 공항 코드 → 공항 이름 매핑
        const getAirportName = code => {
          const airport = AIRPORT_OPTIONS.find(item => item.code === code);
          return airport ? airport.name : code;
        };

        return (
          <Box sx={{position: 'relative', mb: 4}} key={index}>
            {/* 왼쪽에 날짜/요일 타임라인 */}
            <Box sx={{position: 'relative', pl: 3, mb: 2}}>
              {/* 둥근 점 */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 6,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main'
                }}
              />
              {/* 수직 라인 */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 4,
                  top: 16,
                  width: '2px',
                  height: '700%',
                  backgroundColor: '#ccc'
                }}
              />
              <Typography variant="subtitle1" sx={{fontWeight: 'bold', ml: 2}}>
                {monthDay} ( {dayOfWeek} )
              </Typography>
            </Box>

            {/* 카드 영역 */}
            <Card
              sx={{
                ml: 3, // 타임라인 점과 겹치지 않도록 여백
                p: 2,
                borderRadius: 2,
                boxShadow: 3,
                position: 'relative'
              }}>
              {/* 상태 배지 & 항공편 구간 */}
              <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                  {/* 상태 배지 */}
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: 'grey.200',
                      mr: 1
                    }}>
                    <Typography variant="caption" sx={{color: 'text.primary'}}>
                      {statusBadge}
                    </Typography>
                  </Box>
                  {/* 항공편 구간 */}
                  <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                    [{flightData.name}] {getAirportName(flightData.departure.airport)} -{' '}
                    {getAirportName(flightData.arrival.airport)}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* 항공편 아이콘 / 시간 / 편명 */}
              <Box sx={{display: 'flex', alignItems: 'center', mt: 2}}>
                {/* 항공사 로고 + 항공편 정보 */}
                <Box sx={{display: 'flex', alignItems: 'center', mr: 3}}>
                  <Box
                    component="img"
                    src={logoSrc}
                    alt={flightData.name}
                    sx={{width: 40, height: 40, objectFit: 'contain', mr: 1}}
                  />
                  <Box>
                    <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                      {flightData.name}
                    </Typography>
                    <Typography variant="body2" sx={{color: 'text.secondary'}}>
                      {flightData.flightNumber}
                    </Typography>
                  </Box>
                </Box>

                {/* 출발 정보 */}
                <Box sx={{textAlign: 'center', mr: 2}}>
                  <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                    {formatTime(flightData.departure?.time || '--:--')}
                  </Typography>
                  <Typography variant="caption" sx={{color: 'text.secondary'}}>
                    {flightData.departure?.airport || 'CJU'}
                  </Typography>
                </Box>

                <Box sx={{mx: 1}}>
                  <FlightTakeoffIcon sx={{color: 'text.secondary', mr: 0.5}} />
                </Box>

                <Box sx={{mx: 1}}>--------------------------------</Box>

                <Box sx={{mx: 1}}>
                  <FlightLandIcon sx={{color: 'text.secondary'}} />
                </Box>

                {/* 도착 정보 */}
                <Box sx={{textAlign: 'center', mr: 'auto'}}>
                  <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                    {formatTime(flightData.arrival?.time || '--:--')}
                  </Typography>
                  <Typography variant="caption" sx={{color: 'text.secondary'}}>
                    {flightData.arrival?.airport || 'GMP'}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
};

export default FlightTimelineInfo;
