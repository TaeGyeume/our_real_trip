import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {createFlight, updateFlight, getFlightById} from '../../api/flight/flights';

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

const SEAT_CLASS_OPTIONS = ['이코노미석', '프리미엄 이코노미석', '비즈니스석'];

const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

const FlightForm = () => {
  const [flight, setFlight] = useState({
    airline: '',
    flightNumber: '',
    departure: {airport: '', city: '', date: '', time: ''},
    arrival: {airport: '', city: '', date: '', time: ''},
    operatingDays: [],
    price: '',
    seatsAvailable: '',
    seatClass: '이코노미석'
  });

  const navigate = useNavigate();
  const {id} = useParams(); // URL에서 ID 가져오기

  // 수정 모드: 기존 데이터 불러오기
  useEffect(() => {
    if (id) {
      fetchFlightData();
    }
  }, [id]);

  const fetchFlightData = async () => {
    try {
      const existingFlight = await getFlightById(id);
      setFlight(existingFlight);
    } catch (error) {
      console.error('항공편 데이터를 불러오는 중 오류 발생:', error);
    }
  };

  // 입력값 변경 핸들러 (중첩된 객체도 처리 가능하도록 개선)
  const handleChange = e => {
    const {name, value} = e.target;

    // 중첩된 객체 키 확인 (departure, arrival 등)
    if (name === 'airline') {
      const selectedAirline = AIRLINES.find(airline => airline.name === value);
      if (selectedAirline) {
        setFlight(prevState => ({
          ...prevState,
          airline: value,
          flightNumber: `${selectedAirline.code}${prevState.flightNumber.replace(/^[A-Z0-9]{2}/, '')}`
        }));
      }
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFlight(prevState => ({
        ...prevState,
        [parent]: {
          ...prevState[parent],
          [child]: value
        }
      }));
    } else {
      setFlight(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  // 요일 체크박스 핸들러
  const handleDayToggle = day => {
    setFlight(prevState => ({
      ...prevState,
      operatingDays: prevState.operatingDays.includes(day)
        ? prevState.operatingDays.filter(d => d !== day)
        : [...prevState.operatingDays, day]
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (id) {
        await updateFlight(id, flight); // 수정 (PUT)
      } else {
        await createFlight(flight); // 추가 (POST)
      }
      navigate('/flights/list'); // 목록 페이지로 이동
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
    }
  };

  return (
    <div>
      <h2>{id ? '항공편 수정' : '항공편 추가'}</h2>
      <form onSubmit={handleSubmit}>
        <h4>항공사 선택</h4>
        <select name="airline" value={flight.airline} onChange={handleChange} required>
          <option value="">항공사 선택</option>
          {AIRLINES.map(airline => (
            <option key={airline.code} value={airline.name}>
              {airline.name}
            </option>
          ))}
        </select>

        <h4>항공편 번호</h4>
        <input
          type="text"
          name="flightNumber"
          value={flight.flightNumber}
          onChange={handleChange}
          required
        />

        <h4>출발 정보</h4>
        <select
          name="departure.airport"
          value={flight.departure.airport}
          onChange={handleChange}
          required>
          <option value="">출발 공항 선택</option>
          {AIRPORT_OPTIONS.map(airport => (
            <option key={airport.code} value={airport.code}>
              {airport.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="departure.date"
          value={flight.departure.date}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="departure.time"
          value={flight.departure.time}
          onChange={handleChange}
          placeholder="출발 시간 (HHmm)"
          required
        />

        <h4>도착 정보</h4>
        <select
          name="arrival.airport"
          value={flight.arrival.airport}
          onChange={handleChange}
          required>
          <option value="">도착 공항 선택</option>
          {AIRPORT_OPTIONS.map(airport => (
            <option key={airport.code} value={airport.code}>
              {airport.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="arrival.date"
          value={flight.arrival.date}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="arrival.time"
          value={flight.arrival.time}
          onChange={handleChange}
          placeholder="도착 시간 (HHmm)"
          required
        />

        <h4>운항 요일</h4>
        {WEEKDAYS.map(day => (
          <label key={day} style={{marginRight: '10px'}}>
            <input
              type="checkbox"
              checked={flight.operatingDays.includes(day)}
              onChange={() => handleDayToggle(day)}
            />
            {day}
          </label>
        ))}

        <h4>좌석 등급</h4>
        <select
          name="seatClass"
          value={flight.seatClass}
          onChange={handleChange}
          required>
          {SEAT_CLASS_OPTIONS.map((seat, index) => (
            <option key={index} value={seat}>
              {seat}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="price"
          value={flight.price}
          onChange={handleChange}
          placeholder="가격"
          required
        />
        <input
          type="number"
          name="seatsAvailable"
          value={flight.seatsAvailable}
          onChange={handleChange}
          placeholder="좌석 수"
          required
        />

        <button type="submit">{id ? '수정' : '추가'}</button>
      </form>
    </div>
  );
};

export default FlightForm;
