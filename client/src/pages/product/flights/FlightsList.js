import React, {useEffect, useState, useCallback} from 'react';
import {getFlights, deleteFlight} from '../../../api/flight/flights';
import {useNavigate} from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import dayjs from 'dayjs';
import {Divider} from '@mui/material';

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
  {code: 'GMP', name: '김포공항'},
  {code: 'ICN', name: '인천공항'},
  {code: 'PUS', name: '김해공항'},
  {code: 'CJU', name: '제주공항'},
  {code: 'TAE', name: '대구공항'},
  {code: 'KWJ', name: '광주공항'},
  {code: 'CJJ', name: '청주공항'},
  {code: 'RSU', name: '여수공항'},
  {code: 'MWX', name: '무안공항'},
  {code: 'HND', name: '하네다공항'},
  {code: 'NRT', name: '나리타공항'},
  {code: 'JFK', name: '뉴욕 JFK공항'},
  {code: 'CDG', name: '샤를 드골공항'},
  {code: 'PEK', name: '베이징공항'},
  {code: 'PKX', name: '베이징 다싱공항'},
  {code: 'TSA', name: '타이베이 송산공항'},
  {code: 'LHR', name: '런던 히드로공항'},
  {code: 'SYD', name: '시드니공항'},
  {code: 'BKK', name: '방콕공항'}
];

const SEAT_CLASS_OPTIONS = ['이코노미석', '프리미엄 이코노미석', '비즈니스석'];
const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

