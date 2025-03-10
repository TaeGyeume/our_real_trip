import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import moment from 'moment-timezone';
import './styles/FlightSearch.css';
import {searchFlights} from '../../api/flight/flights';
import LoadingScreen from './LoadingScreen';
import {
  TextField,
  Button,
  Paper,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Box,
  OutlinedInput,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack
} from '@mui/material';
import {Add, Remove} from '@mui/icons-material';
import {LocalizationProvider, DatePicker} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {ko} from 'date-fns/locale';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const DOMESTIC_AIRPORTS = {
  서울: ['GMP', 'ICN'],
  부산: ['PUS'],
  // 제주: ['CJU'],
  제주도: ['CJU'],
  대구: ['TAE'],
  광주: ['KWJ'],
  청주: ['CJJ'],
  여수: ['RSU'],
  무안: ['MWX']
};

const INTERNATIONAL_AIRPORTS = {
  도쿄: ['HND', 'NRT'],
  뉴욕: ['JFK', 'EWR', 'LGA'],
  파리: ['CDG'],
  베이징: ['PEK', 'PKX'],
  타이베이: ['TSA'],
  런던: ['LGW', 'LHR', 'LCY'],
  시드니: ['SYD'],
  방콕: ['BKK']
};

const FlightSearch = () => {
  const locationState = useLocation().state || {};
  // 만약 departure 값이 존재하면 그대로 사용, 없으면 useSeoul 플래그에 따라 '서울'로 설정
  const defaultDeparture =
    locationState.departure || (locationState.useSeoul ? '서울' : '');
  const defaultArrival = locationState.arrival || '';
  const defaultDate = locationState.date ? new Date(locationState.date) : new Date();
  const defaultPassengers = locationState.passengers || 1;

  const [departure, setDeparture] = useState(defaultDeparture);
  const [arrival, setArrival] = useState(defaultArrival);
  const [date, setDate] = useState(defaultDate);
  const [passengers, setPassengers] = useState(defaultPassengers);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedField, setSelectedField] = useState(''); // "departure" 또는 "arrival"

  const handlePopoverOpen = (event, field) => {
    if (anchorEl !== event.currentTarget) {
      setAnchorEl(event.currentTarget);
      setSelectedField(field);
    }
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedField('');
  };

  const handleAirportSelect = airport => {
    if (selectedField === 'departure') {
      setDeparture(airport);
    } else if (selectedField === 'arrival') {
      setArrival(airport);
    }
    handlePopoverClose();
  };

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

    const deptCodes = DOMESTIC_AIRPORTS[departure] ||
      INTERNATIONAL_AIRPORTS[departure] || [departure];
    const arrCodes = DOMESTIC_AIRPORTS[arrival] ||
      INTERNATIONAL_AIRPORTS[arrival] || [arrival];
    const formattedDate = moment(date).format('YYYY-MM-DD');

    // 날짜 형식 검증
    if (!moment(formattedDate, 'YYYY-MM-DD', true).isValid()) {
      setErrorMessage('잘못된 날짜 형식입니다. YYYY-MM-DD 형식이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      console.log(`변환된 검색 날짜: ${formattedDate}`);

      let searchResults = [];
      for (const deptCode of deptCodes) {
        for (const arrCode of arrCodes) {
          const searchData = await searchFlights(
            deptCode,
            arrCode,
            formattedDate,
            passengers
          );
          searchResults = [...searchResults, ...searchData];
        }
      }

      if (!searchResults.length) {
        setErrorMessage(`선택한 날짜 (${formattedDate})에 운항하는 항공편이 없습니다.`);
        setLoading(false);
      } else {
        setErrorMessage('');
        console.log('검색된 데이터:', searchResults);
        setTimeout(() => {
          setLoading(false);
          navigate('/flights/results', {
            state: {flights: searchResults, passengers, departure, arrival, date}
          });
        }, 1000);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setErrorMessage('검색 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Paper elevation={0} sx={{p: 1, mt: 1}}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* 출발 공항 */}
          <FormControl sx={{flex: 1, minWidth: '150px'}} variant="outlined">
            <InputLabel shrink={Boolean(departure)}>출발지가 어디인가요?</InputLabel>
            <OutlinedInput
              value={departure}
              onChange={e => setDeparture(e.target.value)}
              onClick={e => handlePopoverOpen(e, 'departure')}
              readOnly
              label="출발지가 어디인가요?"
              notched={Boolean(departure)}
              sx={{backgroundColor: 'white'}}
            />
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
            <InputLabel shrink={Boolean(arrival)}>도착지가 어디인가요?</InputLabel>
            <OutlinedInput
              value={arrival}
              onChange={e => setArrival(e.target.value)}
              onClick={e => handlePopoverOpen(e, 'arrival')}
              readOnly
              label="도착지가 어디인가요?"
              notched={Boolean(arrival)}
              sx={{backgroundColor: 'white'}}
            />
          </FormControl>

          {/* 날짜 선택 */}
          <DatePicker
            label="가는 날"
            value={date}
            onChange={newValue => setDate(newValue)}
            renderInput={params => <TextField {...params} fullWidth />}
            sx={{flex: 1.705, minWidth: '150px'}}
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
                padding: '0 8px',
                borderRadius: '5px'
              }}
              startAdornment={
                <IconButton
                  onClick={() => setPassengers(prev => Math.max(1, prev - 1))}
                  size="small"
                  sx={{padding: '4px'}}>
                  <Remove fontSize="small" />
                </IconButton>
              }
              endAdornment={
                <IconButton
                  onClick={() => setPassengers(prev => prev + 1)}
                  size="small"
                  sx={{padding: '4px'}}>
                  <Add fontSize="small" />
                </IconButton>
              }
              inputProps={{
                style: {
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '24px'
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
              backgroundColor: '#004d7a',
              color: 'primary.contrastText'
            }}>
            검색
          </Button>
        </Stack>

        {/* 공항 선택 Popover */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
          transformOrigin={{vertical: 'top', horizontal: 'center'}}
          sx={{
            '& .MuiPaper-root': {
              width: 400,
              display: 'flex',
              flexDirection: 'row',
              padding: 1
            }
          }}>
          <Box sx={{flex: 1, borderRight: '1px solid #ddd', p: 1}}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{mb: 1}}>
              국내
            </Typography>
            <List dense>
              {Object.keys(DOMESTIC_AIRPORTS).map(city => (
                <ListItemButton key={city} onClick={() => handleAirportSelect(city)}>
                  <ListItemText primary={city} />
                </ListItemButton>
              ))}
            </List>
          </Box>

          <Box sx={{flex: 1, p: 1}}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{mb: 1}}>
              해외
            </Typography>
            <List dense>
              {Object.keys(INTERNATIONAL_AIRPORTS).map(city => (
                <ListItemButton key={city} onClick={() => handleAirportSelect(city)}>
                  <ListItemText primary={city} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Popover>

        {/* 에러 메시지 */}
        {errorMessage && (
          <Alert severity="error" sx={{mt: 2}}>
            {errorMessage}
          </Alert>
        )}

        {/* 로딩 화면 */}
        {loading && <LoadingScreen />}
      </Paper>
    </LocalizationProvider>
  );
};

export default FlightSearch;
