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
  CardMedia,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

/** 항공편 카드 컴포넌트 */
function FlightCard({flight, isSelected, onSelect, onSeatChange, onRemove}) {
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
        onClick={() => onSelect(flight)}
        sx={{mr: 1}}>
        {isSelected ? '선택 해제' : '선택'}
      </Button>
      {isSelected && (
        <IconButton color="error" onClick={() => onRemove(flight._id)}>
          <CloseIcon />
        </IconButton>
      )}
    </Card>
  );
}

// 헬퍼 함수: 이미지 경로 정규화 (역슬래시 -> 슬래시, 앞에 '/' 추가)
const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

const PackageEdit = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // 패키지 기본 정보
  const [packageData, setPackageData] = useState({
    name: '',
    description: '',
    discountRate: 0,
    accommodations: [],
    tours: [],
    flights: [],
    images: []
  });
  // 기존 이미지 (서버에 저장된 파일 경로)
  const [existingImages, setExistingImages] = useState([]);

  // 선택 상태
  const [selectedAccommodations, setSelectedAccommodations] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]);

  // 옵션 데이터
  const [availableAccommodations, setAvailableAccommodations] = useState([]);
  const [availableTourTickets, setAvailableTourTickets] = useState([]);
  const [availableFlights, setAvailableFlights] = useState([]);

  // 새로 업로드할 이미지
  const [newImages, setNewImages] = useState([]);

  // 모달 상태
  const [openAccommodationModal, setOpenAccommodationModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  const [openFlightModal, setOpenFlightModal] = useState(false);
  const [currentAccommodation, setCurrentAccommodation] = useState(null);

  // 항공 검색/페이징
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightsPerPage = 5;

  // 서버 URL
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

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
      setPackageData({
        name: data.name,
        description: data.description,
        discountRate: data.discountRate ?? 0,
        accommodations: data.accommodations.map(a => a._id),
        tours: data.tours.map(t => t._id),
        flights: data.flights.map(f => ({
          flightId: f.flightId._id || f.flightId,
          seatsToUse: f.seatsToUse
        })),
        images: data.images || []
      });
      setExistingImages(data.images || []);
      setSelectedAccommodations(data.accommodations.map(a => a._id));
      setSelectedTourTickets(data.tours.map(t => t._id));
      setSelectedFlights(
        data.flights.map(f => ({
          flightId: f.flightId._id || f.flightId,
          seatsToUse: f.seatsToUse
        }))
      );
      // rooms는 서버 구조에 따라 달라질 수 있으므로 여기서는 빈 객체로 처리
      setSelectedRooms({});
    } catch (error) {
      console.error('패키지 조회 실패:', error);
    }
  };

  // -----------------------------
  // B) 선택 가능한 데이터 로드 (숙소, 투어, 항공)
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
  // C) 이미지 업로드 핸들러
  // -----------------------------
  const handleImageChange = e => {
    setNewImages([...newImages, ...Array.from(e.target.files)]);
  };

  const handleRemoveImage = index => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  // 기존 이미지 삭제 (미리보기에서 제거)
  const handleRemoveExistingImage = index => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // -----------------------------
  // D) 숙소 & 방 선택
  // -----------------------------
  const handleOpenAccommodationModal = () => {
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

  // 숙소 선택 -> 배열에 추가
  const handleSelectAccommodation = acc => {
    if (!selectedAccommodations.includes(acc._id)) {
      setSelectedAccommodations(prev => [...prev, acc._id]);
    }
    handleOpenRoomModal(acc);
  };

  // 방 선택 -> 한 호텔에서 여러 방
  const handleSelectRoom = (accId, roomId) => {
    setSelectedRooms(prev => {
      const existing = prev[accId] || [];
      if (!existing.includes(roomId)) {
        return {...prev, [accId]: [...existing, roomId]};
      }
      return prev;
    });
    handleCloseRoomModal();
  };

  // 숙소 취소 -> 해당 숙소와 방들 제거
  const handleRemoveAccommodation = accId => {
    setSelectedAccommodations(prev => prev.filter(id => id !== accId));
    setSelectedRooms(prev => {
      const newRooms = {...prev};
      delete newRooms[accId];
      return newRooms;
    });
  };

  // -----------------------------
  // E) 투어/티켓 선택
  // -----------------------------
  const [tempTourTickets, setTempTourTickets] = useState([...selectedTourTickets]);

  const handleOpenTourModal = () => {
    setTempTourTickets([...selectedTourTickets]);
    setOpenTourModal(true);
  };
  const handleCloseTourModal = () => {
    setSelectedTourTickets([...tempTourTickets]);
    setOpenTourModal(false);
  };
  const handleCancelTourModal = () => {
    setOpenTourModal(false);
  };
  const toggleTourTicketSelectionTemp = id => {
    setTempTourTickets(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  const handleRemoveTourTicket = id => {
    setSelectedTourTickets(prev => prev.filter(item => item !== id));
  };

  // -----------------------------
  // F) 항공 선택
  // -----------------------------
  const [tempFlights, setTempFlights] = useState([...selectedFlights]);
  const [tempSeatCounts, setTempSeatCounts] = useState({});

  const handleOpenFlightModal = () => {
    setTempFlights([...selectedFlights]);
    setTempSeatCounts(
      selectedFlights.reduce((acc, f) => ({...acc, [f.flightId]: f.seatsToUse}), {})
    );
    setOpenFlightModal(true);
  };
  const handleCloseFlightModal = () => {
    setSelectedFlights([...tempFlights]);
    setOpenFlightModal(false);
  };
  const handleCancelFlightModal = () => {
    setOpenFlightModal(false);
  };

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
  const handleFlightSeatChangeTemp = (flightId, value) => {
    setTempFlights(prev =>
      prev.map(f => (f.flightId === flightId ? {...f, seatsToUse: Number(value)} : f))
    );
  };
  const findSelectedFlightTemp = flightId =>
    tempFlights.find(f => f.flightId === flightId);

  // 항공 취소
  const handleRemoveFlight = flightId => {
    setSelectedFlights(prev => prev.filter(f => f.flightId !== flightId));
  };

  // 항공 검색/페이징
  const filteredFlights = availableFlights.filter(f => {
    const query = flightSearchQuery.toLowerCase();
    return (
      f.flightNumber.toLowerCase().includes(query) ||
      f.airline.toLowerCase().includes(query)
    );
  });
  const totalFlightPages = Math.ceil(filteredFlights.length / flightsPerPage);
  const paginatedFlights = filteredFlights.slice(
    (flightPage - 1) * flightsPerPage,
    flightPage * flightsPerPage
  );

  // -----------------------------
  // G) 패키지 수정 (FormData)
  // -----------------------------
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', packageData.name);
      formData.append('description', packageData.description);
      formData.append('discountRate', packageData.discountRate);
      formData.append('startDate', '2025-01-01');
      formData.append('endDate', '2025-12-31');
      formData.append('category', 'Tour Package');

      // 숙소: 각각 append
      selectedAccommodations.forEach(acc => {
        formData.append('accommodations', acc);
      });

      // rooms: JSON (객체)
      formData.append('rooms', JSON.stringify(selectedRooms));

      // 투어: 각각 append
      selectedTourTickets.forEach(tour => {
        formData.append('tours', tour);
      });

      // 항공: JSON (배열/객체)
      formData.append('flights', JSON.stringify(selectedFlights));

      // 기존 이미지: 각각 append
      existingImages.forEach(img => {
        formData.append('existingImages', img);
      });

      // 새 이미지: 각각 append
      newImages.forEach(file => {
        formData.append('images', file);
      });

      await updatePackage(id, formData);
      navigate('/packages');
    } catch (error) {
      console.error('패키지 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // H) 렌더링
  // -----------------------------
  return (
    <Container sx={{py: 4}}>
      <Typography variant="h4" sx={{mb: 3}}>
        패키지 수정
      </Typography>

      {/* 기존 이미지 미리보기 */}
      {existingImages.length > 0 && (
        <Box sx={{mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap'}}>
          {existingImages.map((img, idx) => (
            <Box key={idx} sx={{position: 'relative'}}>
              <img
                // 서버에서 넘어온 이미지 경로를 정규화해서 표시
                src={
                  normalizeImagePath(img).startsWith('/')
                    ? `${SERVER_URL}${normalizeImagePath(img)}`
                    : `${SERVER_URL}/${img}`
                }
                alt={`existing-${idx}`}
                style={{width: 100, height: 100, objectFit: 'cover', borderRadius: 4}}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveExistingImage(idx)}
                sx={{position: 'absolute', top: 0, right: 0}}>
                <CloseIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* 새 이미지 업로드 & 미리보기 */}
      <Typography variant="h6" sx={{mb: 1}}>
        새 이미지 업로드
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
      <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
        {newImages.map((file, idx) => {
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
                onClick={() => handleRemoveImage(idx)}
                sx={{position: 'absolute', top: 0, right: 0}}>
                <CloseIcon />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* 패키지 기본 정보 */}
      <TextField
        label="패키지명"
        fullWidth
        value={packageData.name}
        onChange={e => setPackageData({...packageData, name: e.target.value})}
        sx={{mb: 2}}
      />
      <TextField
        label="설명"
        fullWidth
        multiline
        rows={4}
        value={packageData.description}
        onChange={e => setPackageData({...packageData, description: e.target.value})}
        sx={{mb: 2}}
      />
      <TextField
        label="할인율 (%)"
        fullWidth
        type="number"
        value={packageData.discountRate === 0 ? '' : packageData.discountRate}
        onChange={e => {
          const val = Number(e.target.value);
          setPackageData({
            ...packageData,
            discountRate: isNaN(val) ? 0 : val
          });
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
                <Typography variant="body1" sx={{mr: 2}}>
                  {found.name}
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => handleRemoveAccommodation(accId)}>
                  취소
                </Button>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 선택된 방 (숙소별 여러 방) */}
      <Typography variant="h6" sx={{mt: 2}}>
        선택된 방
      </Typography>
      {Object.keys(selectedRooms).length === 0 ? (
        <Typography variant="body2" sx={{color: 'text.secondary'}}>
          선택된 방이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {Object.entries(selectedRooms).map(([accId, roomIds]) => {
            const foundAcc = availableAccommodations.find(a => a._id === accId);
            if (!foundAcc) return null;
            return roomIds.map(roomId => {
              const foundRoom = foundAcc.rooms?.find(r => r._id === roomId);
              if (!foundRoom) return null;
              const roomPrice = foundRoom.pricePerNight
                ? `${foundRoom.pricePerNight.toLocaleString()}원`
                : '가격 정보 없음';
              return (
                <Box
                  key={`${accId}-${roomId}`}
                  sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                  <Typography variant="body1" sx={{mr: 1}}>
                    {foundAcc.name} - {foundRoom.name} ({roomPrice})
                  </Typography>
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => {
                      setSelectedRooms(prev => {
                        const updated = {...prev};
                        updated[accId] = updated[accId].filter(id => id !== roomId);
                        if (updated[accId].length === 0) {
                          setSelectedAccommodations(prevAcc =>
                            prevAcc.filter(aid => aid !== accId)
                          );
                          delete updated[accId];
                        }
                        return updated;
                      });
                    }}>
                    취소
                  </Button>
                </Box>
              );
            });
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
              <Box key={tourId} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Typography variant="body1" sx={{mr: 2}}>
                  {foundTour.title} ({price})
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  onClick={() =>
                    setSelectedTourTickets(prev => prev.filter(id => id !== tourId))
                  }>
                  취소
                </Button>
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
            const totalFlightPrice = foundFlight.price * f.seatsToUse;
            const flightPrice = totalFlightPrice
              ? `${totalFlightPrice.toLocaleString()}원`
              : '0원';
            return (
              <Box key={idx} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Typography variant="body1" sx={{mr: 2}}>
                  {foundFlight.flightNumber} - {foundFlight.airline} ({flightPrice})
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => handleRemoveFlight(foundFlight._id)}>
                  취소
                </Button>
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
                  <ListItemButton onClick={() => handleSelectAccommodation(acc)}>
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
                const selected = tempFlights.find(f => f.flightId === flight._id);
                return (
                  <FlightCard
                    key={flight._id}
                    flight={flight}
                    isSelected={selected}
                    onSelect={toggleFlightSelectionTemp}
                    onSeatChange={handleFlightSeatChangeTemp}
                    onRemove={flightId => {
                      setTempFlights(prev => prev.filter(f => f.flightId !== flightId));
                    }}
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
                  {flightPage} / {totalFlightPages}
                </Typography>
                <Button
                  disabled={flightPage === totalFlightPages}
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
