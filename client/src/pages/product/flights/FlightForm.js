import React, {useEffect, useState, useCallback} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {createFlight, updateFlight, getFlightById} from '../../../api/flight/flights';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {DatePicker} from '@mui/x-date-pickers';
import dayjs from 'dayjs';

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

const AIRLINES = [
  {code: 'KE', name: '대한항공'},
  {code: 'OZ', name: '아시아나항공'},
  {code: 'LJ', name: '진에어'},
  {code: '7C', name: '제주항공'},
  {code: 'TW', name: '티웨이항공'},
  {code: 'RS', name: '에어서울'},
  {code: 'ZE', name: '이스타항공'},
  {code: 'BX', name: '에어부산'},
  {code: 'MM', name: '피치항공'},
  {code: 'ZG', name: '집에어 도쿄'},
  {code: 'JL', name: '일본항공'},
  {code: 'NQ', name: '에어재팬화물항공'},
  {code: 'NH', name: '전일본공수'},
  {code: 'RF', name: '에어로케이항공'},
  {code: 'AF', name: '프랑스항공'},
  {code: 'CA', name: '중국국제항공'},
  {code: 'CZ', name: '중국남방항공'},
  {code: 'MU', name: '중국동방항공'},
  {code: 'CI', name: '중화항공'},
  {code: 'JQ', name: '젯스타 에어웨이즈'},
  {code: 'QF', name: '호주항공(콴타스항공)'},
  {code: 'YP', name: '에어프레미아'},
  {code: 'TG', name: '타이항공'},
  {code: 'BR', name: '에바항공'},
  {code: 'JY', name: '에바항공(장영항공)'},
  {code: '9C', name: '춘추항공'}
];

const SEAT_CLASS_OPTIONS = ['특가석', '이코노미석', '비즈니스석'];

const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
const getTodayWeekday = () => {
  const dayIndex = (new Date().getDay() + 6) % 7;
  return WEEKDAYS[dayIndex];
};

