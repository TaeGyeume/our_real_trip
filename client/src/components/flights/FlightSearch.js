import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import moment from 'moment-timezone';
import './styles/FlightSearch.css';
import {searchFlights} from '../../api/flight/flights';
import LoadingScreen from './LoadingScreen';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Paper,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Box,
  OutlinedInput,
  IconButton
} from '@mui/material';
import {Add, Remove} from '@mui/icons-material';
import {LocalizationProvider, DatePicker} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {ko} from 'date-fns/locale';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// 공항 한글 → 코드 변환
const AIRPORT_CODES = {
  서울: 'GMP',
  인천: 'ICN',
  부산: 'PUS',
  제주: 'CJU',
  대구: 'TAE',
  광주: 'KWJ',
  청주: 'CJJ',
  여수: 'RSU',
  무안: 'MWX',
  도쿄: 'HND',
  도쿄: 'NRT',
  뉴욕: 'JFK',
  뉴욕: 'EWR',
  뉴욕: 'LGA',
  파리: 'CDG',
  베이징: 'PEK',
  베이징: 'PKX',
  타이베이: 'TSA',
  런던: 'LGW',
  런던: 'LHR',
  런던: 'LCY',
  시드니: 'SYD',
  방콕: 'BKK'
};

const AIRPORT_LIST = Object.keys(AIRPORT_CODES);

const FlightSearch = () => {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [date, setDate] = useState(new Date());
  const [passengers, setPassengers] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    console.log('검색 요청:', {departure, arrival, date, passengers});

    // 필수 입력값 검증
    if (!departure || !arrival || !date || passengers < 1) {
      setErrorMessage('출발지, 도착지, 날짜, 인원수를 입력해주세요.');
      return;
    }

    // 출발지와 도착지가 같은 경우 예외 처리
    if (departure === arrival) {
      setErrorMessage('출발지와 도착지는 같을 수 없습니다.');
      return;
    }

    const deptCode = AIRPORT_CODES[departure] || departure;
    const arrCode = AIRPORT_CODES[arrival] || arrival;
    const formattedDate = moment(date).format('YYYY-MM-DD');

    // 날짜 형식 검증
    if (!moment(formattedDate, 'YYYY-MM-DD', true).isValid()) {
      setErrorMessage('잘못된 날짜 형식입니다. YYYY-MM-DD 형식이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      console.log(`변환된 검색 날짜: ${formattedDate}`);

      // API 요청에 passengers 값 추가
      const searchData = await searchFlights(
        deptCode,
        arrCode,
        formattedDate,
        passengers
      );

      if (!searchData || searchData.length === 0) {
        setErrorMessage(`선택한 날짜 (${formattedDate})에 운항하는 항공편이 없습니다.`);
        setLoading(false);
      } else {
        setErrorMessage('');
        console.log('검색된 데이터:', searchData);
        setTimeout(() => {
          navigate('/flights/results', {state: {flights: searchData, passengers}});
        }, 500);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setErrorMessage('검색 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      {/* <Container maxWidth="md"> */}
      <Paper elevation={3} sx={{p: 3, mt: 4}}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          ✈️ 항공편 검색
        </Typography>

        {/* 수평 정렬 적용 */}
        <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
          {/* 출발 공항 */}
          <FormControl sx={{flex: 1, minWidth: '150px'}} variant="outlined">
            <InputLabel>출발지가 어디인가요?</InputLabel>
            <Select
              value={departure}
              onChange={e => setDeparture(e.target.value)}
              label="출발지가 어디인가요?">
              {AIRPORT_LIST.map(airport => (
                <MenuItem key={airport} value={airport}>
                  {airport}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 공항 변경 버튼 */}
          <IconButton
            onClick={() => {
              const temp = departure;
              setDeparture(arrival);
              setArrival(temp);
            }}>
            <SwapHorizIcon />
          </IconButton>

          {/* 도착 공항 */}
          <FormControl sx={{flex: 1, minWidth: '150px'}} variant="outlined">
            <InputLabel>도착지가 어디인가요?</InputLabel>
            <Select
              value={arrival}
              onChange={e => setArrival(e.target.value)}
              label="도착지가 어디인가요?">
              {AIRPORT_LIST.map(airport => (
                <MenuItem key={airport} value={airport}>
                  {airport}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 날짜 선택 */}
          <DatePicker
            label="가는 날"
            value={date}
            onChange={newValue => setDate(newValue)}
            renderInput={params => <TextField {...params} fullWidth />}
          />

          {/* 인원 선택 */}
          <FormControl sx={{flex: 1, minWidth: '160px'}}>
            <InputLabel shrink htmlFor="passengers">
              인원수
            </InputLabel>
            <OutlinedInput
              id="passengers"
              notched
              label="인원수"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '56px',
                padding: '0 8px', // 내부 패딩 조정
                borderRadius: '5px'
              }}
              startAdornment={
                <IconButton
                  onClick={() => setPassengers(prev => Math.max(1, prev - 1))}
                  size="small"
                  sx={{padding: '4px'}} // 버튼 크기 줄임
                >
                  <Remove fontSize="small" />
                </IconButton>
              }
              endAdornment={
                <IconButton
                  onClick={() => setPassengers(prev => prev + 1)}
                  size="small"
                  sx={{padding: '4px'}} // 버튼 크기 줄임
                >
                  <Add fontSize="small" />
                </IconButton>
              }
              inputProps={{
                style: {
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '24px' // 숫자가 중앙 정렬되도록 조정
                }
              }}
              value={passengers}
              readOnly
            />
          </FormControl>

          {/* 검색 버튼 */}
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              minWidth: '100px',
              height: '56px',
              backgroundColor: '#303f9f',
              color: 'primary.contrastText'
            }} // 버튼 크기 맞춤
          >
            검색
          </Button>
        </Box>

        {/* 에러 메시지 */}
        {errorMessage && (
          <Alert severity="error" sx={{mt: 2}}>
            {errorMessage}
          </Alert>
        )}

        {/* 로딩 화면 */}
        {loading && <LoadingScreen />}
      </Paper>
      {/* </Container> */}
    </LocalizationProvider>
  );
};

export default FlightSearch;
