// import React from 'react';
// import {useLocation, useNavigate} from 'react-router-dom';
// import FlightList from '../../components/flights/FlightList';

// const RoundTripReturn = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const {selectedDeparture, returnFlights, passengers} = location.state || {};

//   if (!selectedDeparture) {
//     return (
//       <p className="text-center text-danger">🚫 출발 항공편이 선택되지 않았습니다.</p>
//     );
//   }

//   const handleSelectReturn = flight => {
//     navigate('/flights/roundtrip-confirm', {
//       state: {selectedDeparture, selectedReturn: flight, passengers, isRoundTrip: true}
//     });
//   };

//   return (
//     <div className="container-md mt-4" style={{maxWidth: '900px'}}>
//       <h2 className="fw-bold mb-4 text-center">🛬 돌아오는 항공편 선택</h2>
//       <FlightList flights={returnFlights} onSelect={handleSelectReturn} />
//     </div>
//   );
// };

// export default RoundTripReturn;

import React, {useState, useMemo, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {Box, Typography, Paper} from '@mui/material';
import RoundTripSearch from '../../components/flights/RoundTripSearch';
import FilterPanel from '../../components/flights/Filterpanel';
import FlightList from '../../components/flights/FlightList';
import LoadingScreen from '../../components/flights/LoadingScreen';
import {searchFlights} from '../../api/flight/flights';
import AdBanner from '../../components/ad/AdBanner';
import {flightBannerData} from '../../data/bannerData';
import {AIRPORT_NAMES, AIRLINE_LOGOS} from '../../data/airline';

const RoundTripReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ 훅은 조건문 밖(최상위)에서 호출
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    selectedDeparture,
    returnFlights = [],
    passengers = 1,
    returnDate = new Date()
  } = location.state || {};

  // 필터 관련 훅도 최상위에서
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedSeatTypes, setSelectedSeatTypes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  // availableAirlines, availableSeatTypes 등도
  // 무조건 컴포넌트 함수 최상위에서 useMemo로 계산
  const availableAirlines = useMemo(() => {
    const airlinesSet = new Set();
    returnFlights.forEach(f => {
      if (f.airline) airlinesSet.add(f.airline);
    });
    return Array.from(airlinesSet);
  }, [returnFlights]);

  const availableSeatTypes = useMemo(() => {
    const seatSet = new Set();
    returnFlights.forEach(f => {
      if (f.seatClass) seatSet.add(f.seatClass);
    });
    return Array.from(seatSet);
  }, [returnFlights]);

  const maxPrice = useMemo(() => {
    if (!returnFlights.length) return 1000000;
    return Math.max(...returnFlights.map(f => f.price));
  }, [returnFlights]);

  useEffect(() => {
    setSelectedAirlines(availableAirlines);
  }, [availableAirlines]);

  useEffect(() => {
    setSelectedSeatTypes(availableSeatTypes);
  }, [availableSeatTypes]);

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // 필터링 로직
  const filteredFlights = returnFlights.filter(f => {
    if (selectedAirlines.length && !selectedAirlines.includes(f.airline)) return false;
    if (selectedSeatTypes.length && !selectedSeatTypes.includes(f.seatClass))
      return false;
    if (f.price < priceRange[0] || f.price > priceRange[1]) return false;
    return true;
  });

  // 복귀 항공편 선택 핸들러
  const handleSelectReturn = flight => {
    navigate('/flights/roundtrip-confirm', {
      state: {
        selectedDeparture,
        selectedReturn: flight,
        passengers,
        isRoundTrip: true
      }
    });
  };

  // ✅ 훅 호출이 끝난 뒤에야, JSX를 조건부로 반환
  // 만약 selectedDeparture가 없다면, 훅 호출은 이미 끝난 상태이므로 안전
  if (!selectedDeparture) {
    return (
      <Box sx={{textAlign: 'center', mt: 4}}>
        <Typography variant="h6" color="error">
          🚫 출발 항공편이 선택되지 않았습니다.
        </Typography>
      </Box>
    );
  }

  const departureAirportCode = selectedDeparture?.departure?.airport ?? '';
  const arrivalAirportCode = selectedDeparture?.arrival?.airport ?? '';

  const departureAirportName =
    AIRPORT_NAMES[departureAirportCode] || departureAirportCode;
  const arrivalAirportName = AIRPORT_NAMES[arrivalAirportCode] || arrivalAirportCode;

  const departureTime = selectedDeparture?.departure?.time || '00:00';
  const arrivalTime = selectedDeparture?.arrival?.time || '00:00';
  const flightAirline = selectedDeparture?.airline || '항공사 정보 없음';
  const flightNumber = selectedDeparture?.flightNumber || '편명 없음';
  const departureDateObj = selectedDeparture?.departure?.date
    ? new Date(selectedDeparture.departure.date)
    : new Date();

  const flightSeatClass = selectedDeparture?.seatClass || '정보 없음';
  const flightPrice = selectedDeparture?.price
    ? selectedDeparture.price.toLocaleString()
    : '0';

  const airlineLogoFile = AIRLINE_LOGOS[selectedDeparture.airline] || 'default.png';
  const airlineLogoUrl = `/images/logos/${airlineLogoFile}`;

  return (
    <Box sx={{mt: 4, px: 2}}>
      {/* 상단 RoundTripSearch: 이전 검색조건 표시 */}
      <Box sx={{mb: 3}}>
        <RoundTripSearch
          // 필요하다면 initialData 등을 넘겨서 기존 검색조건 유지
          initialData={{
            departure: departureAirportName,
            arrival: arrivalAirportName,
            departureDate: selectedDeparture.departure?.date || new Date(),
            returnDate,
            passengers
          }}
        />
      </Box>

      <Box
        sx={{
          width: '100%',
          height: '2px',
          backgroundColor: '#ccc',
          mt: '10px',
          mb: '30px'
        }}
      />

      {/* 2) "가는편 요약" 박스 예시 */}
      <Paper
        sx={{
          p: 2,
          mt: 3,
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
        <Box
          component="img"
          src={airlineLogoUrl}
          alt={flightAirline}
          sx={{width: 40, height: 40}}
        />
        <Box>
          <Typography variant="h6" sx={{fontWeight: 'bold', mb: 1}}>
            {flightAirline} / {flightNumber}
          </Typography>
          <Typography variant="body2">
            출발: {departureAirportName} ({departureTime}) → 도착: {arrivalAirportName} (
            {arrivalTime})
          </Typography>
          <Typography variant="body2" sx={{mt: 1}}>
            좌석: {flightSeatClass} / 가격: {flightPrice}원
          </Typography>
        </Box>
      </Paper>

      {errorMessage && (
        <Typography variant="body1" color="error" sx={{mb: 3}}>
          {errorMessage}
        </Typography>
      )}

      {loading ? (
        <LoadingScreen />
      ) : (
        <Box sx={{display: 'flex', gap: 2}}>
          {/* 좌측 필터 패널 */}
          <Box sx={{width: 250, flexShrink: 0}}>
            <FilterPanel
              availableAirlines={availableAirlines}
              selectedAirlines={selectedAirlines}
              setSelectedAirlines={setSelectedAirlines}
              availableSeatTypes={availableSeatTypes}
              selectedSeatTypes={selectedSeatTypes}
              setSelectedSeatTypes={setSelectedSeatTypes}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              maxPrice={maxPrice}
            />
          </Box>

          {/* 우측 결과 영역 */}
          <Box sx={{flex: 1}}>
            {/* 광고 배너 등을 넣고 싶다면 */}
            <Box sx={{mb: 3, maxWidth: 880, margin: '0 auto'}}>
              <AdBanner banners={flightBannerData} />
            </Box>

            {filteredFlights.length === 0 ? (
              <Typography color="error" align="center">
                검색된 항공편이 없습니다.
              </Typography>
            ) : (
              <FlightList flights={filteredFlights} onSelect={handleSelectReturn} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RoundTripReturn;
