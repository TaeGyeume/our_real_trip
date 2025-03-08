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

/** 항공편 카드 */
function FlightCard({flight, isSelected, onSelect, onSeatChange, onRemove}) {
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

// 서버 이미지 경로 정규화
const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

export default function PackageEdit() {
  const {id} = useParams();
  const navigate = useNavigate();

  // const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

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
  const [existingImages, setExistingImages] = useState([]); // 서버에 이미 있는 이미지

  // 숙소 / 투어 / 항공 선택
  const [selectedAccommodations, setSelectedAccommodations] = useState([]);
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]);

  // 방+날짜 정보: { roomId: { start, end } }
  const [selectedRoomDates, setSelectedRoomDates] = useState({});

  // 모달 열림/닫힘
  const [openAccommodationModal, setOpenAccommodationModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  const [openFlightModal, setOpenFlightModal] = useState(false);
  const [currentAccommodation, setCurrentAccommodation] = useState(null);

  // 새로 업로드할 이미지들
  const [newImages, setNewImages] = useState([]);

  // 선택 가능한 옵션 (숙소, 투어, 항공)
  const [availableAccommodations, setAvailableAccommodations] = useState([]);
  const [availableTourTickets, setAvailableTourTickets] = useState([]);
  const [availableFlights, setAvailableFlights] = useState([]);

  // 항공 검색/페이징
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightsPerPage = 5;

  // ------------------------------
  // 1) 패키지 상세 & 옵션 데이터 로드
  // ------------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        // (A) 패키지 상세 조회
        const pkg = await getPackageById(id);

        // 기본 정보 세팅
        setPackageData({
          name: pkg.name,
          description: pkg.description,
          discountRate: pkg.discountRate ?? 0,
          accommodations: pkg.accommodations.map(a => a._id),
          tours: pkg.tours.map(t => t._id),
          flights: pkg.flights.map(f => ({
            flightId: f.flightId._id || f.flightId,
            seatsToUse: f.seatsToUse
          })),
          images: pkg.images || []
        });
        setExistingImages(pkg.images || []);

        // 숙소/투어/항공 (선택 상태)
        setSelectedAccommodations(pkg.accommodations.map(a => a._id));
        setSelectedTourTickets(pkg.tours.map(t => t._id));
        setSelectedFlights(
          pkg.flights.map(f => ({
            flightId: f.flightId._id || f.flightId,
            seatsToUse: f.seatsToUse
          }))
        );

        // 방+날짜 (roomIds, startDates, endDates)
        // pkg.roomIds, pkg.startDates, pkg.endDates 가 모두 배열
        if (pkg.roomIds && pkg.startDates && pkg.endDates) {
          const roomDateObj = {};
          pkg.roomIds.forEach((roomIdValue, idx) => {
            // roomIdValue가 { $oid: '...' } 형태이거나, 그냥 string일 수 있음
            const rid =
              typeof roomIdValue === 'object' && roomIdValue.$oid
                ? roomIdValue.$oid
                : roomIdValue.toString();

            const startObj = pkg.startDates[idx];
            const endObj = pkg.endDates[idx];

            // 문자열 형태("2025-03-05T00:00:00.000Z")인지, { $date: ... }인지 구분해서 처리
            let startDateStr = '';
            if (typeof startObj === 'string') {
              startDateStr = new Date(startObj).toISOString().slice(0, 10);
            } else if (startObj && startObj.$date) {
              startDateStr = new Date(startObj.$date).toISOString().slice(0, 10);
            }

            let endDateStr = '';
            if (typeof endObj === 'string') {
              endDateStr = new Date(endObj).toISOString().slice(0, 10);
            } else if (endObj && endObj.$date) {
              endDateStr = new Date(endObj.$date).toISOString().slice(0, 10);
            }

            // 최종적으로 state에 저장
            roomDateObj[rid] = {
              start: startDateStr,
              end: endDateStr
            };
          });
          setSelectedRoomDates(roomDateObj);
        }

        // (B) 생성용 옵션 데이터 (숙소, 투어, 항공)
        const createData = await getCreatePackageData();
        setAvailableAccommodations(createData.accommodations);
        setAvailableTourTickets(createData.tourTickets);
        setAvailableFlights(createData.flights);
      } catch (err) {
        console.error('패키지 데이터 로드 실패:', err);
      }
    }
    fetchData();
  }, [id]);

  // ------------------------------
  // 2) 이미지 핸들러
  // ------------------------------
  const handleImageChange = e => {
    setNewImages([...newImages, ...Array.from(e.target.files)]);
  };
  const handleRemoveImage = index => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };
  const handleRemoveExistingImage = idx => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  // ------------------------------
  // 3) 숙소 & 방 선택
  // ------------------------------
  const handleOpenAccommodationModal = () => setOpenAccommodationModal(true);
  const handleCloseAccommodationModal = () => setOpenAccommodationModal(false);

  const handleOpenRoomModal = acc => {
    setCurrentAccommodation(acc);
    setOpenRoomModal(true);
  };
  const handleCloseRoomModal = () => setOpenRoomModal(false);

  // 숙소 클릭 시 (숙소 추가 & 방 모달 열기)
  const handleSelectAccommodation = acc => {
    if (!selectedAccommodations.includes(acc._id)) {
      setSelectedAccommodations(prev => [...prev, acc._id]);
    }
    handleOpenRoomModal(acc);
  };

  // 숙소 취소
  const handleRemoveAccommodation = accId => {
    setSelectedAccommodations(prev => prev.filter(id => id !== accId));
    // 해당 숙소의 방이 이미 선택되어 있으면 모두 제거
    const foundAcc = availableAccommodations.find(a => a._id === accId);
    if (foundAcc && foundAcc.rooms) {
      foundAcc.rooms.forEach(rm => {
        const rmid = rm._id;
        setSelectedRoomDates(prev => {
          const newObj = {...prev};
          delete newObj[rmid];
          return newObj;
        });
      });
    }
  };

  // 방 선택
  const handleSelectRoom = (accId, room) => {
    const roomId = room._id;
    // 이미 등록되어 있지 않다면 날짜 초기화
    if (!selectedRoomDates[roomId]) {
      setSelectedRoomDates(prev => ({
        ...prev,
        [roomId]: {start: '', end: ''}
      }));
    }
    handleCloseRoomModal();
  };

  // 날짜 변경
  const handleRoomDateChange = (roomId, field, value) => {
    setSelectedRoomDates(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value
      }
    }));
  };

  // 방 취소
  const handleRemoveRoom = roomId => {
    setSelectedRoomDates(prev => {
      const newObj = {...prev};
      delete newObj[roomId];
      return newObj;
    });
  };

  // ------------------------------
  // 4) 투어/티켓
  // ------------------------------
  const [tempTourTickets, setTempTourTickets] = useState([]);

  const handleOpenTourModal = () => {
    // 모달 열기 전, 임시 배열에 현재 선택값 복사
    setTempTourTickets([...selectedTourTickets]);
    setOpenTourModal(true);
  };
  const handleCancelTourModal = () => setOpenTourModal(false);

  // 모달 "확인" 누를 때 최종 반영
  const handleCloseTourModal = () => {
    setSelectedTourTickets([...tempTourTickets]);
    setOpenTourModal(false);
  };

  // ------------------------------
  // 5) 항공
  // ------------------------------
  const [tempFlights, setTempFlights] = useState([]);

  const handleOpenFlightModal = () => {
    // 모달 열기 전, 임시 배열에 현재 선택값 복사
    setTempFlights([...selectedFlights]);
    setOpenFlightModal(true);
  };
  const handleCancelFlightModal = () => setOpenFlightModal(false);

  const handleCloseFlightModal = () => {
    setSelectedFlights([...tempFlights]);
    setOpenFlightModal(false);
  };

  const toggleFlightSelectionTemp = flight => {
    setTempFlights(prev => {
      const exists = prev.find(f => f.flightId === flight._id);
      if (exists) {
        // 이미 있으면 제거
        return prev.filter(f => f.flightId !== flight._id);
      } else {
        // 없으면 추가 (초기 seatsToUse = 1)
        return [...prev, {flightId: flight._id, seatsToUse: 1}];
      }
    });
  };

  // 좌석 수 변경
  const handleFlightSeatChangeTemp = (flightId, value) => {
    setTempFlights(prev =>
      prev.map(f => (f.flightId === flightId ? {...f, seatsToUse: Number(value)} : f))
    );
  };

  // 선택된 항공 중 해당 ID 찾기
  const findSelectedFlightTemp = flightId =>
    tempFlights.find(f => f.flightId === flightId);

  // 항공 취소
  const handleRemoveFlight = flightId => {
    setSelectedFlights(prev => prev.filter(f => f.flightId !== flightId));
  };

  // 항공 검색 & 페이징
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

  // ------------------------------
  // 6) 패키지 수정하기
  // ------------------------------
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      // 기본 정보
      formData.append('name', packageData.name);
      formData.append('description', packageData.description);
      formData.append('discountRate', packageData.discountRate);
      formData.append('startDate', '2025-01-01');
      formData.append('endDate', '2025-12-31');
      formData.append('category', 'Tour Package');

      // 숙소
      selectedAccommodations.forEach(aid => {
        formData.append('accommodations', aid);
      });

      // 투어
      selectedTourTickets.forEach(tid => {
        formData.append('tours', tid);
      });

      // 항공(JSON으로 직렬화)
      formData.append('flights', JSON.stringify(selectedFlights));

      // 방+날짜 -> roomIds, startDates, endDates
      const roomIdList = [];
      const startList = [];
      const endList = [];
      Object.entries(selectedRoomDates).forEach(([rId, dateObj]) => {
        roomIdList.push(rId);
        startList.push(dateObj.start || '');
        endList.push(dateObj.end || '');
      });
      formData.append('roomIds', JSON.stringify(roomIdList));
      formData.append('startDates', JSON.stringify(startList));
      formData.append('endDates', JSON.stringify(endList));

      // 기존 이미지
      existingImages.forEach(img => {
        formData.append('existingImages', img);
      });

      // 새 이미지
      newImages.forEach(file => {
        formData.append('images', file);
      });

      // 실제 수정 API 호출
      await updatePackage(id, formData);
      // 수정 성공 후 목록 페이지 등으로 이동
      navigate('/packages');
    } catch (err) {
      console.error('패키지 수정 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // 렌더링
  // ------------------------------
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
                src={
                  normalizeImagePath(img).startsWith('/')
                    ? SERVER_URL + normalizeImagePath(img)
                    : SERVER_URL + '/' + img
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
          setPackageData({...packageData, discountRate: isNaN(val) ? 0 : val});
        }}
        sx={{mb: 3}}
      />

      {/* 숙소 & 방 */}
      <Button variant="outlined" sx={{mb: 1}} onClick={handleOpenAccommodationModal}>
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
            const foundAcc = availableAccommodations.find(a => a._id === accId);
            if (!foundAcc) {
              return (
                <Typography key={accId} color="text.secondary">
                  {accId} (데이터 없음)
                </Typography>
              );
            }
            return (
              <Box key={accId} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Avatar
                  src={foundAcc.images?.[0] || ''}
                  alt={foundAcc.name}
                  variant="square"
                  sx={{width: 40, height: 40, mr: 1}}
                />
                <Typography sx={{mr: 2}}>{foundAcc.name}</Typography>
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

      {/* 방+날짜 */}
      <Typography variant="h6" sx={{mt: 2}}>
        선택된 방 (예약 날짜 입력)
      </Typography>
      {Object.keys(selectedRoomDates).length === 0 ? (
        <Typography variant="body2" sx={{color: 'text.secondary'}}>
          선택된 방이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {Object.entries(selectedRoomDates).map(([rId, dateObj]) => {
            // 어떤 숙소에 속한 방인지 찾기
            let foundAcc, foundRoom;
            for (const acc of availableAccommodations) {
              if (acc.rooms) {
                const rm = acc.rooms.find(r => r._id === rId);
                if (rm) {
                  foundAcc = acc;
                  foundRoom = rm;
                  break;
                }
              }
            }
            if (!foundRoom) {
              return (
                <Box key={rId} sx={{mb: 1}}>
                  방ID {rId} (데이터 없음)
                </Box>
              );
            }
            const priceText = foundRoom.pricePerNight
              ? `${foundRoom.pricePerNight.toLocaleString()}원`
              : '가격 정보 없음';

            return (
              <Box key={rId} sx={{mb: 2}}>
                <Typography variant="body1" sx={{fontWeight: 'bold', mb: 1}}>
                  {foundAcc?.name} - {foundRoom.name} ({priceText}/1박)
                </Typography>
                <Box sx={{display: 'flex', gap: 2, alignItems: 'center'}}>
                  <TextField
                    label="체크인"
                    type="date"
                    value={dateObj.start}
                    onChange={e => handleRoomDateChange(rId, 'start', e.target.value)}
                    InputLabelProps={{shrink: true}}
                    sx={{width: 180}}
                  />
                  <TextField
                    label="체크아웃"
                    type="date"
                    value={dateObj.end}
                    onChange={e => handleRoomDateChange(rId, 'end', e.target.value)}
                    InputLabelProps={{shrink: true}}
                    sx={{width: 180}}
                  />
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => handleRemoveRoom(rId)}>
                    취소
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 투어/티켓 */}
      <Button variant="outlined" sx={{mt: 2}} onClick={handleOpenTourModal}>
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
          {selectedTourTickets.map(tid => {
            const foundTour = availableTourTickets.find(t => t._id === tid);
            if (!foundTour) {
              return (
                <Typography key={tid} color="text.secondary">
                  {tid} (데이터 없음)
                </Typography>
              );
            }
            const priceText = foundTour.price
              ? `${foundTour.price.toLocaleString()}원`
              : '가격 정보 없음';

            return (
              <Box key={tid} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Typography sx={{mr: 2}}>
                  {foundTour.title} ({priceText})
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  onClick={() =>
                    setSelectedTourTickets(prev => prev.filter(id => id !== tid))
                  }>
                  취소
                </Button>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 항공 */}
      <Button variant="outlined" sx={{mt: 2}} onClick={handleOpenFlightModal}>
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
              return (
                <Typography key={idx} color="text.secondary">
                  {f.flightId} - (데이터 없음)
                </Typography>
              );
            }
            const totalPrice = foundFlight.price * f.seatsToUse;
            return (
              <Box key={idx} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Typography sx={{mr: 2}}>
                  {foundFlight.flightNumber} ({foundFlight.airline}) -{' '}
                  {totalPrice.toLocaleString()}원 (좌석 {f.seatsToUse})
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
        disabled={loading}
        onClick={handleUpdate}
        sx={{mt: 3}}>
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
              {currentAccommodation.rooms.map(room => {
                const roomPriceText = room.pricePerNight
                  ? `${room.pricePerNight.toLocaleString()}원`
                  : '가격 정보 없음';
                return (
                  <ListItemButton
                    key={room._id}
                    onClick={() => handleSelectRoom(currentAccommodation._id, room)}>
                    <ListItemText primary={room.name} secondary={roomPriceText} />
                  </ListItemButton>
                );
              })}
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
              {availableTourTickets.map(ticket => {
                const isSelected = tempTourTickets.includes(ticket._id);
                const priceText = ticket.price
                  ? `${ticket.price.toLocaleString()}원`
                  : '가격 정보 없음';

                return (
                  <ListItemButton
                    key={ticket._id}
                    onClick={() => {
                      // 체크박스 토글처럼 동작
                      if (isSelected) {
                        setTempTourTickets(prev => prev.filter(id => id !== ticket._id));
                      } else {
                        setTempTourTickets(prev => [...prev, ticket._id]);
                      }
                    }}>
                    <ListItemAvatar>
                      <Avatar
                        src={ticket.images?.[0] || ''}
                        alt={ticket.title}
                        variant="square"
                        sx={{width: 60, height: 60, mr: 1}}
                      />
                    </ListItemAvatar>
                    <FormControlLabel
                      control={<Checkbox checked={isSelected} />}
                      label={`${ticket.title} (${priceText})`}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          ) : (
            <Typography>투어 티켓 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelTourModal}>취소</Button>
          <Button
            onClick={() => {
              // 최종 반영
              setSelectedTourTickets([...tempTourTickets]);
              setOpenTourModal(false);
            }}>
            확인
          </Button>
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
                      setTempFlights(prev => prev.filter(x => x.flightId !== flightId));
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
          <Button
            onClick={() => {
              // 모달 "확인" 누르면 최종 반영
              setSelectedFlights([...tempFlights]);
              setOpenFlightModal(false);
            }}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
