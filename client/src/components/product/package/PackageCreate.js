import React, {useEffect, useState} from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Container,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {useNavigate} from 'react-router-dom';

// 서비스 파일 임포트 (API 호출)
import {createPackage, getCreatePackageData} from '../../../api/package/packageService';

const PackageCreate = () => {
  const navigate = useNavigate();

  // 데이터 상태
  const [accommodations, setAccommodations] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  const [flights, setFlights] = useState([]);

  // 선택 상태
  const [selectedAccommodations, setSelectedAccommodations] = useState([]); // 숙소 ID 배열
  const [selectedRooms, setSelectedRooms] = useState({}); // { [accommodationId]: roomId }
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]); // 배열: { flightId, seatsToUse }

  // 패키지 기본 정보 상태
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [loading, setLoading] = useState(false);

  // 모달 열림 상태
  const [openAccommodationModal, setOpenAccommodationModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  const [openFlightModal, setOpenFlightModal] = useState(false);

  // 현재 숙소 선택 (방 선택 모달용)
  const [currentAccommodation, setCurrentAccommodation] = useState(null);

  // 항공 검색 및 페이징 상태
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightsPerPage = 5;

  // API 호출해서 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCreatePackageData(); // 패키지 생성에 필요한 데이터 가져오기
        // 숙소 데이터에는 rooms 배열이 포함되어 있다고 가정합니다.
        setAccommodations(data.accommodations);
        setTourTickets(data.tourTickets);
        setFlights(data.flights);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };

    fetchData();
  }, []);

  // 모달 열기/닫기 함수
  const handleOpenAccommodationModal = () => setOpenAccommodationModal(true);
  const handleCloseAccommodationModal = () => setOpenAccommodationModal(false);

  const handleOpenTourModal = () => setOpenTourModal(true);
  const handleCloseTourModal = () => setOpenTourModal(false);

  const handleOpenFlightModal = () => setOpenFlightModal(true);
  const handleCloseFlightModal = () => setOpenFlightModal(false);

  const handleOpenRoomModal = accommodation => {
    setCurrentAccommodation(accommodation);
    setOpenRoomModal(true);
  };
  const handleCloseRoomModal = () => setOpenRoomModal(false);

  // 선택 처리
  const toggleAccommodationSelection = id => {
    setSelectedAccommodations(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleTourTicketSelection = id => {
    setSelectedTourTickets(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleFlightSelection = flight => {
    const exists = selectedFlights.find(f => f.flightId === flight._id);
    if (exists) {
      setSelectedFlights(selectedFlights.filter(f => f.flightId !== flight._id));
    } else {
      // 기본 좌석 수 1로 추가
      setSelectedFlights([...selectedFlights, {flightId: flight._id, seatsToUse: 1}]);
    }
  };

  const handleFlightSeatChange = (flightId, value) => {
    setSelectedFlights(prev =>
      prev.map(f => (f.flightId === flightId ? {...f, seatsToUse: Number(value)} : f))
    );
  };

  // 항공 모달 내 필터 및 페이징 처리
  const filteredFlights = flights.filter(
    f =>
      f.flightNumber.toLowerCase().includes(flightSearchQuery.toLowerCase()) ||
      f.airline.toLowerCase().includes(flightSearchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredFlights.length / flightsPerPage);
  const paginatedFlights = filteredFlights.slice(
    (flightPage - 1) * flightsPerPage,
    flightPage * flightsPerPage
  );

  // 패키지 생성 폼 제출
  const handleSubmit = async () => {
    setLoading(true);

    const newPackage = {
      name: packageName,
      description: packageDescription,
      accommodations: selectedAccommodations,
      rooms: selectedRooms, // { [accommodationId]: roomId }
      tours: selectedTourTickets,
      flights: selectedFlights, // [{ flightId, seatsToUse }, ...]
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

      {/* 패키지 기본 정보 입력 */}
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

      {/* 상품 선택 버튼 및 선택된 항목 요약 */}
      <Button variant="outlined" onClick={handleOpenAccommodationModal} sx={{mt: 3}}>
        숙소 및 방 선택
      </Button>
      <Typography variant="body1" sx={{mt: 1}}>
        선택된 숙소: {selectedAccommodations.join(', ')}
        {Object.keys(selectedRooms).length > 0 && (
          <>
            {' | '}선택된 방:{' '}
            {Object.entries(selectedRooms)
              .map(([accId, roomId]) => `${accId}:${roomId}`)
              .join(', ')}
          </>
        )}
      </Typography>

      <Button variant="outlined" onClick={handleOpenTourModal} sx={{mt: 3}}>
        투어/티켓 선택
      </Button>
      <Typography variant="body1" sx={{mt: 1}}>
        선택된 투어/티켓: {selectedTourTickets.join(', ')}
      </Typography>

      <Button variant="outlined" onClick={handleOpenFlightModal} sx={{mt: 3}}>
        항공 선택
      </Button>
      <Typography variant="body1" sx={{mt: 1}}>
        선택된 항공: {selectedFlights.map(f => f.flightId).join(', ')}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{mt: 3}}
        disabled={loading}>
        {loading ? '패키지 생성 중...' : '패키지 생성'}
      </Button>

      {/* 숙소 선택 모달 */}
      <Dialog
        open={openAccommodationModal}
        onClose={handleCloseAccommodationModal}
        fullWidth>
        <DialogTitle>숙소 선택</DialogTitle>
        <DialogContent>
          {accommodations.length > 0 ? (
            <List>
              {accommodations.map(acc => (
                <ListItem
                  key={acc._id}
                  button
                  onClick={() => toggleAccommodationSelection(acc._id)}>
                  <FormControlLabel
                    control={
                      <Checkbox checked={selectedAccommodations.includes(acc._id)} />
                    }
                    label={acc.name}
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" onClick={() => handleOpenRoomModal(acc)}>
                      {selectedRooms[acc._id] ? '방 변경' : '방 선택'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>숙소 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccommodationModal}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 방 선택 모달 */}
      <Dialog open={openRoomModal} onClose={handleCloseRoomModal} fullWidth>
        <DialogTitle>
          {currentAccommodation ? `${currentAccommodation.name} - 방 선택` : '방 선택'}
        </DialogTitle>
        <DialogContent>
          {currentAccommodation &&
          currentAccommodation.rooms &&
          currentAccommodation.rooms.length > 0 ? (
            <List>
              {currentAccommodation.rooms.map(room => (
                <ListItem
                  key={room._id}
                  button
                  onClick={() => {
                    setSelectedRooms(prev => ({
                      ...prev,
                      [currentAccommodation._id]: room._id
                    }));
                    handleCloseRoomModal();
                  }}>
                  <ListItemText primary={room.name} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>선택 가능한 방이 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoomModal}>취소</Button>
        </DialogActions>
      </Dialog>

      {/* 투어/티켓 선택 모달 */}
      <Dialog open={openTourModal} onClose={handleCloseTourModal} fullWidth>
        <DialogTitle>투어/티켓 선택</DialogTitle>
        <DialogContent>
          {tourTickets.length > 0 ? (
            <List>
              {tourTickets.map(ticket => (
                <ListItem
                  key={ticket._id}
                  button
                  onClick={() => toggleTourTicketSelection(ticket._id)}>
                  <FormControlLabel
                    control={
                      <Checkbox checked={selectedTourTickets.includes(ticket._id)} />
                    }
                    label={ticket.title}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>투어 티켓 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTourModal}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 항공 선택 모달 (검색 및 페이징 적용) */}
      <Dialog open={openFlightModal} onClose={handleCloseFlightModal} fullWidth>
        <DialogTitle>항공 선택</DialogTitle>
        <DialogContent>
          <TextField
            label="항공 검색"
            fullWidth
            value={flightSearchQuery}
            onChange={e => {
              setFlightSearchQuery(e.target.value);
              setFlightPage(1);
            }}
            InputProps={{endAdornment: <SearchIcon />}}
            sx={{mb: 2}}
          />
          {flights.length > 0 ? (
            <>
              <List>
                {paginatedFlights.map(flight => (
                  <ListItem
                    key={flight._id}
                    button
                    onClick={() => toggleFlightSelection(flight)}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedFlights.some(f => f.flightId === flight._id)}
                        />
                      }
                      label={`${flight.flightNumber} - ${flight.airline}`}
                    />
                    {selectedFlights.some(f => f.flightId === flight._id) && (
                      <TextField
                        label="좌석 수"
                        type="number"
                        value={
                          selectedFlights.find(f => f.flightId === flight._id)
                            ?.seatsToUse || ''
                        }
                        onChange={e => handleFlightSeatChange(flight._id, e.target.value)}
                        sx={{ml: 2, width: '100px'}}
                      />
                    )}
                  </ListItem>
                ))}
              </List>
              <div style={{display: 'flex', justifyContent: 'center', marginTop: '16px'}}>
                <Button
                  disabled={flightPage === 1}
                  onClick={() => setFlightPage(flightPage - 1)}>
                  Prev
                </Button>
                <Typography sx={{mx: 2}}>
                  {flightPage} / {totalPages}
                </Typography>
                <Button
                  disabled={flightPage === totalPages}
                  onClick={() => setFlightPage(flightPage + 1)}>
                  Next
                </Button>
              </div>
            </>
          ) : (
            <Typography>항공 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFlightModal}>확인</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PackageCreate;
