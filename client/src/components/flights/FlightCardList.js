import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import Slider from 'react-slick';
import {Box, Typography, IconButton} from '@mui/material';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {FLIGHT_IMAGES, AIRPORT_NAMES} from '../../data/airline';
import {ChevronLeft, ChevronRight} from '@mui/icons-material';
import {searchFlights} from '../../api/flight/flights';

const FlightCardList = ({flights, type = 'domestic'}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // 클릭 시, 해당 항공편의 정보를 검색 조건으로 API 호출 후 결과 페이지로 이동
  const handleCardClick = async flight => {
    try {
      // 출발지, 도착지, 날짜, 인원수(기본 1)를 검색 조건으로 지정
      const deptCodes = [flight.departure.airport];
      const arrCodes = [flight.arrival.airport];
      const formattedDate = new Date(flight.departure.date).toLocaleDateString('en-CA'); // YYYY-MM-DD 형식

      let searchResults = [];
      for (const deptCode of deptCodes) {
        for (const arrCode of arrCodes) {
          const results = await searchFlights(deptCode, arrCode, formattedDate, 1);
          searchResults = [...searchResults, ...results];
        }
      }

      if (searchResults.length === 0) {
        alert('검색 조건에 맞는 항공편이 없습니다.');
      } else {
        const departureName = AIRPORT_NAMES[deptCodes] || deptCodes;
        const arrivalName = AIRPORT_NAMES[arrCodes] || arrCodes;
        navigate('/flights/results', {
          state: {
            flights: searchResults,
            passengers: 1,
            departure: departureName,
            arrival: arrivalName,
            date: flight.departure.date
          }
        });
      }
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
    }
  };

  const domesticArrivalAirports = [
    'ICN',
    'CJU',
    'PUS',
    'TAE',
    'KWJ',
    'CJJ',
    'RSU',
    'MWX'
  ];
  const internationalArrivalAirports = [
    'HND',
    'JFK',
    'CDG',
    'PEK',
    'TSA',
    'LHR',
    'SYD',
    'BKK'
  ];

  // type에 따라 필터 조건 적용
  const filteredFlights = flights
    .filter(flight => ['GMP', 'ICN'].includes(flight.departure.airport))
    .filter(flight => {
      if (type === 'domestic') {
        return domesticArrivalAirports.includes(flight.arrival.airport);
      } else if (type === 'international') {
        return internationalArrivalAirports.includes(flight.arrival.airport);
      }
      return true;
    });

  // 각 도착 공항별 가장 저렴한 항공편만 선택 (중복 제거)
  const uniqueFlights = [];
  const seenAirports = new Set();
  filteredFlights
    .sort((a, b) => a.price - b.price)
    .forEach(flight => {
      if (!seenAirports.has(flight.arrival.airport)) {
        seenAirports.add(flight.arrival.airport);
        uniqueFlights.push(flight);
      }
    });

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 2,
    nextArrow: <NextArrow isHovered={isHovered} />,
    prevArrow: <PrevArrow isHovered={isHovered} />,
    responsive: [
      {breakpoint: 1200, settings: {slidesToShow: 3}},
      {breakpoint: 800, settings: {slidesToShow: 2}},
      {breakpoint: 480, settings: {slidesToShow: 1}}
    ]
  };

  return (
    <Box sx={{mt: 4, px: 2}}>
      <Typography variant="h5" align="center" sx={{mb: 3, fontWeight: 'bold'}}>
        {type === 'domestic'
          ? '🧸 나를 위한 리셋, 마음을 담은 국내 여행 💕 🧳'
          : '🎈언제나 꿈꾸던 그 곳, 핫플레이스로 떠나볼까요🧡🍒⛱️'}
      </Typography>

      {uniqueFlights.length > 0 ? (
        <Box
          sx={{
            position: 'relative'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          <Slider {...settings}>
            {uniqueFlights.map(flight => {
              const departureName = AIRPORT_NAMES[flight.departure.airport] || '출발지';
              const arrivalName = AIRPORT_NAMES[flight.arrival.airport] || '도착지';
              const flightImage =
                FLIGHT_IMAGES[arrivalName] || '/images/flights/default.jpg';

              return (
                <Box key={flight._id} sx={{px: 1}}>
                  <Box
                    onClick={() => handleCardClick(flight)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      boxShadow: 2,
                      overflow: 'hidden',
                      bgcolor: '#fff'
                    }}>
                    <Box
                      component="img"
                      src={flightImage}
                      alt={arrivalName}
                      sx={{
                        height: 150,
                        width: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <Box sx={{p: 2}}>
                      <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                        {arrivalName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {departureName} → {arrivalName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(flight.departure.date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric'
                        })}{' '}
                        -{' '}
                        {new Date(flight.arrival.date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                      <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                        {flight.price.toLocaleString()}원 ~
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Slider>
        </Box>
      ) : (
        <Box sx={{textAlign: 'center', py: 5}}>
          <Typography variant="body1">표시할 항공편이 충분하지 않습니다.</Typography>
        </Box>
      )}
    </Box>
  );
};

const NextArrow = ({onClick, isHovered, style}) => (
  <IconButton
    onClick={onClick}
    sx={{
      ...style,
      position: 'absolute',
      right: '-35px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      fontSize: '24px',
      cursor: 'pointer',
      backgroundColor: '#fff',
      borderRadius: '50%',
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      userSelect: 'none',
      opacity: isHovered ? 1 : 0
    }}>
    <ChevronRight sx={{fontSize: '1.5rem'}} />
  </IconButton>
);

const PrevArrow = ({onClick, isHovered, style}) => (
  <IconButton
    onClick={onClick}
    sx={{
      ...style,
      position: 'absolute',
      left: '-35px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      fontSize: '24px',
      cursor: 'pointer',
      backgroundColor: '#fff',
      borderRadius: '50%',
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      userSelect: 'none',
      opacity: isHovered ? 1 : 0
    }}>
    <ChevronLeft sx={{fontSize: '1.5rem'}} />
  </IconButton>
);

export default FlightCardList;
