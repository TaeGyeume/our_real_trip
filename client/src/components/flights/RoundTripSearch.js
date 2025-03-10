import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import moment from 'moment-timezone';
import {
  Paper,
  FormControl,
  InputLabel,
  OutlinedInput,
  TextField,
  IconButton,
  Button,
  Stack,
  Popover,
  Box,
  Alert,
  Typography,
  List,
  ListItemButton,
  ListItemText
} from '@mui/material';
import {LocalizationProvider, DatePicker} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {ko} from 'date-fns/locale';
import {Add, Remove} from '@mui/icons-material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {searchFlights} from '../../api/flight/flights';
import LoadingScreen from './LoadingScreen';

const DOMESTIC_AIRPORTS = {
  서울: ['GMP', 'ICN'],
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

const RoundTripSearch = ({initialData}) => {
  const navigate = useNavigate();
  const [departure, setDeparture] = useState(initialData?.departure || '');
  const [arrival, setArrival] = useState(initialData?.arrival || '');
  const [departureDate, setDepartureDate] = useState(
    initialData?.departureDate ? new Date(initialData.departureDate) : new Date()
  );
  const [returnDate, setReturnDate] = useState(
    initialData?.returnDate ? new Date(initialData.returnDate) : new Date()
  );
  const [passengers, setPassengers] = useState(initialData?.passengers || 1);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (!departure || !arrival || !departureDate || !returnDate || passengers < 1) {
      setErrorMessage('출발지, 도착지, 출발 날짜, 오는 날짜, 인원수를 입력해주세요.');
      return;
    }
    if (departure === arrival) {
      setErrorMessage('출발지와 도착지는 같을 수 없습니다.');
      return;
    }

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
      let departureFlights = [];
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
      setErrorMessage('');
      setTimeout(() => {
        setLoading(false);
        navigate('/flights/roundtrip-departure', {
          state: {
            departureFlights,
            returnFlights,
            departure,
            arrival,
            departureDate: formattedDepartureDate,
            returnDate: formattedReturnDate,
            passengers
          }
        });
      }, 1000);
    } catch (error) {
      setErrorMessage('검색 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Paper elevation={0} sx={{p: 1, mt: 1}}>
        <Stack direction="row" spacing={2} alignItems="center">
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
          <IconButton
            onClick={() => {
              const temp = departure;
              setDeparture(arrival);
              setArrival(temp);
            }}>
            <SwapHorizIcon />
          </IconButton>
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
          <DatePicker
            label="가는 날"
            value={departureDate}
            onChange={newValue => setDepartureDate(newValue)}
            sx={{width: '180px'}}
            renderInput={params => <TextField {...params} fullWidth />}
          />
          <DatePicker
            label="오는 날"
            value={returnDate}
            onChange={newValue => setReturnDate(newValue)}
            sx={{width: '179px'}}
            renderInput={params => <TextField {...params} fullWidth />}
          />
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
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => {
            setAnchorEl(null);
            setSelectedField('');
          }}
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
        {errorMessage && (
          <Alert severity="error" sx={{mt: 2}}>
            {errorMessage}
          </Alert>
        )}
        {loading && <LoadingScreen />}
      </Paper>
    </LocalizationProvider>
  );
};

export default RoundTripSearch;
