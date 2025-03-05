import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import FlightSearch from '../../components/flights/FlightSearch';
import RoundTripSearch from '../../components/flights/RoundTripSearch';
import FlightCardList from '../../components/flights/FlightCardList';
import {fetchFlights} from '../../api/flight/flights';
import moment from 'moment-timezone';
import {ToggleButton, Typography, Box, Chip} from '@mui/material';
import AdBanner from '../../components/ad/AdBanner';

const Flights = () => {
  const [flights, setFlights] = useState([]); // 전체 항공편 데이터
  const [isRoundTrip, setIsRoundTrip] = useState(false); // 왕복 여부 상태 추가
  const navigate = useNavigate(); // 검색 후 페이지 이동을 위한 useNavigate

  useEffect(() => {
    const getFlights = async () => {
      try {
        const data = await fetchFlights();
        setFlights(data || []);
      } catch (error) {
        console.error('항공편 데이터를 불러오는 데 실패:', error);
      }
    };
    getFlights();
  }, []);

  // 검색 핸들러: 입력한 출발, 도착, 날짜, 인원수에 맞는 항공편 필터링
  const handleSearch = ({departure, arrival, date, passengers}) => {
    console.log('검색 요청:', {departure, arrival, date, passengers});

    const formattedDate = moment(date, 'YYYY-MM-DD').startOf('day').utc().toISOString();

    const filtered = flights.filter(flight => {
      return (
        (!departure || flight.departure.airport === departure) &&
        (!arrival || flight.arrival.airport === arrival) &&
        (!date ||
          moment(flight.departure.date).utc().startOf('day').toISOString() ===
            formattedDate) &&
        (!passengers || flight.seatsAvailable >= passengers) // 좌석 수 필터링 추가
      );
    });

    console.log('필터링된 항공편:', filtered);

    // 검색된 데이터를 state로 전달하며 결과 페이지로 이동
    navigate('/flights/results', {state: {flights: filtered}});
  };

  const bannerData = [
    {image: '/images/ad/air1.png'},
    {image: '/images/ad/air2.png'},
    {image: '/images/ad/air3.png'},
    {image: '/images/ad/air4.png'}
  ];

  return (
    <div className="container mt-4">
      {/* <Typography variant="h5" fontWeight="bold" gutterBottom sx={{textAlign: 'center'}}>
        항공편 검색
      </Typography> */}

      {/* 편도/왕복 선택 버튼 */}
      <Box sx={{display: 'flex', justifyContent: 'left', gap: '10px', mb: 2}}>
        <ToggleButton
          value={false}
          selected={!isRoundTrip}
          onClick={() => setIsRoundTrip(false)}
          sx={{
            width: '80px', // 버튼 너비 설정
            height: '40px', // 버튼 높이 설정
            fontSize: '14px',
            fontWeight: 'bold',
            borderRadius: '10px', // 동그란 버튼
            backgroundColor: isRoundTrip ? '#e0e0e0' : '#00a5c0', // 선택 여부에 따라 색상 변경
            color: isRoundTrip ? 'black' : 'white', // 선택 여부에 따라 텍스트 색상 변경
            '&.Mui-selected': {
              backgroundColor: '#00a5c0', // 선택된 버튼의 배경색 강조
              color: 'white', // 선택된 버튼의 글씨 색
              '&:hover': {
                backgroundColor: '#00a5c0' // 마우스 오버 시 색상 유지
              }
            }
          }}>
          편도
        </ToggleButton>

        <ToggleButton
          value={true}
          selected={isRoundTrip}
          onClick={() => setIsRoundTrip(true)}
          sx={{
            width: '80px',
            height: '40px',
            fontSize: '14px',
            fontWeight: 'bold',
            borderRadius: '10px',
            backgroundColor: isRoundTrip ? '#00a5c0' : '#e0e0e0',
            color: isRoundTrip ? 'white' : 'black',
            '&.Mui-selected': {
              backgroundColor: '#00a5c0',
              color: 'white',
              '&:hover': {
                backgroundColor: '#00a5c0'
              }
            }
          }}>
          왕복
        </ToggleButton>
      </Box>

      {/* 편도 검색 or 왕복 검색 */}
      {isRoundTrip ? <RoundTripSearch /> : <FlightSearch onSearch={handleSearch} />}

      <Box
        sx={{
          width: '100%',
          height: '2px',
          backgroundColor: '#ccc',
          mb: 1,
          marginTop: '30px'
        }}
      />

      {/* 공지사항 추가 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f7f9fc',
          padding: '8px 12px',
          borderRadius: '8px',
          marginTop: '30px',
          marginBottom: '50px'
        }}>
        <Chip
          label="공지"
          sx={{
            backgroundColor: '#007bff',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            height: '20px',
            width: '50px',
            marginRight: '8px',
            borderRadius: '8px',
            textOverflow: 'ellipsis'
          }}
        />
        <Typography variant="body2" sx={{flex: 1}}>
          <strong>[공지]</strong> 제주항공사 시스템 점검에 따른 이용 제한 안내{' '}
          <span style={{color: '#999', fontSize: '12px'}}> | 2025-02-28</span>
        </Typography>
      </Box>

      <AdBanner banners={bannerData} />

      <FlightCardList flights={flights} />
      <FlightCardList flights={flights} />
      <FlightCardList flights={flights} />
    </div>
  );
};

export default Flights;
