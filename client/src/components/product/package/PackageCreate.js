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
import authAPI from '../../../api/auth/auth'; // authAPI 가져오기

// API
import {createPackage, getCreatePackageData} from '../../../api/package/packageService';

// 항공사 로고 예시 (원하는 이미지 경로로 수정)
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
function FlightCard({flight, isSelected, onSelect, onSeatChange}) {
  // 항공사 로고
  const logoSrc = AIRLINE_LOGOS[flight.airline] || '/images/logos/default.png';

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
        <Typography variant="h6" component="div" gutterBottom>
          {flight.flightNumber} - {flight.airline}
        </Typography>
        <Typography variant="body2" component="div" color="text.secondary">
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

const PackageCreate = () => {
  const navigate = useNavigate();

  // 1) API에서 불러올 상품들 (숙소, 투어/티켓, 항공)
  const [accommodations, setAccommodations] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  const [flights, setFlights] = useState([]);

  // 2) 선택 상태
  const [selectedAccommodations, setSelectedAccommodations] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [selectedTourTickets, setSelectedTourTickets] = useState([]);
  const [selectedFlights, setSelectedFlights] = useState([]);

  // 3) 패키지 기본 정보
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [packageQuantity, setPackageQuantity] = useState(1);

  // ✅ 이미지 업로드용 (미리보기 & 제거 가능)
  const [packageImages, setPackageImages] = useState([]);

  const [loading, setLoading] = useState(false);

  // 모달 열림/닫힘 상태
  const [openAccommodationModal, setOpenAccommodationModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  const [openFlightModal, setOpenFlightModal] = useState(false);

  // 현재 선택 중인 숙소(방 모달용)
  const [currentAccommodation, setCurrentAccommodation] = useState(null);

  // 항공 검색/페이징
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightsPerPage = 5;

  // ------------------------------
  // A) 데이터 로드
  // ------------------------------
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

  // ------------------------------
  // B) 이미지 업로드 핸들러
  // ------------------------------
  const handleImageChange = e => {
    // 새로 선택한 파일들을 state에 추가
    setPackageImages([...packageImages, ...Array.from(e.target.files)]);
  };

  // ✅ 이미지 미리보기 제거
  const handleRemoveImage = index => {
    setPackageImages(prev => prev.filter((_, i) => i !== index));
  };

  // ------------------------------
  // C) 모달 열기/닫기
  // ------------------------------
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

  // ------------------------------
  // D) 숙소 & 방 선택 로직
  // ------------------------------
  /** 숙소 클릭 시 -> 방 모달 오픈 (숙소만 선택 불가) */
  const handleSelectAccommodation = acc => {
    setCurrentAccommodation(acc);
    setOpenRoomModal(true);
  };

  /** 방 선택 -> 숙소 & 방 모두 선택 처리 */
  const handleSelectRoom = (accId, roomId) => {
    // 1) 방 ID 저장
    setSelectedRooms(prev => ({...prev, [accId]: roomId}));
    // 2) 숙소 배열에도 추가 (중복 방지)
    setSelectedAccommodations(prev => (prev.includes(accId) ? prev : [...prev, accId]));
    setOpenRoomModal(false);
  };

  // ✅ 숙소(및 해당 방) 선택 해제
  const handleRemoveAccommodation = accId => {
    // 1) 숙소 배열에서 제거
    setSelectedAccommodations(prev => prev.filter(id => id !== accId));
    // 2) 방도 함께 제거
    setSelectedRooms(prev => {
      const newRooms = {...prev};
      delete newRooms[accId];
      return newRooms;
    });
  };

  // ------------------------------
  // E) 투어/티켓 선택 로직
  // ------------------------------
  const toggleTourTicketSelection = id => {
    setSelectedTourTickets(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // ------------------------------
  // F) 항공 선택 & 좌석 수 변경
  // ------------------------------
  const toggleFlightSelection = flight => {
    const exists = selectedFlights.find(f => f.flightId === flight._id);
    if (exists) {
      // 이미 선택된 항공이면 해제
      setSelectedFlights(prev => prev.filter(f => f.flightId !== flight._id));
    } else {
      // 새로 선택 (flight._id는 문자열로 전달됨)
      setSelectedFlights(prev => [...prev, {flightId: flight._id, seatsToUse: 1}]);
    }
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
  const totalPages = Math.ceil(filteredFlights.length / flightsPerPage);
  const paginatedFlights = filteredFlights.slice(
    (flightPage - 1) * flightsPerPage,
    flightPage * flightsPerPage
  );

  /** 이미 선택된 항공인지 체크 */
  const findSelectedFlight = flightId =>
    selectedFlights.find(f => f.flightId === flightId);

  // ------------------------------
  // G) 패키지 생성 (FormData 사용)
  // ------------------------------
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // 현재 로그인한 사용자 정보 가져오기
      const userProfile = await authAPI.getUserProfile();
      if (!userProfile || !userProfile._id) {
        console.error(' [ERROR] 로그인된 사용자 정보를 가져올 수 없습니다.');
        setLoading(false);
        return;
      }

      // 1) FormData 생성
      const formData = new FormData();
      formData.append('name', packageName);
      formData.append('description', packageDescription);
      formData.append('discountRate', discountRate);
      formData.append('startDate', '2025-01-01');
      formData.append('endDate', '2025-12-31');
      formData.append('category', 'Tour Package');
      formData.append('createdBy', userProfile._id);

      // 배열/객체 필드는 JSON 문자열로 담는다.
      formData.append('accommodations', JSON.stringify(selectedAccommodations));
      formData.append('rooms', JSON.stringify(selectedRooms));
      formData.append('tours', JSON.stringify(selectedTourTickets));
      formData.append('flights', JSON.stringify(selectedFlights));

      // 2) 이미지 파일들 추가
      packageImages.forEach(file => {
        formData.append('images', file);
      });

      // 3) API 호출
      await createPackage(formData);
      navigate('/packages');
    } catch (error) {
      console.error('패키지 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // H) 렌더링: 선택된 상품들 "세로 목록"으로 표시
  // ------------------------------
  return (
    <Container sx={{py: 4}}>
      <Typography variant="h4" sx={{mb: 3}}>
        패키지 생성
      </Typography>

      {/* 패키지 이미지 업로드 */}
      <Typography variant="h6" component="div" sx={{mb: 1}}>
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

      {/* 미리보기 목록 */}
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
                onClick={() => handleRemoveImage(idx)}
                sx={{position: 'absolute', top: 0, right: 0}}>
                <CloseIcon />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* 패키지 기본 정보 */}
      <Typography variant="h6" component="div" sx={{mb: 1}}>
        패키지명
      </Typography>
      <TextField
        label="패키지명"
        fullWidth
        value={packageName}
        onChange={e => setPackageName(e.target.value)}
        sx={{mb: 2}}
      />

      <Typography variant="h6" component="div" sx={{mb: 1}}>
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

      <Typography variant="h6" component="div" sx={{mb: 1}}>
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

      {/* 숙소 & 방 선택 */}
      <Button variant="outlined" onClick={handleOpenAccommodationModal} sx={{mb: 1}}>
        숙소 및 방 선택
      </Button>

      {/* (1) 선택된 숙소 세로 목록 */}
      <Typography variant="h6" component="div" sx={{mt: 2}}>
        선택된 숙소
      </Typography>
      {selectedAccommodations.length === 0 ? (
        <Typography variant="body2" component="div" sx={{color: 'text.secondary'}}>
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
              : '가격 없음';
            return (
              <Box key={accId} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Avatar
                  src={imgUrl}
                  alt={found.name}
                  variant="square"
                  sx={{width: 40, height: 40, mr: 1}}
                />
                <Typography variant="body1" component="div" sx={{mr: 2}}>
                  {found.name} ({price})
                </Typography>
                {/* ✅ 숙소 취소 버튼 */}
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

      {/* (2) 선택된 방 세로 목록 */}
      <Typography variant="h6" component="div" sx={{mt: 2}}>
        선택된 방
      </Typography>
      {Object.keys(selectedRooms).length === 0 ? (
        <Typography variant="body2" component="div" sx={{color: 'text.secondary'}}>
          선택된 방이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {Object.entries(selectedRooms).map(([accId, roomId]) => {
            const foundAcc = accommodations.find(a => a._id === accId);
            const foundRoom = foundAcc?.rooms?.find(r => r._id === roomId);
            if (!foundAcc || !foundRoom) {
              return (
                <Typography key={`${accId}-${roomId}`} component="div">
                  {accId}:{roomId}
                </Typography>
              );
            }
            const roomPrice = foundRoom.pricePerNight
              ? `${foundRoom.pricePerNight.toLocaleString()}원`
              : '가격 정보 없음';

            return (
              <Box
                key={`${accId}-${roomId}`}
                sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Typography variant="body1" component="div" sx={{mr: 1}}>
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

      {/* (3) 선택된 투어/티켓 세로 목록 */}
      <Typography variant="h6" component="div" sx={{mt: 2}}>
        선택된 투어/티켓
      </Typography>
      {selectedTourTickets.length === 0 ? (
        <Typography variant="body2" component="div" sx={{color: 'text.secondary'}}>
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
                <Typography variant="body1" component="div">
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

      {/* (4) 선택된 항공 세로 목록 */}
      <Typography variant="h6" component="div" sx={{mt: 2}}>
        선택된 항공
      </Typography>
      {selectedFlights.length === 0 ? (
        <Typography variant="body2" component="div" sx={{color: 'text.secondary'}}>
          선택된 항공이 없습니다.
        </Typography>
      ) : (
        <Box sx={{mt: 1}}>
          {selectedFlights.map((f, idx) => {
            const foundFlight = flights.find(fl => fl._id === f.flightId);
            if (!foundFlight) {
              return (
                <Typography key={idx} component="div">
                  {f.flightId} - (데이터 없음)
                </Typography>
              );
            }
            const flightDate = foundFlight.departureDate || '날짜 정보 없음';
            const flightPrice = foundFlight.price
              ? `${foundFlight.price.toLocaleString()}원`
              : '0원';
            return (
              <Box key={idx} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                <Typography variant="body1" component="div">
                  {foundFlight.flightNumber} - {foundFlight.airline} ({flightPrice}) /{' '}
                  {flightDate}
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
        fullWidth
        disableEnforceFocus
        disableRestoreFocus>
        <DialogTitle>숙소 목록</DialogTitle>
        <DialogContent>
          {accommodations.length > 0 ? (
            <List>
              {accommodations.map(acc => (
                <ListItem disablePadding key={acc._id}>
                  <ListItemButton onClick={() => handleSelectAccommodation(acc)}>
                    {/* 숙소 이미지 */}
                    <ListItemAvatar>
                      <Avatar
                        src={acc.images?.[0] || ''}
                        alt={acc.name}
                        variant="square"
                        sx={{width: 60, height: 60, mr: 1}}
                      />
                    </ListItemAvatar>

                    {/* 숙소 정보 (이름 / 가격) */}
                    <ListItemText
                      primaryTypographyProps={{component: 'span'}}
                      secondaryTypographyProps={{component: 'span'}}
                      primary={`${acc.name} ${
                        acc.minPrice
                          ? `- ${acc.minPrice.toLocaleString()}원`
                          : '- 가격 정보 없음'
                      }`}
                      secondary={acc.description || '상세 설명이 없습니다.'}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography component="div">숙소 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccommodationModal}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 방 선택 모달 */}
      <Dialog
        open={openRoomModal}
        onClose={handleCloseRoomModal}
        fullWidth
        disableEnforceFocus
        disableRestoreFocus>
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
                    primaryTypographyProps={{component: 'span'}}
                    secondaryTypographyProps={{component: 'span'}}
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
            <Typography sx={{color: 'text.secondary'}} component="div">
              선택 가능한 방이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoomModal}>취소</Button>
        </DialogActions>
      </Dialog>

      {/* 투어/티켓 선택 모달 */}
      <Dialog
        open={openTourModal}
        onClose={handleCloseTourModal}
        fullWidth
        disableEnforceFocus
        disableRestoreFocus>
        <DialogTitle>투어/티켓 선택</DialogTitle>
        <DialogContent>
          {tourTickets.length > 0 ? (
            <List>
              {tourTickets.map(ticket => (
                <ListItemButton
                  key={ticket._id}
                  onClick={() => {
                    toggleTourTicketSelection(ticket._id);
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
                    control={
                      <Checkbox checked={selectedTourTickets.includes(ticket._id)} />
                    }
                    label={
                      ticket.title +
                      (ticket.price ? ` - ${ticket.price.toLocaleString()}원` : '')
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography component="div">투어 티켓 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTourModal}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 항공 선택 모달 */}
      <Dialog
        open={openFlightModal}
        onClose={handleCloseFlightModal}
        fullWidth
        disableEnforceFocus
        disableRestoreFocus>
        <DialogTitle>항공 선택</DialogTitle>
        <DialogContent>
          {/* 항공 검색 */}
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

          {/* 항공 카드 목록 */}
          {flights.length > 0 ? (
            <>
              {paginatedFlights.map(flight => {
                const selected = findSelectedFlight(flight._id);
                return (
                  <FlightCard
                    key={flight._id}
                    flight={flight}
                    isSelected={selected}
                    onSelect={toggleFlightSelection}
                    onSeatChange={handleFlightSeatChange}
                  />
                );
              })}

              {/* 페이징 */}
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
            <Typography component="div">항공 데이터가 없습니다.</Typography>
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