const FlightForm = () => {
  const [flight, setFlight] = useState({
    airline: '',
    flightNumber: '',
    departure: {
      airport: '',
      city: '',
      date: dayjs(),
      time: '0800'
    },
    arrival: {
      airport: '',
      city: '',
      date: dayjs(),
      time: '0900'
    },
    operatingDays: [],
    price: '',
    seatsAvailable: '',
    seatClass: '이코노미석'
  });

  const navigate = useNavigate();
  const {id} = useParams();

  const fetchFlightData = useCallback(async () => {
    try {
      const existingFlight = await getFlightById(id);
      setFlight({
        ...existingFlight,
        departure: {
          ...existingFlight.departure,
          date: dayjs(existingFlight.departure.date)
        },
        arrival: {
          ...existingFlight.arrival,
          date: dayjs(existingFlight.arrival.date)
        }
      });
    } catch (error) {
      console.error('항공편 데이터를 불러오는 중 오류:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchFlightData();
    } else {
      setFlight(prev => ({
        ...prev,
        operatingDays: [getTodayWeekday()],
        departure: {...prev.departure, time: '0800'},
        arrival: {...prev.arrival, time: '0900'}
      }));
    }
  }, [id, fetchFlightData]);

  const handleChange = e => {
    const {name, value} = e.target;

    if (name === 'airline') {
      const selectedAirline = AIRLINES.find(a => a.name === value);
      if (selectedAirline) {
        // 3~4자리 랜덤 숫자 생성 예시
        const length = Math.random() < 0.5 ? 3 : 4;
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        setFlight(prev => ({
          ...prev,
          airline: value,
          flightNumber: `${selectedAirline.code}${randomNumber}`
        }));
        return;
      }
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFlight(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFlight(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDayToggle = day => {
    setFlight(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
  };

  const handleDepartureDateChange = newValue => {
    setFlight(prev => ({
      ...prev,
      departure: {
        ...prev.departure,
        date: newValue
      }
    }));
  };

  const handleArrivalDateChange = newValue => {
    setFlight(prev => ({
      ...prev,
      arrival: {
        ...prev.arrival,
        date: newValue
      }
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (id) {
        await updateFlight(id, flight);
      } else {
        await createFlight(flight);
      }
      navigate('/flights/list');
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card sx={{maxWidth: 600, margin: '0 auto', mt: 4}}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {id ? '항공편 수정' : '항공편 추가'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{mb: 3}}>
              <Typography variant="subtitle1" sx={{mb: 1}}>
                항공사 선택
              </Typography>
              <FormControl fullWidth>
                <InputLabel>항공사</InputLabel>
                <Select
                  label="항공사"
                  name="airline"
                  value={flight.airline}
                  onChange={handleChange}
                  required>
                  <MenuItem value="">항공사 선택</MenuItem>
                  {AIRLINES.map(airline => (
                    <MenuItem key={airline.code} value={airline.name}>
                      {airline.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{mb: 3}}>
              <Typography variant="subtitle1" sx={{mb: 1}}>
                항공편 번호
              </Typography>
              <TextField
                name="flightNumber"
                value={flight.flightNumber}
                onChange={handleChange}
                required
                fullWidth
              />
            </Box>

            <Box sx={{mb: 3}}>
              <Typography variant="subtitle1" sx={{mb: 1}}>
                출발 정보
              </Typography>

              <FormControl fullWidth sx={{mb: 2}}>
                <InputLabel>출발 공항</InputLabel>
                <Select
                  label="출발 공항"
                  name="departure.airport"
                  value={flight.departure.airport}
                  onChange={handleChange}
                  required>
                  <MenuItem value="">출발 공항 선택</MenuItem>
                  {AIRPORT_OPTIONS.map(airport => (
                    <MenuItem key={airport.code} value={airport.code}>
                      {airport.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{display: 'flex', gap: 2}}>
                <DatePicker
                  label="출발 날짜"
                  value={flight.departure.date}
                  onChange={handleDepartureDateChange}
                  renderInput={params => <TextField {...params} required fullWidth />}
                />
                <TextField
                  label="출발 시간"
                  type="text"
                  name="departure.time"
                  value={flight.departure.time}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Box>
            </Box>

            <Box sx={{mb: 3}}>
              <Typography variant="subtitle1" sx={{mb: 1}}>
                도착 정보
              </Typography>

              <FormControl fullWidth sx={{mb: 2}}>
                <InputLabel>도착 공항</InputLabel>
                <Select
                  label="도착 공항"
                  name="arrival.airport"
                  value={flight.arrival.airport}
                  onChange={handleChange}
                  required>
                  <MenuItem value="">도착 공항 선택</MenuItem>
                  {AIRPORT_OPTIONS.map(airport => (
                    <MenuItem key={airport.code} value={airport.code}>
                      {airport.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{display: 'flex', gap: 2}}>
                <DatePicker
                  label="도착 날짜"
                  value={flight.arrival.date}
                  onChange={handleArrivalDateChange}
                  renderInput={params => <TextField {...params} required fullWidth />}
                />
                <TextField
                  label="도착 시간"
                  type="text"
                  name="arrival.time"
                  value={flight.arrival.time}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Box>
            </Box>

            <Box sx={{mb: 3}}>
              <Typography variant="subtitle1" sx={{mb: 1}}>
                운항 요일
              </Typography>
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2}}>
                {WEEKDAYS.map(day => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={flight.operatingDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                    }
                    label={day}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{mb: 3}}>
              <Typography variant="subtitle1" sx={{mb: 1}}>
                좌석 정보
              </Typography>

              <FormControl fullWidth sx={{mb: 2}}>
                <InputLabel>좌석 등급</InputLabel>
                <Select
                  label="좌석 등급"
                  name="seatClass"
                  value={flight.seatClass}
                  onChange={handleChange}
                  required>
                  {SEAT_CLASS_OPTIONS.map(seat => (
                    <MenuItem key={seat} value={seat}>
                      {seat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="number"
                label="가격"
                name="price"
                value={flight.price}
                onChange={handleChange}
                fullWidth
                required
                sx={{mb: 2}}
              />

              <TextField
                type="number"
                label="좌석 수"
                name="seatsAvailable"
                value={flight.seatsAvailable}
                onChange={handleChange}
                fullWidth
                required
              />
            </Box>

            <CardActions sx={{px: 0}}>
              <Button variant="contained" color="primary" type="submit">
                {id ? '수정' : '추가'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/flights/list')}>
                취소
              </Button>
            </CardActions>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default FlightForm;
