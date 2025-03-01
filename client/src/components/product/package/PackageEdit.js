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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemButton,
  Box,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/** 항공편 카드 컴포넌트 */
function FlightCard({flight, isSelected, onSelect, onSeatChange}) {
  // 항공사 로고 (예시)
  const AIRLINE_LOGOS = {
    대한항공: '/images/logos/korean.png',
    아시아나항공: '/images/logos/asiana.png',
    에어서울: '/images/logos/airseoul.png',
    이스타항공: '/images/logos/eastar.png',
    진에어: '/images/logos/jinair.png',
    티웨이항공: '/images/logos/twayair.png',
    제주항공: '/images/logos/jejuair.png',
    default: '/images/logos/default.png'
  };
  const logoSrc = AIRLINE_LOGOS[flight.airline] || AIRLINE_LOGOS.default;

  return (
    <Card sx={{display: 'flex', alignItems: 'center', mb: 2, p: 1}}>
      {/* 항공사 로고 */}
      <CardMedia
        component="img"
        sx={{width: 60, height: 60, objectFit: 'contain', mr: 2}}
        image={logoSrc}
        alt={flight.airline}
      />

      <CardContent sx={{flex: 1}}>
        <Typography variant="h6" gutterBottom>
          {flight.flightNumber} - {flight.airline}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          날짜: {flight.departureDate || '정보 없음'} / 가격:{' '}
          {flight.price?.toLocaleString() ?? 0}원 / 잔여석: {flight.seatsAvailable ?? 0}석
        </Typography>
      </CardContent>

      {/* 선택된 항공이면 좌석 수 입력 노출 */}
      {isSelected ? (
        <TextField
          label="좌석 수"
          type="number"
          size="small"
          sx={{width: 100, mr: 2}}
          value={isSelected.seatsToUse}
          onChange={e => onSeatChange(flight._id, e.target.value)}
        />
      ) : null}

      <Button
        variant={isSelected ? 'contained' : 'outlined'}
        color="primary"
        onClick={() => onSelect(flight)}>
        {isSelected ? '선택 해제' : '선택'}
      </Button>
    </Card>
  );
}

