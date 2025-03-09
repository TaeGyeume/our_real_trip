// import React, {useState, useEffect, useMemo} from 'react';
// import {useLocation, useNavigate} from 'react-router-dom';
// import {Box, Button, Typography} from '@mui/material';
// import SearchResultsList from '../../components/flights/SearchResultsList';
// import FilterPanel from '../../components/flights/Filterpanel';
// import FlightSearch from '../../components/flights/FlightSearch';
// import AdBanner from '../../components/ad/AdBanner';
// import {flightBannerData} from '../../data/bannerData';

// const FlightResults = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const flights = location.state?.flights || [];
//   const departure = location.state?.departure || '';
//   const arrival = location.state?.arrival || '';
//   const date = location.state?.date || new Date();
//   const passengers = location.state?.passengers || 1;

//   // 검색된 항공편 데이터에서 고유한 항공사 목록 추출
//   const availableAirlines = useMemo(() => {
//     const airlinesSet = new Set();
//     flights.forEach(flight => {
//       // flight.airline 이 항공사 정보를 담고 있다고 가정합니다.
//       if (flight.airline) {
//         airlinesSet.add(flight.airline);
//       }
//     });
//     return Array.from(airlinesSet);
//   }, [flights]);

//   // availableSeatTypes: 동적으로 추출 (예: flight.seatType이 존재한다고 가정)
//   const availableSeatTypes = useMemo(() => {
//     const seatSet = new Set();
//     flights.forEach(flight => {
//       if (flight.seatClass) {
//         seatSet.add(flight.seatClass);
//       }
//     });
//     return Array.from(seatSet);
//   }, [flights]);

//   // 예: 필터 상태(선택된 항공사 등)를 저장할 수 있음
//   const [selectedAirlines, setSelectedAirlines] = useState([]);
//   const [selectedTimes, setSelectedTimes] = useState([]);
//   const [selectedSeatTypes, setSelectedSeatTypes] = useState([]);

//   // availableAirlines가 변경되면 selectedAirlines를 초기화 (모든 항공사 선택)
//   useEffect(() => {
//     setSelectedAirlines(availableAirlines);
//   }, [availableAirlines]);

//   const filteredFlights = flights.filter(flight => {
//     return (
//       selectedAirlines.length > 0 &&
//       selectedSeatTypes.length > 0 &&
//       selectedAirlines.includes(flight.airline) &&
//       selectedSeatTypes.includes(flight.seatClass)
//     );
//   });

//   return (
//     <Box sx={{mt: 4, px: 2}}>
//       <Box sx={{mb: 3}}>
//         <FlightSearch
//           initialData={{
//             departure,
//             arrival,
//             date,
//             passengers
//           }}
//         />
//       </Box>
//       <Box
//         sx={{
//           width: '100%',
//           height: '2px',
//           backgroundColor: '#ccc',
//           mb: 1,
//           marginTop: '10px',
//           marginBottom: '30px'
//         }}
//       />
//       <Box sx={{display: 'flex', gap: 2}}>
//         {/* 왼쪽 필터 영역 */}
//         <Box sx={{width: 250 /* 혹은 적절한 너비 */, flexShrink: 0}}>
//           <FilterPanel
//             availableAirlines={availableAirlines}
//             selectedAirlines={selectedAirlines}
//             setSelectedAirlines={setSelectedAirlines}
//             availableSeatTypes={availableSeatTypes} // 추가된 prop
//             selectedSeatTypes={selectedSeatTypes}
//             setSelectedSeatTypes={setSelectedSeatTypes}
//             // 만약 출발 시간대 등 다른 필터도 있다면 전달
//           />
//         </Box>

//         {/* 오른쪽 검색 결과 영역 */}
//         <Box sx={{flex: 1}}>
//           <Box sx={{mb: 3, maxWidth: 880, margin: '0 auto'}}>
//             <AdBanner banners={flightBannerData} />
//           </Box>
//           {filteredFlights.length === 0 ? (
//             <Typography color="error" align="center">
//               검색된 항공편이 없습니다.
//             </Typography>
//           ) : (
//             <SearchResultsList flights={filteredFlights} passengers={passengers} />
//           )}

//           <Box sx={{textAlign: 'center', mt: 3}}>
//             <Button variant="outlined" onClick={() => navigate('/flights')}>
//               🔙 다시 검색하기
//             </Button>
//           </Box>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default FlightResults;

import React, {useState, useMemo, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Box, Button, Typography} from '@mui/material';
import FlightSearch from '../../components/flights/FlightSearch';
import FilterPanel from '../../components/flights/Filterpanel';
import SearchResultsList from '../../components/flights/SearchResultsList';
import AdBanner from '../../components/ad/AdBanner';
import {flightBannerData} from '../../data/bannerData';

const FlightResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const flights = location.state?.flights || [];
  const departure = location.state?.departure || '';
  const arrival = location.state?.arrival || '';
  const date = location.state?.date || new Date();
  const passengers = location.state?.passengers || 1;

  // 동적으로 availableAirlines 추출
  const availableAirlines = useMemo(() => {
    const airlinesSet = new Set();
    flights.forEach(flight => {
      if (flight.airline) {
        airlinesSet.add(flight.airline);
      }
    });
    return Array.from(airlinesSet);
  }, [flights]);

  // 동적으로 availableSeatTypes 추출 (예: flight.seatClass)
  const availableSeatTypes = useMemo(() => {
    const seatSet = new Set();
    flights.forEach(flight => {
      if (flight.seatClass) {
        seatSet.add(flight.seatClass);
      }
    });
    return Array.from(seatSet);
  }, [flights]);

  // 기본 필터 상태 관리
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedSeatTypes, setSelectedSeatTypes] = useState([]);

  // 가격대 상태 관리
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const maxPrice = useMemo(() => {
    if (flights.length === 0) return 1000000;
    return Math.max(...flights.map(flight => flight.price));
  }, [flights]);

  // availableAirlines/SeatTypes 변경 시 기본값 세팅 (모두 선택)
  useEffect(() => {
    setSelectedAirlines(availableAirlines);
  }, [availableAirlines]);

  useEffect(() => {
    setSelectedSeatTypes(availableSeatTypes);
  }, [availableSeatTypes]);

  // maxPrice가 변경되면 priceRange도 업데이트
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // 필터 적용 로직 (예시: 항공사, 좌석 종류, 가격대)
  const filteredFlights = flights.filter(flight => {
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

  return (
    <Box sx={{mt: 4, px: 2}}>
      {/* 상단 검색 컴포넌트 */}
      <Box sx={{mb: 3}}>
        <FlightSearch
          initialData={{
            departure,
            arrival,
            date,
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

        {/* 오른쪽 검색 결과 영역 */}
        <Box sx={{flex: 1}}>
          <Box sx={{mb: 3, maxWidth: 880, margin: '0 auto'}}>
            <AdBanner banners={flightBannerData} />
          </Box>
          {filteredFlights.length === 0 ? (
            <Typography color="error" align="center">
              검색된 항공편이 없습니다.
            </Typography>
          ) : (
            <SearchResultsList flights={filteredFlights} passengers={passengers} />
          )}

          <Box sx={{textAlign: 'center', mt: 3}}>
            <Button variant="outlined" onClick={() => navigate('/flights')}>
              🔙 다시 검색하기
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FlightResults;
