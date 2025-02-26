import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  getPackageById,
  updatePackage,
  getCreatePackageData
} from '../../../api/package/packageService';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Container,
  Grid,
  TextField
} from '@mui/material';

const PackageEdit = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  // 기존 패키지 데이터 상태
  const [packageData, setPackageData] = useState({
    name: '',
    description: '',
    accommodations: [],
    tours: [],
    flights: [],
    discountRate: 0
  });

  // 선택된 데이터
  const [selectedAccommodations, setSelectedAccommodations] = useState([]);
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]);
  const [seatCounts, setSeatCounts] = useState({});

  useEffect(() => {
    fetchPackage();
    fetchAvailableData();
  }, []);

  // 기존 패키지 데이터 가져오기
  const fetchPackage = async () => {
    try {
      const data = await getPackageById(id);
      setPackageData(data);
      setSelectedAccommodations(data.accommodations.map(acc => acc._id));
      setSelectedTourTickets(data.tours.map(tour => tour._id));
      setSelectedFlights(data.flights.map(flight => flight.flightId));
      setSeatCounts(
        data.flights.reduce((acc, flight) => {
          acc[flight.flightId] = flight.seatsToUse || 0;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('패키지 조회 실패:', error);
    }
  };

  // 선택 가능한 숙소, 투어/티켓, 항공 데이터 가져오기
  const [accommodations, setAccommodations] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  const [flights, setFlights] = useState([]);

  const fetchAvailableData = async () => {
    try {
      const data = await getCreatePackageData();
      setAccommodations(data.accommodations);
      setTourTickets(data.tourTickets);
      setFlights(data.flights);
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
    }
  };

  // 선택 항목 처리 함수
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

  // 패키지 수정 처리
  const handleUpdate = async () => {
    const updatedPackage = {
      name: packageData.name,
      description: packageData.description,
      accommodations: selectedAccommodations,
      tours: selectedTourTickets,
      flights: selectedFlights.map(flightId => ({
        flightId,
        seatsToUse: seatCounts[flightId] || 0
      })),
      discountRate: packageData.discountRate
    };

    try {
      await updatePackage(id, updatedPackage);
      navigate('/packages'); // 수정 후 패키지 목록으로 이동
    } catch (error) {
      console.error('패키지 수정 실패:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{mt: 3}}>
        패키지 수정
      </Typography>

      <TextField
        label="패키지명"
        fullWidth
        value={packageData.name}
        onChange={e => setPackageData({...packageData, name: e.target.value})}
        sx={{mt: 2}}
      />

      <TextField
        label="설명"
        fullWidth
        multiline
        rows={4}
        value={packageData.description}
        onChange={e => setPackageData({...packageData, description: e.target.value})}
        sx={{mt: 2}}
      />

      <Typography variant="h6" sx={{mt: 3}}>
        할인율
      </Typography>
      <TextField
        label="할인율 (%)"
        fullWidth
        type="number"
        value={packageData.discountRate}
        onChange={e =>
          setPackageData({...packageData, discountRate: Number(e.target.value)})
        }
        sx={{mt: 2}}
      />

      {/* 숙소 선택 */}
      <Typography variant="h6" sx={{mt: 3}}>
        숙소 선택
      </Typography>
      <Grid container spacing={2}>
        {accommodations.map(acc => (
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
        ))}
      </Grid>

      {/* 투어/티켓 선택 */}
      <Typography variant="h6" sx={{mt: 3}}>
        투어/티켓 선택
      </Typography>
      <Grid container spacing={2}>
        {tourTickets.map(ticket => (
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
        ))}
      </Grid>

      {/* 항공 선택 */}
      <Typography variant="h6" sx={{mt: 3}}>
        항공 선택
      </Typography>
      <Grid container spacing={2}>
        {flights.map(flight => (
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
        ))}
      </Grid>

      <Button variant="contained" color="primary" onClick={handleUpdate} sx={{mt: 3}}>
        수정 완료
      </Button>
    </Container>
  );
};

export default PackageEdit;
