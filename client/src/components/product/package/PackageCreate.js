import React, {useEffect, useState} from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Container,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {useNavigate} from 'react-router-dom';

// 서비스 파일 임포트 (API 호출)
import {createPackage, getCreatePackageData} from '../../../api/package/packageService';

const PackageCreate = () => {
  const navigate = useNavigate();

  // 1) API로부터 불러오는 데이터 상태
  const [accommodations, setAccommodations] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  const [flights, setFlights] = useState([]);

  // 2) 선택 상태
  // 숙소( ID 배열 ), 객실({ [accommodationId]: roomId }), 투어/티켓( ID 배열 ), 항공편( [{ flightId, seatsToUse }] )
  const [selectedAccommodations, setSelectedAccommodations] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]);

  // 3) 패키지 기본 정보
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [loading, setLoading] = useState(false);

  // 4) 모달 열림/닫힘 상태
  const [openAccommodationModal, setOpenAccommodationModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  const [openFlightModal, setOpenFlightModal] = useState(false);

  // 현재 숙소(객실 모달용)
  const [currentAccommodation, setCurrentAccommodation] = useState(null);

  // 항공 검색/페이징
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightsPerPage = 5;

  // -------------------------------
  //  A) 데이터 로드: 숙소, 투어, 항공
  // -------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCreatePackageData();
        // 숙소 데이터(rooms 포함), 투어/티켓, 항공 데이터
        console.log('[DEBUG] 패키지 생성 데이터:', data);

        // 각 숙소의 객실 데이터가 populate되어 있는지 확인
        data.accommodations.forEach(acc => {
          console.log(`[DEBUG] 숙소(${acc.name})의 rooms:`, acc.rooms);
        });

        setAccommodations(data.accommodations);
        setTourTickets(data.tourTickets);
        setFlights(data.flights);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };

    fetchData();
  }, []);

  // -------------------------------
  //  B) 모달 열기/닫기 함수
  // -------------------------------
  const handleOpenAccommodationModal = () => setOpenAccommodationModal(true);
  const handleCloseAccommodationModal = () => setOpenAccommodationModal(false);

  const handleOpenRoomModal = accommodation => {
    console.log('[DEBUG] 현재 숙소의 rooms:', accommodation.rooms);
    setCurrentAccommodation(accommodation);
    setOpenRoomModal(true);
  };
  const handleCloseRoomModal = () => setOpenRoomModal(false);

  const handleOpenTourModal = () => setOpenTourModal(true);
  const handleCloseTourModal = () => setOpenTourModal(false);

  const handleOpenFlightModal = () => setOpenFlightModal(true);
  const handleCloseFlightModal = () => setOpenFlightModal(false);

  // -------------------------------
  //  C) 숙소 & 객실 선택 로직
  // -------------------------------
  const toggleAccommodationSelection = id => {
    setSelectedAccommodations(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectRoom = (accommodationId, roomId) => {
    setSelectedRooms(prev => ({
      ...prev,
      [accommodationId]: roomId
    }));
    handleCloseRoomModal();
  };

  // -------------------------------
  //  D) 투어/티켓 선택 로직
  // -------------------------------
  const toggleTourTicketSelection = id => {
    setSelectedTourTickets(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // -------------------------------
  //  E) 항공 선택 & 좌석 수 로직
  // -------------------------------
  const toggleFlightSelection = flight => {
    const exists = selectedFlights.find(f => f.flightId === flight._id);
    if (exists) {
      setSelectedFlights(prev => prev.filter(f => f.flightId !== flight._id));
    } else {
      // 기본 좌석 수 1로 추가
      setSelectedFlights(prev => [...prev, {flightId: flight._id, seatsToUse: 1}]);
    }
  };

  const handleFlightSeatChange = (flightId, value) => {
    setSelectedFlights(prev =>
      prev.map(f => (f.flightId === flightId ? {...f, seatsToUse: Number(value)} : f))
    );
  };

  // -------------------------------
  //  F) 항공 검색/페이징 처리
  // -------------------------------
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

  // -------------------------------
  //  G) 패키지 생성 요청
  // -------------------------------
  const handleSubmit = async () => {
    setLoading(true);

    const newPackage = {
      name: packageName,
      description: packageDescription,
      accommodations: selectedAccommodations,
      rooms: selectedRooms, // { [accommodationId]: roomId }
      tours: selectedTourTickets,
      flights: selectedFlights, // [{ flightId, seatsToUse }, ...]
      discountRate,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      category: 'Tour Package',
      createdBy: '67a55e912cee4aadf2463b9c' // 예시 ID
    };

    try {
      await createPackage(newPackage);
      navigate('/packages');
    } catch (error) {
      console.error('패키지 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  //  H) 렌더링
  // -------------------------------
  return (
    <Container sx={{py: 4}}>
      <Typography variant="h4" sx={{mb: 3}}>
        패키지 생성
      </Typography>

      {/* 패키지 기본 정보 입력 */}
      <Typography variant="h6" sx={{mb: 1}}>
        패키지명
      </Typography>
      <TextField
        label="패키지명"
        fullWidth
        value={packageName}
        onChange={e => setPackageName(e.target.value)}
        sx={{mb: 2}}
      />

      <Typography variant="h6" sx={{mb: 1}}>
        설명
      </Typography>
      <TextField
        label="설명"
        fullWidth
        multiline
        rows={4}
        value={packageDescription}
        onChange={e => setPackageDescription(e.target.value)}
        sx={{mb: 2}}
      />

      <Typography variant="h6" sx={{mb: 1}}>
        할인율
      </Typography>
      <TextField
        label="할인율 (%)"
        fullWidth
        type="number"
        value={discountRate}
        onChange={e => setDiscountRate(Number(e.target.value))}
        sx={{mb: 3}}
      />

      {/* 숙소 & 객실 선택 */}
      <Button variant="outlined" onClick={handleOpenAccommodationModal} sx={{mb: 1}}>
        숙소 및 방 선택
      </Button>
      <Typography variant="body1" sx={{mb: 2}}>
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

      {/* 투어/티켓 선택 */}
      <Button variant="outlined" onClick={handleOpenTourModal} sx={{mb: 1}}>
        투어/티켓 선택
      </Button>
      <Typography variant="body1" sx={{mb: 2}}>
        선택된 투어/티켓: {selectedTourTickets.join(', ')}
      </Typography>

      {/* 항공 선택 */}
      <Button variant="outlined" onClick={handleOpenFlightModal} sx={{mb: 1}}>
        항공 선택
      </Button>
      <Typography variant="body1" sx={{mb: 3}}>
        선택된 항공: {selectedFlights.map(f => f.flightId).join(', ')}
      </Typography>

      {/* 패키지 생성 버튼 */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{mb: 3}}
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
                  onClick={() => toggleAccommodationSelection(acc._id)}>
                  <FormControlLabel
                    control={
                      <Checkbox checked={selectedAccommodations.includes(acc._id)} />
                    }
                    label={acc.name}
                  />
                  <Button variant="outlined" onClick={() => handleOpenRoomModal(acc)}>
                    {selectedRooms[acc._id] ? '방 변경' : '방 선택'}
                  </Button>
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
          {currentAccommodation?.rooms && currentAccommodation.rooms.length > 0 ? (
            <List>
              {currentAccommodation.rooms.map(room => (
                <ListItem
                  key={room._id}
                  component="button"
                  onClick={() => {
                    setSelectedRooms(prev => ({
                      ...prev,
                      [currentAccommodation._id]: room._id
                    }));
                    handleCloseRoomModal();
                  }}>
                  <ListItemText
                    primary={room.name}
                    secondary={
                      room.pricePerNight
                        ? `${room.pricePerNight.toLocaleString()}원`
                        : '가격 정보 없음'
                    }
                    sx={{color: 'text.primary'}}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography sx={{color: 'text.secondary'}}>
              선택 가능한 방이 없습니다.
            </Typography>
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
                  component="button"
                  onClick={() => {
                    setSelectedTourTickets(prev =>
                      prev.includes(ticket._id)
                        ? prev.filter(id => id !== ticket._id)
                        : [...prev, ticket._id]
                    );
                  }}>
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

      {/* 항공 선택 모달 (검색 & 페이징) */}
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
                    component="button"
                    onClick={() => {
                      const exists = selectedFlights.find(f => f.flightId === flight._id);
                      if (exists) {
                        setSelectedFlights(prev =>
                          prev.filter(f => f.flightId !== flight._id)
                        );
                      } else {
                        setSelectedFlights(prev => [
                          ...prev,
                          {flightId: flight._id, seatsToUse: 1}
                        ]);
                      }
                    }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedFlights.some(f => f.flightId === flight._id)}
                        />
                      }
                      label={`${flight.flightNumber} - ${flight.airline}`}
                    />
                    {/* 좌석 수 입력 */}
                    {selectedFlights.some(f => f.flightId === flight._id) && (
                      <TextField
                        label="좌석 수"
                        type="number"
                        value={
                          selectedFlights.find(f => f.flightId === flight._id)
                            ?.seatsToUse || ''
                        }
                        onChange={e => {
                          const val = Number(e.target.value);
                          setSelectedFlights(prev =>
                            prev.map(item =>
                              item.flightId === flight._id
                                ? {...item, seatsToUse: val}
                                : item
                            )
                          );
                        }}
                        onClick={e => e.stopPropagation()}
                        sx={{ml: 2, width: '100px'}}
                      />
                    )}
                  </ListItem>
                ))}
              </List>
              <Box sx={{display: 'flex', justifyContent: 'center', mt: 2}}>
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
              </Box>
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
