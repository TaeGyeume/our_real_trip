import React, {useEffect, useState} from 'react';
import {
  Button,
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
  CardMedia,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import {useNavigate} from 'react-router-dom';
import authAPI from '../../../api/auth/auth';
import {createPackage, getCreatePackageData} from '../../../api/package/packageService';

// 항공사 로고 예시
const AIRLINE_LOGOS = {
  대한항공: '/images/logos/korean.png',
  아시아나항공: '/images/logos/asiana.png',
  에어서울: '/images/logos/airseoul.png',
  이스타항공: '/images/logos/eastar.png',
  진에어: '/images/logos/jinair.png',
  티웨이항공: '/images/logos/twayair.png',
  제주항공: '/images/logos/jejuair.png'
};

/** 항공편 카드 */
function FlightCard({flight, isSelected, onToggleFlight, onSeatChange}) {
  const logoSrc = AIRLINE_LOGOS[flight.airline] || '/images/logos/default.png';
  return (
    <Card sx={{display: 'flex', alignItems: 'center', mb: 2, p: 1}}>
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
      {isSelected && (
        <TextField
          label="좌석 수"
          type="number"
          size="small"
          sx={{width: 100, mr: 2}}
          value={isSelected.seatsToUse}
          onChange={e => onSeatChange(flight._id, e.target.value)}
        />
      )}
      <Button
        variant={isSelected ? 'contained' : 'outlined'}
        onClick={() => onToggleFlight(flight)}>
        {isSelected ? '선택 해제' : '선택'}
      </Button>
    </Card>
  );
}

export default function PackageCreate() {
  const navigate = useNavigate();

  // 1) API에서 불러올 상품들 (숙소, 투어/티켓, 항공)
  const [accommodations, setAccommodations] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  const [flights, setFlights] = useState([]);

  // 2) 선택 상태
  // 숙소 & 방: { [accId]: [roomId1, roomId2, ...] }
  const [selectedRooms, setSelectedRooms] = useState({});
  // 각 객실에 대해 예약 날짜 입력: { [roomId]: { start, end } }
  const [selectedRoomDates, setSelectedRoomDates] = useState({});
  // 투어/티켓: 배열( [tourId1, tourId2, ...] )
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  // 항공: [ { flightId, seatsToUse }, ... ]
  const [selectedFlights, setSelectedFlights] = useState([]);

  // 3) 패키지 기본 정보
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [discountRate, setDiscountRate] = useState(0);

  // 4) 이미지 업로드
  const [packageImages, setPackageImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // 5) 모달 열림/닫힘 상태
  const [openAccommodationModal, setOpenAccommodationModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  const [openFlightModal, setOpenFlightModal] = useState(false);

  // 6) 현재 선택 중인 숙소(방 모달용)
  const [currentAccommodation, setCurrentAccommodation] = useState(null);

  // 7) 항공 검색/페이징
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightsPerPage = 5;

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCreatePackageData();
        setAccommodations(data.accommodations);
        setTourTickets(data.tourTickets);
        setFlights(data.flights);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };
    fetchData();
  }, []);

  // 이미지 업로드 핸들러
  const handleImageChange = e => {
    setPackageImages(prev => [...prev, ...Array.from(e.target.files)]);
  };

  // const handleRemoveImage = index => {
  //   setPackageImages(prev => prev.filter((_, i) => i !== index));
  // };

  // 모달 열기/닫기 핸들러
  const handleOpenAccommodationModal = () => setOpenAccommodationModal(true);
  const handleCloseAccommodationModal = () => setOpenAccommodationModal(false);
  const handleOpenRoomModal = acc => {
    setCurrentAccommodation(acc);
    setOpenRoomModal(true);
  };
  const handleCloseRoomModal = () => setOpenRoomModal(false);
  const handleOpenTourModal = () => setOpenTourModal(true);
  const handleCloseTourModal = () => setOpenTourModal(false);
  const handleOpenFlightModal = () => setOpenFlightModal(true);
  const handleCloseFlightModal = () => setOpenFlightModal(false);

  // 숙소 & 방 선택 로직
  const toggleRoomSelection = (accId, roomId) => {
    setSelectedRooms(prev => {
      const oldRooms = prev[accId] || [];
      const isSelected = oldRooms.includes(roomId);
      let newRooms;
      if (isSelected) {
        newRooms = oldRooms.filter(r => r !== roomId);
        // 선택 해제 시 해당 객실의 예약 날짜도 제거
        setSelectedRoomDates(prevDates => {
          const newDates = {...prevDates};
          delete newDates[roomId];
          return newDates;
        });
      } else {
        newRooms = [...oldRooms, roomId];
      }
      return {...prev, [accId]: newRooms};
    });
  };

  const handleRemoveAccommodation = accId => {
    setSelectedRooms(prev => {
      const newObj = {...prev};
      if (newObj[accId]) {
        newObj[accId].forEach(roomId => {
          setSelectedRoomDates(prevDates => {
            const newDates = {...prevDates};
            delete newDates[roomId];
            return newDates;
          });
        });
      }
      delete newObj[accId];
      return newObj;
    });
  };

  // 투어/티켓 선택 로직
  const toggleTourTicketSelection = tourId => {
    setSelectedTourTickets(prev => {
      const isSelected = prev.includes(tourId);
      if (isSelected) {
        return prev.filter(id => id !== tourId);
      } else {
        return [...prev, tourId];
      }
    });
  };

  // 항공 선택 및 좌석 수 변경
  const toggleFlightSelection = flight => {
    setSelectedFlights(prev => {
      const exists = prev.find(f => f.flightId === flight._id);
      if (exists) {
        return prev.filter(f => f.flightId !== flight._id);
      } else {
        return [...prev, {flightId: flight._id, seatsToUse: 1}];
      }
    });
  };

  const handleFlightSeatChange = (flightId, value) => {
    setSelectedFlights(prev =>
      prev.map(f => (f.flightId === flightId ? {...f, seatsToUse: Number(value)} : f))
    );
  };

  // 항공 검색/페이징
  const filteredFlights = flights.filter(f => {
    const query = flightSearchQuery.toLowerCase();
    return (
      f.flightNumber.toLowerCase().includes(query) ||
      f.airline.toLowerCase().includes(query)
    );
  });
  const totalPagesFlights = Math.ceil(filteredFlights.length / flightsPerPage);
  const paginatedFlights = filteredFlights.slice(
    (flightPage - 1) * flightsPerPage,
    flightPage * flightsPerPage
  );

  const findSelectedFlight = flightId =>
    selectedFlights.find(f => f.flightId === flightId);

  // 객실 예약 날짜 변경 핸들러
  const handleRoomDateChange = (roomId, field, value) => {
    setSelectedRoomDates(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value
      }
    }));
  };

  // 패키지 생성 제출 핸들러
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const userProfile = await authAPI.getUserProfile();
      if (!userProfile || !userProfile._id) {
        console.error('[ERROR] 로그인 정보를 가져올 수 없습니다.');
        setLoading(false);
        return;
      }

      // Build roomIds, startDates, endDates from selectedRooms and selectedRoomDates
      const allRoomIds = [];
      const allStartDates = [];
      const allEndDates = [];
      Object.keys(selectedRooms).forEach(accId => {
        selectedRooms[accId].forEach(roomId => {
          allRoomIds.push(roomId);
          const dateInfo = selectedRoomDates[roomId] || {start: '', end: ''};
          allStartDates.push(dateInfo.start);
          allEndDates.push(dateInfo.end);
        });
      });

      const formData = new FormData();
      formData.append('name', packageName);
      formData.append('description', packageDescription);
      formData.append('discountRate', discountRate);
      formData.append('startDate', '2025-01-01');
      formData.append('endDate', '2025-12-31');
      formData.append('category', 'Tour Package');
      formData.append('createdBy', userProfile._id);

      // 숙소 선택: 선택된 숙소 ID (Object.keys(selectedRooms))
      formData.append('accommodations', JSON.stringify(Object.keys(selectedRooms)));
      // "rooms" 필드: 원래 선택된 객실 정보를 그대로 전달 (프론트에서는 JSON 형식으로 보냄)
      formData.append('rooms', JSON.stringify(selectedRooms));
      // 추가: 객실 예약 날짜 배열
      formData.append('roomIds', JSON.stringify(allRoomIds));
      formData.append('startDates', JSON.stringify(allStartDates));
      formData.append('endDates', JSON.stringify(allEndDates));

      // 투어/티켓 선택
      formData.append('tours', JSON.stringify(selectedTourTickets));

      // 항공 선택
      formData.append('flights', JSON.stringify(selectedFlights));

      // 이미지 파일들
      packageImages.forEach(file => {
        formData.append('images', file);
      });

      await createPackage(formData);
      navigate('/packages');
    } catch (error) {
      console.error('패키지 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 렌더링: 선택된 상품들
  const selectedAccommodations = Object.keys(selectedRooms);

  return (
    <Container sx={{py: 4}}>
      <Typography variant="h4" sx={{mb: 3}}>
        패키지 생성
      </Typography>

      {/* 패키지 이미지 업로드 */}
      <Typography variant="h6" sx={{mb: 1}}>
        패키지 이미지 업로드
      </Typography>
      <Box sx={{mb: 2}}>
        <Button variant="outlined" component="label">
          이미지 선택
          <input
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
        </Button>
      </Box>

      {/* 미리보기 */}
      <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
        {packageImages.map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <Box key={idx} sx={{position: 'relative'}}>
              <img
                src={previewUrl}
                alt="preview"
                style={{width: 100, height: 100, objectFit: 'cover', borderRadius: 4}}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => setPackageImages(prev => prev.filter((_, i) => i !== idx))}
                sx={{position: 'absolute', top: 0, right: 0}}>
                <CloseIcon />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* 패키지 기본 정보 */}
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

      {/* 숙소/방 선택 */}
      <Button variant="outlined" onClick={handleOpenAccommodationModal} sx={{mb: 1}}>
        숙소 및 방 선택
      </Button>

      {/* 선택된 숙소 */}
      <Typography variant="h6" sx={{mt: 2}}>
        선택된 숙소
      </Typography>
      {selectedAccommodations.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          선택된 숙소가 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedAccommodations.map(accId => {
            const found = accommodations.find(a => a._id === accId);
            if (!found) return <Typography key={accId}>{accId}</Typography>;
            const imgUrl = found.images?.[0] || '';
            const price = found.minPrice
              ? `${found.minPrice.toLocaleString()}원`
              : '가격 정보 없음';
            return (
              <Box key={accId} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Avatar
                  src={imgUrl}
                  alt={found.name}
                  variant="square"
                  sx={{width: 40, height: 40, mr: 1}}
                />
                <Typography sx={{mr: 2}}>
                  {found.name} ({price})
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => handleRemoveAccommodation(accId)}>
                  전체 해제
                </Button>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 선택된 방 */}
      <Typography variant="h6" sx={{mt: 2}}>
        선택된 방 (예약 날짜 입력)
      </Typography>
      {selectedAccommodations.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          방이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedAccommodations.map(accId => {
            const foundAcc = accommodations.find(a => a._id === accId);
            const roomIdsForAcc = selectedRooms[accId] || [];
            if (!foundAcc) return null;
            return (
              <Box key={accId} sx={{mb: 1}}>
                <Typography sx={{fontWeight: 'bold', mb: 0.5}}>
                  {foundAcc.name}
                </Typography>
                {roomIdsForAcc.map(roomId => {
                  const foundRoom = foundAcc.rooms.find(r => r._id === roomId);
                  if (!foundRoom) return null;
                  const roomPrice = foundRoom.pricePerNight
                    ? `${foundRoom.pricePerNight.toLocaleString()}원`
                    : '가격 정보 없음';
                  const roomDate = selectedRoomDates[roomId] || {start: '', end: ''};
                  return (
                    <Box
                      key={roomId}
                      sx={{display: 'flex', alignItems: 'center', ml: 2, mb: 1}}>
                      <Typography>
                        - {foundRoom.name} ({roomPrice})
                      </Typography>
                      <TextField
                        label="체크인"
                        type="date"
                        size="small"
                        value={roomDate.start}
                        onChange={e =>
                          handleRoomDateChange(roomId, 'start', e.target.value)
                        }
                        InputLabelProps={{shrink: true}}
                        sx={{ml: 2}}
                      />
                      <TextField
                        label="체크아웃"
                        type="date"
                        size="small"
                        value={roomDate.end}
                        onChange={e =>
                          handleRoomDateChange(roomId, 'end', e.target.value)
                        }
                        InputLabelProps={{shrink: true}}
                        sx={{ml: 2}}
                      />
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      )}

      {/* 투어/티켓 선택 */}
      <Button variant="outlined" onClick={handleOpenTourModal} sx={{mt: 2}}>
        투어/티켓 선택
      </Button>

      {/* 선택된 투어/티켓 */}
      <Typography variant="h6" sx={{mt: 2}}>
        선택된 투어/티켓
      </Typography>
      {selectedTourTickets.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          선택된 투어/티켓이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedTourTickets.map(tourId => {
            const foundTour = tourTickets.find(t => t._id === tourId);
            if (!foundTour) return <Typography key={tourId}>{tourId}</Typography>;
            const imgUrl = foundTour.images?.[0] || '';
            const price = foundTour.price
              ? `${foundTour.price.toLocaleString()}원`
              : '가격 정보 없음';
            return (
              <Box key={tourId} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Avatar
                  src={imgUrl}
                  alt={foundTour.title}
                  variant="square"
                  sx={{width: 40, height: 40, mr: 1}}
                />
                <Typography>
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

      {/* 선택된 항공 */}
      <Typography variant="h6" sx={{mt: 2}}>
        선택된 항공
      </Typography>
      {selectedFlights.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          선택된 항공이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedFlights.map((f, idx) => {
            const foundFlight = flights.find(fl => fl._id === f.flightId);
            if (!foundFlight) {
              return (
                <Typography key={idx} color="text.secondary">
                  {f.flightId} - (데이터 없음)
                </Typography>
              );
            }
            const flightDate = foundFlight.departureDate || '날짜 정보 없음';
            const flightPrice = foundFlight.price
              ? `${foundFlight.price.toLocaleString()}원`
              : '0원';
            return (
              <Box key={idx} sx={{mb: 1}}>
                <Typography>
                  {foundFlight.flightNumber} - {foundFlight.airline} ({flightPrice}) /{' '}
                  {flightDate} / 좌석 {f.seatsToUse}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 패키지 생성 버튼 */}
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
        <DialogTitle>숙소 목록</DialogTitle>
        <DialogContent>
          {accommodations.length > 0 ? (
            <List>
              {accommodations.map(acc => (
                <ListItem disablePadding key={acc._id}>
                  <ListItemButton onClick={() => handleOpenRoomModal(acc)}>
                    <ListItemAvatar>
                      <Avatar
                        src={acc.images?.[0] || ''}
                        alt={acc.name}
                        variant="square"
                        sx={{width: 60, height: 60, mr: 1}}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primaryTypographyProps={{component: 'span'}}
                      secondaryTypographyProps={{component: 'span'}}
                      primary={
                        acc.name +
                        (acc.minPrice ? ` - ${acc.minPrice.toLocaleString()}원` : '')
                      }
                      secondary={acc.description || '상세 설명이 없습니다.'}
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
          <Button onClick={handleCloseAccommodationModal}>닫기</Button>
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
              {currentAccommodation.rooms.map(room => {
                const accId = currentAccommodation._id;
                const selectedRoomIds = selectedRooms[accId] || [];
                const isSelected = selectedRoomIds.includes(room._id);
                const roomPrice = room.pricePerNight
                  ? `${room.pricePerNight.toLocaleString()}원`
                  : '가격 정보 없음';
                return (
                  <ListItem key={room._id} disablePadding>
                    <ListItemButton
                      onClick={() => toggleRoomSelection(accId, room._id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                      <ListItemText primary={`${room.name}`} secondary={roomPrice} />
                      <Button
                        variant={isSelected ? 'contained' : 'outlined'}
                        size="small">
                        {isSelected ? '선택 해제' : '선택'}
                      </Button>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography sx={{color: 'text.secondary'}}>
              선택 가능한 방이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoomModal}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 투어 선택 모달 */}
      <Dialog open={openTourModal} onClose={handleCloseTourModal} fullWidth>
        <DialogTitle>투어/티켓 선택</DialogTitle>
        <DialogContent>
          {tourTickets.length > 0 ? (
            <List>
              {tourTickets.map(ticket => {
                const isSelected = selectedTourTickets.includes(ticket._id);
                const priceText = ticket.price
                  ? `${ticket.price.toLocaleString()}원`
                  : '가격 정보 없음';
                return (
                  <ListItem key={ticket._id} disablePadding>
                    <ListItemButton
                      onClick={() => toggleTourTicketSelection(ticket._id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                      <ListItemAvatar>
                        <Avatar
                          src={ticket.images?.[0] || ''}
                          alt={ticket.title}
                          variant="square"
                          sx={{width: 60, height: 60, mr: 1}}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={ticket.title}
                        secondary={priceText}
                        sx={{mr: 2}}
                      />
                      <Button
                        variant={isSelected ? 'contained' : 'outlined'}
                        size="small">
                        {isSelected ? '선택 해제' : '선택'}
                      </Button>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography>투어 티켓 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTourModal}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 항공 선택 모달 */}
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
              {paginatedFlights.map(flight => {
                const selected = findSelectedFlight(flight._id);
                return (
                  <FlightCard
                    key={flight._id}
                    flight={flight}
                    isSelected={selected}
                    onToggleFlight={toggleFlightSelection}
                    onSeatChange={handleFlightSeatChange}
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
                  {flightPage} / {totalPagesFlights}
                </Typography>
                <Button
                  disabled={flightPage === totalPagesFlights}
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
          <Button onClick={handleCloseFlightModal}>확인</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