const AdminFlightsList = () => {
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const flightsPerPage = 10;
  const navigate = useNavigate();

  // 검색 필드 상태
  const [searchDeparture, setSearchDeparture] = useState('');
  const [searchArrival, setSearchArrival] = useState('');
  const [searchOperatingDay, setSearchOperatingDay] = useState('');
  const [searchSeatClass, setSearchSeatClass] = useState('');
  const [searchFlightNumber, setSearchFlightNumber] = useState('');

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      setLoading(true);
      const data = await getFlights();
      console.log('API 응답 데이터:', data);
      setFlights(data || []);
      setFilteredFlights(data || []);
    } catch (error) {
      console.error('항공편 목록을 불러오는 중 오류 발생:', error);
      setError('항공편 데이터를 불러오는 데 실패했습니다.');
      setFlights([]);
      setFilteredFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    const filtered = flights.filter(flight => {
      const matchesDeparture =
        searchDeparture === '' || flight.departure.airport === searchDeparture;
      const matchesArrival =
        searchArrival === '' || flight.arrival.airport === searchArrival;
      const matchesOperatingDay =
        searchOperatingDay === '' ||
        (flight.operatingDays && flight.operatingDays.includes(searchOperatingDay));
      const matchesSeatClass =
        searchSeatClass === '' || flight.seatClass === searchSeatClass;
      const matchesFlightNumber =
        searchFlightNumber === '' ||
        flight.flightNumber.toLowerCase().includes(searchFlightNumber.toLowerCase());

      return (
        matchesDeparture &&
        matchesArrival &&
        matchesOperatingDay &&
        matchesSeatClass &&
        matchesFlightNumber
      );
    });

    setFilteredFlights(filtered);
  }, [
    flights,
    searchDeparture,
    searchArrival,
    searchOperatingDay,
    searchSeatClass,
    searchFlightNumber
  ]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [applyFilters]);

  const handleDelete = async id => {
    if (window.confirm('이 항공편을 삭제하시겠습니까?')) {
      try {
        await deleteFlight(id);
        loadFlights(); // 삭제 후 목록 다시 불러오기
      } catch (error) {
        console.error('삭제 오류:', error);
      }
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredFlights.length / flightsPerPage);
  const startIndex = (currentPage - 1) * flightsPerPage;
  const endIndex = startIndex + flightsPerPage;
  const currentFlights = filteredFlights.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Container sx={{mt: 4, textAlign: 'center'}}>
        <CircularProgress />
        <Typography variant="body1" sx={{mt: 2}}>
          항공편 데이터를 불러오는 중...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{mt: 4}}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{mt: 4}} maxWidth="1200px">
      <Typography variant="h5" align="center" gutterBottom>
        항공편 검색 (관리자)
      </Typography>

      {/* 검색 폼 */}
      <Box
        component="form"
        sx={{
          width: '100%',
          maxWidth: '900px',
          mx: 'auto',
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 3,
          mb: 3,
          alignItems: 'center',
          overflowX: 'auto'
        }}
        noValidate
        autoComplete="off">
        {/* 출발공항 검색 */}
        <FormControl sx={{minWidth: 120}}>
          <InputLabel>출발공항</InputLabel>
          <Select
            label="출발공항"
            value={searchDeparture}
            onChange={e => setSearchDeparture(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {AIRPORT_OPTIONS.map(airport => (
              <MenuItem key={airport.code} value={airport.code}>
                {airport.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 도착공항 검색 */}
        <FormControl sx={{minWidth: 120}}>
          <InputLabel>도착공항</InputLabel>
          <Select
            label="도착공항"
            value={searchArrival}
            onChange={e => setSearchArrival(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {AIRPORT_OPTIONS.map(airport => (
              <MenuItem key={airport.code} value={airport.code}>
                {airport.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 운항 요일 검색 */}
        <FormControl sx={{minWidth: 120}}>
          <InputLabel>운항 요일</InputLabel>
          <Select
            label="운항 요일"
            value={searchOperatingDay}
            onChange={e => setSearchOperatingDay(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {WEEKDAYS.map(day => (
              <MenuItem key={day} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 좌석 등급 검색 */}
        <FormControl sx={{minWidth: 120}}>
          <InputLabel>좌석 등급</InputLabel>
          <Select
            label="좌석 등급"
            value={searchSeatClass}
            onChange={e => setSearchSeatClass(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {SEAT_CLASS_OPTIONS.map(seat => (
              <MenuItem key={seat} value={seat}>
                {seat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 항공편 번호 검색 */}
        <TextField
          label="항공편 번호"
          value={searchFlightNumber}
          onChange={e => setSearchFlightNumber(e.target.value)}
          sx={{minWidth: 150}}
        />

        {/* 초기화 버튼: 모든 검색조건 초기화 */}
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            setSearchDeparture('');
            setSearchArrival('');
            setSearchOperatingDay('');
            setSearchSeatClass('');
            setSearchFlightNumber('');
          }}
          sx={{
            height: '56px', // 텍스트필드/셀렉트와 동일 높이
            boxSizing: 'border-box' // 테두리 등 포함
          }}>
          초기화
        </Button>
      </Box>

      {/* "항공편 추가" 버튼 */}
      <Box sx={{mb: 2}}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/flights/create')}>
          항공편 추가
        </Button>
      </Box>

      {/* 검색 결과가 없을 경우 */}
      {filteredFlights.length === 0 ? (
        <Typography variant="body1">검색된 항공편이 없습니다.</Typography>
      ) : (
        <>
          <List
            sx={{
              display: 'grid',
              // 화면 크기에 따라 열 개수를 조정하고 싶다면 반응형 설정
              gridTemplateColumns: {
                xs: '1fr', // 모바일에서는 한 줄
                sm: '1fr 1fr' // sm 이상에서는 두 줄
              },
              gap: 2 // 카드 간격
            }}>
            {currentFlights.map(flight => (
              <ListItem
                key={flight._id}
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  mb: 2,
                  p: 2
                }}>
                <Box sx={{flex: 1, pr: 2}}>
                  <ListItemText
                    primary={
                      <>
                        <Typography variant="h6">
                          {flight.airline} - {flight.flightNumber}
                        </Typography>
                        <Divider sx={{my: 1, borderColor: 'rgba(0,0,0)'}} />
                      </>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{margin: 0, padding: 0}}>
                          출발: {flight.departure.city} (
                          {dayjs(flight.departure.date).format('YYYY-MM-DD')}) - 도착:{' '}
                          {flight.arrival.city} (
                          {dayjs(flight.arrival.date).format('YYYY-MM-DD')})
                        </Typography>
                        <Typography variant="body2" sx={{margin: 0, padding: 0}}>
                          운항 요일: {flight.operatingDays?.join(', ') || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{margin: 0, padding: 0}}>
                          좌석 등급: {flight.seatClass}
                        </Typography>
                        <Typography variant="body2" sx={{margin: 0, padding: 0}}>
                          가격: {Number(flight.price).toLocaleString()}원
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{
                      component: 'div',
                      sx: {margin: 0, padding: 0}
                    }}
                    secondaryTypographyProps={{
                      component: 'div',
                      sx: {margin: 0, padding: 0}
                    }}
                  />
                  <Box sx={{mt: 1}}>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{mr: 1}}
                      onClick={() => navigate(`/flights/edit/${flight._id}`)}>
                      수정
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(flight._id)}>
                      삭제
                    </Button>
                  </Box>
                </Box>
                <Box>
                  {(() => {
                    // 항공사 이름에 맞는 로고 경로 찾기
                    const logoSrc =
                      AIRLINE_LOGOS[flight.airline] || '/images/logos/default.png';
                    return (
                      <Box
                        component="img"
                        src={logoSrc}
                        alt={flight.airline}
                        sx={{width: 80, height: 'auto', objectFit: 'contain'}}
                      />
                    );
                  })()}
                </Box>
              </ListItem>
            ))}
          </List>

          {/* 페이지네이션 */}
          <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default AdminFlightsList;