const PackageEdit = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  // [1] 로딩 상태
  const [loading, setLoading] = useState(false);

  // [2] 패키지 기본 정보 state
  const [packageData, setPackageData] = useState({
    name: '',
    description: '',
    discountRate: 0, // 할인율
    accommodations: [],
    tours: [],
    flights: []
  });

  // [3] 선택 상태 (숙소-방, 투어, 항공)
  const [selectedAccommodations, setSelectedAccommodations] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState({}); // { [accId]: roomId }
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]); // [{ flightId, seatsToUse }]

  // [4] 생성 페이지와 동일한 옵션 데이터 (숙소, 투어, 항공)
  const [availableAccommodations, setAvailableAccommodations] = useState([]);
  const [availableTourTickets, setAvailableTourTickets] = useState([]);
  const [availableFlights, setAvailableFlights] = useState([]);

  // [5] 모달 관련 임시 상태
  const [tempAccommodations, setTempAccommodations] = useState([]);
  const [tempTourTickets, setTempTourTickets] = useState([]);
  const [tempFlights, setTempFlights] = useState([]);
  const [tempSeatCounts, setTempSeatCounts] = useState({});

  // [6] 모달 열림 상태
  const [openAccommodationModal, setOpenAccommodationModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  const [openFlightModal, setOpenFlightModal] = useState(false);
  const [currentAccommodation, setCurrentAccommodation] = useState(null);

  // [7] 항공 검색/페이징
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightsPerPage = 5;

  // -----------------------------
  // A) 기존 패키지 데이터 로드
  // -----------------------------
  useEffect(() => {
    fetchPackageData();
    fetchAvailableData();
    // eslint-disable-next-line
  }, []);

  const fetchPackageData = async () => {
    try {
      const data = await getPackageById(id);

      // 패키지 기본 정보 세팅
      setPackageData(prev => ({
        ...prev,
        name: data.name,
        description: data.description,
        discountRate: data.discountRate ?? 0
      }));

      // 선택 상태 초기화
      const accIds = data.accommodations.map(acc => acc._id);
      const tourIds = data.tours.map(t => t._id);
      const flightObjs = data.flights.map(f => ({
        flightId: f.flightId._id || f.flightId,
        seatsToUse: f.seatsToUse
      }));

      setSelectedAccommodations(accIds);
      setSelectedTourTickets(tourIds);
      setSelectedFlights(flightObjs);

      // 임시 상태도 동일하게
      setTempAccommodations(accIds);
      setTempTourTickets(tourIds);
      setTempFlights(flightObjs);
    } catch (error) {
      console.error('패키지 조회 실패:', error);
    }
  };

  // -----------------------------
  // B) 선택 가능한 데이터 로드
  // -----------------------------
  const fetchAvailableData = async () => {
    try {
      const data = await getCreatePackageData();
      setAvailableAccommodations(data.accommodations);
      setAvailableTourTickets(data.tourTickets);
      setAvailableFlights(data.flights);
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
    }
  };

  // -----------------------------
  // 숙소/방 모달
  // -----------------------------
  const handleOpenAccommodationModal = () => {
    // 임시 상태에 현재 선택값 복사
    setTempAccommodations([...selectedAccommodations]);
    setOpenAccommodationModal(true);
  };
  const handleCloseAccommodationModal = () => {
    setOpenAccommodationModal(false);
  };

  const handleOpenRoomModal = acc => {
    setCurrentAccommodation(acc);
    setOpenRoomModal(true);
  };
  const handleCloseRoomModal = () => {
    setOpenRoomModal(false);
  };

  // 숙소 임시 선택 (모달 내에서) + 방 모달 열기
  const handleSelectAccommodationTemp = acc => {
    // 숙소 체크/해제
    setTempAccommodations(prev =>
      prev.includes(acc._id) ? prev.filter(id => id !== acc._id) : [...prev, acc._id]
    );
    // 곧바로 방 모달 오픈
    setCurrentAccommodation(acc);
    setOpenRoomModal(true);
  };

  // 방 선택 -> 바로 메인 상태에 반영
  const handleSelectRoom = (accId, roomId) => {
    setSelectedRooms(prev => ({...prev, [accId]: roomId}));
    setOpenRoomModal(false);
  };

  // -----------------------------
  // 투어 모달
  // -----------------------------
  const handleOpenTourModal = () => {
    setTempTourTickets([...selectedTourTickets]);
    setOpenTourModal(true);
  };
  const handleCloseTourModal = () => {
    // 확인 버튼 -> 메인 상태에 반영
    setSelectedTourTickets([...tempTourTickets]);
    setOpenTourModal(false);
  };
  const handleCancelTourModal = () => {
    // 취소 버튼 -> 임시 상태 무시
    setTempTourTickets([...selectedTourTickets]);
    setOpenTourModal(false);
  };
  const toggleTourTicketSelectionTemp = id => {
    setTempTourTickets(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // -----------------------------
  // 항공 모달
  // -----------------------------
  const handleOpenFlightModal = () => {
    setTempFlights([...selectedFlights]);
    setTempSeatCounts({
      ...tempSeatCounts,
      ...selectedFlights.reduce((acc, f) => ({...acc, [f.flightId]: f.seatsToUse}), {})
    });
    setOpenFlightModal(true);
  };
  const handleCloseFlightModal = () => {
    // 확인 -> 메인 상태에 반영
    setSelectedFlights([...tempFlights]);
    setOpenFlightModal(false);
  };
  const handleCancelFlightModal = () => {
    // 취소 -> 임시 상태 무시
    setTempFlights([...selectedFlights]);
    setOpenFlightModal(false);
  };

  // 항공 임시 선택
  const toggleFlightSelectionTemp = flight => {
    setTempFlights(prev => {
      const exists = prev.find(f => f.flightId === flight._id);
      if (exists) {
        return prev.filter(f => f.flightId !== flight._id);
      } else {
        return [...prev, {flightId: flight._id, seatsToUse: 1}];
      }
    });
  };
  // 항공 좌석 수 임시 변경
  const handleFlightSeatChangeTemp = (flightId, value) => {
    setTempFlights(prev =>
      prev.map(f => (f.flightId === flightId ? {...f, seatsToUse: Number(value)} : f))
    );
  };
  const findSelectedFlightTemp = flightId =>
    tempFlights.find(f => f.flightId === flightId);

  // 항공 검색/페이징
  const filteredFlights = availableFlights.filter(f => {
    const query = flightSearchQuery.toLowerCase();
    return (
      f.flightNumber.toLowerCase().includes(query) ||
      f.airline.toLowerCase().includes(query)
    );
  });
  const totalPages = Math.ceil(filteredFlights.length / flightsPerPage);
  const paginatedFlights = filteredFlights.slice(
    (flightPage - 1) * flightsPerPage,
    flightPage * flightsPerPage
  );

  // -----------------------------
  // 패키지 수정
  // -----------------------------
  const handleUpdate = async () => {
    setLoading(true);

    const updatedPackage = {
      name: packageData.name,
      description: packageData.description,
      discountRate: packageData.discountRate,
      accommodations: selectedAccommodations,
      rooms: selectedRooms,
      tours: selectedTourTickets,
      flights: selectedFlights
    };

    try {
      await updatePackage(id, updatedPackage);
      navigate('/packages');
    } catch (error) {
      console.error('패키지 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 렌더링
  // -----------------------------
  return (
    <Container sx={{py: 4}}>
      <Typography variant="h4" sx={{mb: 3}}>
        패키지 수정
      </Typography>

      {/* 패키지명 */}
      <TextField
        label="패키지명"
        fullWidth
        value={packageData.name}
        onChange={e => setPackageData({...packageData, name: e.target.value})}
        sx={{mb: 2}}
      />

      {/* 설명 */}
      <TextField
        label="설명"
        fullWidth
        multiline
        rows={4}
        value={packageData.description}
        onChange={e => setPackageData({...packageData, description: e.target.value})}
        sx={{mb: 2}}
      />

      {/* 할인율 */}
      <TextField
        label="할인율 (%)"
        fullWidth
        type="number"
        // 0이면 ''로 표시 -> 사용자에게는 빈칸으로 보이도록
        value={packageData.discountRate === 0 ? '' : packageData.discountRate}
        onChange={e => {
          const val = Number(e.target.value);
          // 입력이 비었으면 0, 아니면 숫자
          setPackageData({...packageData, discountRate: isNaN(val) ? 0 : val});
        }}
        sx={{mb: 3}}
      />

      {/* 숙소 & 방 선택 */}
      <Button variant="outlined" onClick={handleOpenAccommodationModal} sx={{mb: 1}}>
        숙소 및 방 선택
      </Button>

      <Typography variant="h6" sx={{mt: 2}}>
        선택된 숙소
      </Typography>
      {selectedAccommodations.length === 0 ? (
        <Typography variant="body2" sx={{color: 'text.secondary'}}>
          선택된 숙소가 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedAccommodations.map(accId => {
            const found = availableAccommodations.find(a => a._id === accId);
            if (!found) return <Typography key={accId}>{accId}</Typography>;
            return (
              <Box key={accId} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Avatar
                  src={found.images?.[0] || ''}
                  alt={found.name}
                  variant="square"
                  sx={{width: 40, height: 40, mr: 1}}
                />
                <Typography variant="body1">{found.name}</Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* (2) 선택된 방 */}
      <Typography variant="h6" sx={{mt: 2}}>
        선택된 방
      </Typography>
      {Object.keys(selectedRooms).length === 0 ? (
        <Typography variant="body2" sx={{color: 'text.secondary'}}>
          선택된 방이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {Object.entries(selectedRooms).map(([accId, roomId]) => {
            const foundAcc = availableAccommodations.find(a => a._id === accId);
            const foundRoom = foundAcc?.rooms?.find(r => r._id === roomId);
            if (!foundAcc || !foundRoom) {
              return (
                <Typography key={`${accId}-${roomId}`}>
                  {accId}:{roomId}
                </Typography>
              );
            }
            const roomPrice = foundRoom.pricePerNight
              ? `${foundRoom.pricePerNight.toLocaleString()}원`
              : '가격 정보 없음';
            return (
              <Box key={`${accId}-${roomId}`} sx={{display: 'flex', mb: 1}}>
                <Typography variant="body1" sx={{mr: 1}}>
                  {foundAcc.name} - {foundRoom.name} ({roomPrice})
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 투어/티켓 선택 */}
      <Button variant="outlined" onClick={handleOpenTourModal} sx={{mt: 2}}>
        투어/티켓 선택
      </Button>

      <Typography variant="h6" sx={{mt: 2}}>
        선택된 투어/티켓
      </Typography>
      {selectedTourTickets.length === 0 ? (
        <Typography variant="body2" sx={{color: 'text.secondary'}}>
          선택된 투어/티켓이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedTourTickets.map(tourId => {
            const foundTour = availableTourTickets.find(t => t._id === tourId);
            if (!foundTour) return <Typography key={tourId}>{tourId}</Typography>;
            const price = foundTour.price
              ? `${foundTour.price.toLocaleString()}원`
              : '가격 정보 없음';
            return (
              <Box key={tourId} sx={{display: 'flex', mb: 1}}>
                <Typography variant="body1">
                  {foundTour.title} ({price})
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 항공 선택 */}
      <Button variant="outlined" onClick={handleOpenFlightModal} sx={{mt: 2}}>
        항공 선택
      </Button>

      <Typography variant="h6" sx={{mt: 2}}>
        선택된 항공
      </Typography>
      {selectedFlights.length === 0 ? (
        <Typography variant="body2" sx={{color: 'text.secondary'}}>
          선택된 항공이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedFlights.map((f, idx) => {
            const foundFlight = availableFlights.find(fl => fl._id === f.flightId);
            if (!foundFlight) {
              return <Typography key={idx}>{f.flightId} - (데이터 없음)</Typography>;
            }
            // 좌석 수 × 항공 가격
            const totalFlightPrice = foundFlight.price * f.seatsToUse;
            const flightPrice = totalFlightPrice
              ? `${totalFlightPrice.toLocaleString()}원`
              : '0원';

            return (
              <Box key={idx} sx={{display: 'flex', mb: 1}}>
                <Typography variant="body1">
                  {foundFlight.flightNumber} - {foundFlight.airline} ({flightPrice})
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 수정 버튼 */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpdate}
        sx={{mt: 3}}
        disabled={loading}>
        {loading ? '패키지 수정 중...' : '패키지 수정'}
      </Button>

      {/* 숙소 선택 모달 */}
      <Dialog
        open={openAccommodationModal}
        onClose={handleCloseAccommodationModal}
        fullWidth>
        <DialogTitle>숙소 목록</DialogTitle>
        <DialogContent>
          {availableAccommodations.length > 0 ? (
            <List>
              {availableAccommodations.map(acc => (
                <ListItem disablePadding key={acc._id}>
                  {/* 숙소 클릭 -> 숙소 임시 선택 + 방 모달 열기 */}
                  <ListItemButton onClick={() => handleSelectAccommodationTemp(acc)}>
                    <ListItemAvatar>
                      <Avatar
                        src={acc.images?.[0] || ''}
                        alt={acc.name}
                        variant="square"
                        sx={{width: 60, height: 60, mr: 1}}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={acc.name}
                      secondary={
                        acc.minPrice
                          ? `${acc.minPrice.toLocaleString()}원`
                          : '가격 정보 없음'
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>숙소 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccommodationModal}>취소</Button>
          <Button
            onClick={() => {
              // "확인" -> 임시 상태를 메인 상태에 반영
              setSelectedAccommodations([...tempAccommodations]);
              setOpenAccommodationModal(false);
            }}>
            확인
          </Button>
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
                <ListItemButton
                  key={room._id}
                  onClick={() => handleSelectRoom(currentAccommodation._id, room._id)}>
                  <ListItemText
                    primary={room.name}
                    secondary={
                      room.pricePerNight
                        ? `${room.pricePerNight.toLocaleString()}원`
                        : '가격 정보 없음'
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography>선택 가능한 방이 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoomModal}>취소</Button>
          <Button onClick={handleCloseRoomModal}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 투어/티켓 선택 모달 */}
      <Dialog open={openTourModal} onClose={handleCancelTourModal} fullWidth>
        <DialogTitle>투어/티켓 선택</DialogTitle>
        <DialogContent>
          {availableTourTickets.length > 0 ? (
            <List>
              {availableTourTickets.map(ticket => (
                <ListItemButton
                  key={ticket._id}
                  onClick={() => toggleTourTicketSelectionTemp(ticket._id)}>
                  <ListItemAvatar>
                    <Avatar
                      src={ticket.images?.[0] || ''}
                      alt={ticket.title}
                      variant="square"
                      sx={{width: 60, height: 60, mr: 1}}
                    />
                  </ListItemAvatar>
                  <FormControlLabel
                    control={<Checkbox checked={tempTourTickets.includes(ticket._id)} />}
                    label={
                      ticket.title +
                      (ticket.price ? ` - ${ticket.price.toLocaleString()}원` : '')
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography>투어 티켓 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelTourModal}>취소</Button>
          <Button onClick={handleCloseTourModal}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 항공 선택 모달 */}
      <Dialog open={openFlightModal} onClose={handleCancelFlightModal} fullWidth>
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
          {availableFlights.length > 0 ? (
            <>
              {paginatedFlights.map(flight => {
                const selected = findSelectedFlightTemp(flight._id);
                return (
                  <FlightCard
                    key={flight._id}
                    flight={flight}
                    isSelected={selected}
                    onSelect={toggleFlightSelectionTemp}
                    onSeatChange={handleFlightSeatChangeTemp}
                  />
                );
              })}
              <Box sx={{display: 'flex', justifyContent: 'center', mt: 2}}>
                <Button
                  disabled={flightPage === 1}
                  onClick={() => setFlightPage(prev => prev - 1)}>
                  Prev
                </Button>
                <Typography sx={{mx: 2}} component="span">
                  {flightPage} / {totalPages}
                </Typography>
                <Button
                  disabled={flightPage === totalPages}
                  onClick={() => setFlightPage(prev => prev + 1)}>
                  Next
                </Button>
              </Box>
            </>
          ) : (
            <Typography>항공 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelFlightModal}>취소</Button>
          <Button onClick={handleCloseFlightModal}>확인</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PackageEdit;
