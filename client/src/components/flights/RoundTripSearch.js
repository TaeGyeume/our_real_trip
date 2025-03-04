import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import moment from 'moment-timezone';
import './styles/FlightSearch.css';
import {searchFlights} from '../../api/flight/flights';
import LoadingScreen from './LoadingScreen';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Button,
  OutlinedInput,
  TextField,
  IconButton,
  Alert,
  Stack,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  Box
} from '@mui/material';
import {LocalizationProvider, DatePicker} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {ko} from 'date-fns/locale';
import {Add, Remove} from '@mui/icons-material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const DOMESTIC_AIRPORTS = {
  서울: ['GMP', 'ICN'],
  // 인천: ['ICN'],
  부산: ['PUS'],
  제주: ['CJU'],
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

// const AIRPORT_LIST = Object.keys(AIRPORT_GROUPS);

const RoundTripSearch = () => {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date());
  const [passengers, setPassengers] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedField, setSelectedField] = useState('');

  const handlePopoverOpen = (event, field) => {
    setAnchorEl(event.currentTarget);
    setSelectedField(field);
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
    console.log('왕복 검색 요청:', {
      departure,
      arrival,
      departureDate,
      returnDate,
      passengers
    });

    if (!departure || !arrival || !departureDate || !returnDate || passengers < 1) {
      setErrorMessage('출발지, 도착지, 출발 날짜, 오는 날짜, 인원수를 입력해주세요.');
      return;
    }

    // 출발 & 도착지를 여러 개의 공항 코드 배열로 변환
    const deptCodes = DOMESTIC_AIRPORTS[departure] ||
      INTERNATIONAL_AIRPORTS[departure] || [departure];
    const arrCodes = DOMESTIC_AIRPORTS[arrival] ||
      INTERNATIONAL_AIRPORTS[arrival] || [arrival];
    const formattedDepartureDate = moment(departureDate).format('YYYY-MM-DD');
    const formattedReturnDate = moment(returnDate).format('YYYY-MM-DD');

    if (
      !moment(formattedDepartureDate, 'YYYY-MM-DD', true).isValid() ||
      !moment(formattedReturnDate, 'YYYY-MM-DD', true).isValid()
    ) {
      setErrorMessage('잘못된 날짜 형식입니다. YYYY-MM-DD 형식이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      console.log(`출발편 검색 날짜: ${formattedDepartureDate}`);
      let departureFlights = [];

      // 출발편 검색 (모든 공항 조합)
      for (const deptCode of deptCodes) {
        for (const arrCode of arrCodes) {
          const searchData = await searchFlights(
            deptCode,
            arrCode,
            formattedDepartureDate,
            passengers
          );
          departureFlights = [...departureFlights, ...searchData];
        }
      }

      if (!departureFlights.length) {
        setErrorMessage(
          `출발편 (${formattedDepartureDate})에 운항하는 항공편이 없습니다.`
        );
        setLoading(false);
        return;
      }

      console.log('출발편 검색 완료:', departureFlights);
      setErrorMessage('');

      // 복귀편 검색 (출발/도착 공항 반대로)
      let returnFlights = [];
      for (const arrCode of arrCodes) {
        for (const deptCode of deptCodes) {
          const searchData = await searchFlights(
            arrCode,
            deptCode,
            formattedReturnDate,
            passengers
          );
          returnFlights = [...returnFlights, ...searchData];
        }
      }

      if (!returnFlights.length) {
        setErrorMessage(`복귀편 (${formattedReturnDate})에 운항하는 항공편이 없습니다.`);
        setLoading(false);
        return;
      }

      console.log('복귀편 검색 완료:', returnFlights);

      // 검색 완료 후 페이지 이동
      setTimeout(() => {
        setLoading(false);
        navigate('/flights/roundtrip-departure', {
          state: {
            departureFlights,
            returnFlights,
            returnDate: formattedReturnDate,
            passengers
          }
        });
      }, 500);
    } catch (error) {
      console.error('검색 실패:', error);
      setErrorMessage('검색 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Paper elevation={0} sx={{p: 1, mt: 1}}>
        {/* 입력 필드 배치 (수평 정렬) */}
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
              label="도착지가 어디인가요?"
              readOnly
              notched={Boolean(arrival)}
              sx={{backgroundColor: 'white'}}
            />
          </FormControl>

          {/* 출발 날짜 */}
          <DatePicker
            label="가는 날"
            value={departureDate}
            onChange={newValue => setDepartureDate(newValue)}
            sx={{width: '180px'}}
            renderInput={params => <TextField {...params} fullWidth />}
          />

          {/* 도착 날짜 */}
          <DatePicker
            label="오는 날"
            value={returnDate}
            onChange={newValue => setReturnDate(newValue)}
            sx={{width: '179px'}}
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
            color="primary"
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

export default RoundTripSearch;
