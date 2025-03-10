import React, {useState, useMemo, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {Box, Typography} from '@mui/material';
import FlightList from '../../components/flights/FlightList';
import LoadingScreen from '../../components/flights/LoadingScreen';
import RoundTripSearch from '../../components/flights/RoundTripSearch';
import FilterPanel from '../../components/flights/Filterpanel';
import {searchFlights} from '../../api/flight/flights';
import AdBanner from '../../components/ad/AdBanner';
import {flightBannerData} from '../../data/bannerData';

const RoundTripDeparture = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // location.state에서 검색 조건 및 결과를 받아옴.
  const {departureFlights, passengers, returnDate, departureDate, departure, arrival} =
    location.state || {
      departureFlights: [],
      passengers: 1,
      departureDate: new Date(),
      returnDate: new Date(),
      departure: '',
      arrival: ''
    };

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 필터 상태 관리
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedSeatTypes, setSelectedSeatTypes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  // availableAirlines와 availableSeatTypes를 departureFlights에서 동적으로 추출
  const availableAirlines = useMemo(() => {
    const airlinesSet = new Set();
    departureFlights.forEach(flight => {
      if (flight.airline) {
        airlinesSet.add(flight.airline);
      }
    });
    return Array.from(airlinesSet);
  }, [departureFlights]);

  const availableSeatTypes = useMemo(() => {
    const seatSet = new Set();
    departureFlights.forEach(flight => {
      if (flight.seatClass) {
        seatSet.add(flight.seatClass);
      }
    });
    return Array.from(seatSet);
  }, [departureFlights]);

  // maxPrice 동적 계산 및 priceRange 초기화
  const maxPrice = useMemo(() => {
    if (departureFlights.length === 0) return 1000000;
    return Math.max(...departureFlights.map(flight => flight.price));
  }, [departureFlights]);

  useEffect(() => {
    setSelectedAirlines(availableAirlines);
  }, [availableAirlines]);

  useEffect(() => {
    setSelectedSeatTypes(availableSeatTypes);
  }, [availableSeatTypes]);

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // 필터 적용 로직: 항공사, 좌석 종류, 가격대
  const filteredFlights = departureFlights.filter(flight => {
    if (selectedAirlines.length === 0 || !selectedAirlines.includes(flight.airline)) {
      return false;
    }
    if (selectedSeatTypes.length === 0 || !selectedSeatTypes.includes(flight.seatClass)) {
      return false;
    }
    if (flight.price < priceRange[0] || flight.price > priceRange[1]) {
      return false;
    }
    return true;
  });

  // 출발 항공편을 선택하면 복귀 항공편 검색 후 RoundTripReturn 페이지로 이동하는 로직은 그대로 유지
  const handleSelectDeparture = async flight => {
    setLoading(true);
    let returnFlights = [];
    try {
      if (!returnDate) throw new Error('복귀 날짜가 설정되지 않았습니다.');

      returnFlights = await searchFlights(
        flight.arrival.airport,
        flight.departure.airport,
        returnDate,
        passengers
      );

      if (!returnFlights.length) throw new Error('복귀 항공편을 찾을 수 없습니다.');
    } catch (error) {
      console.error('복귀 항공편 검색 오류:', error);
      setErrorMessage('복귀 항공편 검색 중 오류가 발생했습니다.');
    }
    setTimeout(() => {
      setLoading(false);
      navigate('/flights/roundtrip-return', {
        state: {
          selectedDeparture: flight,
          returnFlights: returnFlights || [],
          passengers,
          returnDate
        }
      });
    }, 1000);
  };

  return (
    <Box sx={{mt: 4, px: 2}}>
      {/* 상단에 RoundTripSearch 컴포넌트를 추가하여 이전 검색 조건 표시 */}
      <Box sx={{mb: 3}}>
        <RoundTripSearch
          initialData={{
            departure,
            arrival,
            departureDate,
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

      {errorMessage && (
        <Typography variant="body1" color="error" sx={{mb: 2}}>
          {errorMessage}
        </Typography>
      )}
      {loading ? (
        <LoadingScreen />
      ) : (
        <Box sx={{display: 'flex', gap: 2}}>
          {/* 왼쪽 필터 영역 */}
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
          {/* 오른쪽 결과 영역 */}
          <Box sx={{flex: 1}}>
            <Box sx={{mb: 3, maxWidth: 880, margin: '0 auto'}}>
              <AdBanner banners={flightBannerData} />
            </Box>
            {filteredFlights.length === 0 ? (
              <Typography color="error" align="center">
                검색된 항공편이 없습니다.
              </Typography>
            ) : (
              <FlightList flights={filteredFlights} onSelect={handleSelectDeparture} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RoundTripDeparture;
