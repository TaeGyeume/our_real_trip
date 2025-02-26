import React, {useEffect, useState} from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Container,
  Grid,
  TextField
} from '@mui/material';
import {useNavigate} from 'react-router-dom';

// 서비스 파일 임포트 (API 호출)
import {createPackage, getCreatePackageData} from '../../../api/package/packageService'; // 패키지 생성 API 호출

const PackageCreate = () => {
  const navigate = useNavigate();

  // 상태 정의
  const [accommodations, setAccommodations] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  const [flights, setFlights] = useState([]);
  const [selectedAccommodations, setSelectedAccommodations] = useState([]);
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]);
  const [seatCounts, setSeatCounts] = useState({}); // 각 항공에 대한 좌석 수 저장
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [loading, setLoading] = useState(false);

  // API 호출해서 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCreatePackageData(); // 패키지 생성에 필요한 데이터 가져오기
        setAccommodations(data.accommodations);
        setTourTickets(data.tourTickets);
        setFlights(data.flights);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };

    fetchData();
  }, []);

  // 선택된 항목들 처리
  const handleSelectAccommodation = id => {
    setSelectedAccommodations(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectTourTicket = id => {
    setSelectedTourTickets(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectFlight = id => {
    setSelectedFlights(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSeatCountChange = (flightId, count) => {
    setSeatCounts(prev => ({
      ...prev,
      [flightId]: count
    }));
  };

  // 패키지 생성 폼 제출
  const handleSubmit = async () => {
    setLoading(true);

    const newPackage = {
      name: packageName,
      description: packageDescription,
      accommodations: selectedAccommodations,
      tours: selectedTourTickets,
      flights: selectedFlights.map(flightId => ({
        flightId,
        seatsToUse: seatCounts[flightId] || 0 // 좌석 수를 지정
      })),
      discountRate: discountRate,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      category: 'Tour Package',
      createdBy: '67a55e912cee4aadf2463b9c' // 예시, 실제로는 로그인된 사용자 ID
    };

    try {
      await createPackage(newPackage); // 패키지 생성 API 호출
      navigate('/packages'); // 패키지 목록 페이지로 리디렉션
    } catch (error) {
      console.error('패키지 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{mt: 3}}>
        패키지 생성
      </Typography>

      <Typography variant="h6" sx={{mt: 2}}>
        패키지명
      </Typography>
      <TextField
        label="패키지명"
        fullWidth
        value={packageName}
        onChange={e => setPackageName(e.target.value)}
        sx={{mt: 1}}
      />

      <Typography variant="h6" sx={{mt: 2}}>
        설명
      </Typography>
      <TextField
        label="설명"
        fullWidth
        multiline
        rows={4}
        value={packageDescription}
        onChange={e => setPackageDescription(e.target.value)}
        sx={{mt: 1}}
      />

      <Typography variant="h6" sx={{mt: 3}}>
        할인율
      </Typography>
      <TextField
        label="할인율 (%)"
        fullWidth
        type="number"
        value={discountRate}
        onChange={e => setDiscountRate(Number(e.target.value))}
        sx={{mt: 1}}
      />

      {/* 숙소 선택 */}
      <Typography variant="h6" sx={{mt: 3}}>
        숙소 선택
      </Typography>
      <Grid container spacing={2}>
        {accommodations.length > 0 ? (
          accommodations.map(acc => (
            <Grid item xs={12} sm={6} key={acc._id}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedAccommodations.includes(acc._id)}
                    onChange={() => handleSelectAccommodation(acc._id)}
                  />
                }
                label={acc.name}
              />
            </Grid>
          ))
        ) : (
          <Typography>숙소 데이터가 없습니다.</Typography>
        )}
      </Grid>

      {/* 투어/티켓 선택 */}
      <Typography variant="h6" sx={{mt: 3}}>
        투어/티켓 선택
      </Typography>
      <Grid container spacing={2}>
        {tourTickets.length > 0 ? (
          tourTickets.map(ticket => (
            <Grid item xs={12} sm={6} key={ticket._id}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedTourTickets.includes(ticket._id)}
                    onChange={() => handleSelectTourTicket(ticket._id)}
                  />
                }
                label={ticket.title}
              />
            </Grid>
          ))
        ) : (
          <Typography>투어 티켓 데이터가 없습니다.</Typography>
        )}
      </Grid>

      {/* 항공 선택 */}
      <Typography variant="h6" sx={{mt: 3}}>
        항공 선택
      </Typography>
      <Grid container spacing={2}>
        {flights.length > 0 ? (
          flights.map(flight => (
            <Grid item xs={12} sm={6} key={flight._id}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFlights.includes(flight._id)}
                    onChange={() => handleSelectFlight(flight._id)}
                  />
                }
                label={`${flight.flightNumber} - ${flight.airline}`}
              />
              {selectedFlights.includes(flight._id) && (
                <TextField
                  label="좌석 수"
                  type="number"
                  value={seatCounts[flight._id] || ''}
                  onChange={e => handleSeatCountChange(flight._id, e.target.value)}
                  sx={{mt: 1}}
                  fullWidth
                />
              )}
            </Grid>
          ))
        ) : (
          <Typography>항공 데이터가 없습니다.</Typography>
        )}
      </Grid>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{mt: 3}}
        disabled={loading}>
        {loading ? '패키지 생성 중...' : '패키지 생성'}
      </Button>
    </Container>
  );
};

export default PackageCreate;
