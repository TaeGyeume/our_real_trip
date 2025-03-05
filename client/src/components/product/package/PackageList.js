import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getPackages} from '../../../api/package/packageService';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  Pagination,
  Box,
  Chip,
  Stack
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import HotelIcon from '@mui/icons-material/Hotel';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * 이미지 경로 정규화 (\ → /, 맨 앞에 '/' 붙이기)
 */
const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

/**
 * 사용자가 실제 선택한 방 & 날짜 + 항공(좌석) + 투어 가격을 모두 합산 후 할인 적용
 */
const computePackagePrice = pkg => {
  let totalTourPrice = 0;
  let totalFlightPrice = 0;
  let totalRoomPrice = 0;

  // 1) 투어 가격
  if (Array.isArray(pkg.tours)) {
    totalTourPrice = pkg.tours.reduce((acc, t) => acc + (t.price || 0), 0);
  }

  // 2) 항공 가격 (좌석수 반영)
  if (Array.isArray(pkg.flights)) {
    totalFlightPrice = pkg.flights.reduce((acc, flightObj) => {
      if (!flightObj.flightId) return acc;
      const flightPrice = flightObj.flightId.price || 0;
      const seats = flightObj.seatsToUse || 0;
      return acc + flightPrice * seats;
    }, 0);
  }

  // 3) 객실 + 날짜 계산
  //    - roomIds 배열, startDates, endDates 모두 존재해야 함
  if (
    Array.isArray(pkg.accommodations) &&
    Array.isArray(pkg.roomIds) &&
    Array.isArray(pkg.startDates) &&
    Array.isArray(pkg.endDates)
  ) {
    // (A) 모든 방을 빠르게 찾을 수 있도록 {roomId -> roomPrice} 매핑
    //     또는 직접 find()를 돌려도 됨
    const roomPriceMap = {}; // { roomId(문자열): pricePerNight }
    pkg.accommodations.forEach(acc => {
      if (acc.rooms) {
        acc.rooms.forEach(r => {
          // _id가 Object라면 r._id.toString()으로 변환
          const roomKey = typeof r._id === 'object' ? r._id.toString() : r._id;
          roomPriceMap[roomKey] = r.pricePerNight || 0;
        });
      }
    });

    // (B) 각 roomId에 대해 숙박일수 계산
    for (let i = 0; i < pkg.roomIds.length; i++) {
      // roomIds[i]가 object 형태라면 문자열 변환
      let rid = pkg.roomIds[i];
      if (typeof rid === 'object' && rid.$oid) {
        rid = rid.$oid; // MongoDB { $oid: ... } 처리
      } else if (typeof rid !== 'string') {
        rid = rid.toString();
      }

      // startDates[i], endDates[i]도 string 또는 {$date: ...} 형태일 수 있음
      let startDateStr = pkg.startDates[i];
      let endDateStr = pkg.endDates[i];
      if (typeof startDateStr === 'object' && startDateStr.$date) {
        startDateStr = startDateStr.$date;
      }
      if (typeof endDateStr === 'object' && endDateStr.$date) {
        endDateStr = endDateStr.$date;
      }

      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        // 날짜가 유효하지 않으면 스킵
        continue;
      }

      const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

      const roomPricePerNight = roomPriceMap[rid] || 0;
      totalRoomPrice += roomPricePerNight * nights;
    }
  }

  // 4) 전체 가격 합산
  const basePrice = totalTourPrice + totalFlightPrice + totalRoomPrice;

  // 5) 할인율 반영
  const discountRate = pkg.discountRate || 0;
  const finalPrice = Math.round(basePrice - (basePrice * discountRate) / 100);

  return {basePrice, finalPrice};
};

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line
  }, [page]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPackages(page, 6, search);

      if (Array.isArray(data.packages)) {
        setPackages(data.packages);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('서버 응답이 올바르지 않음:', data);
        setError('서버 응답이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('패키지 목록 불러오기 실패:', err);
      setError('패키지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchPackages();
  };

  // 패키지에 포함된 항공/숙박/투어 여부 확인
  const getIncludedCategories = pkg => {
    const categories = [];
    if (pkg.flights && pkg.flights.length > 0) {
      categories.push({label: '항공', icon: <FlightTakeoffIcon />});
    }
    // 여기서 주의: 숙소를 accommodations로 보던 roomIds로 보던
    if (pkg.roomIds && pkg.roomIds.length > 0) {
      categories.push({label: '숙박/숙소', icon: <HotelIcon />});
    }
    if (pkg.tours && pkg.tours.length > 0) {
      categories.push({label: '투어/티켓', icon: <ConfirmationNumberIcon />});
    }
    return categories;
  };

  return (
    <Box sx={{minHeight: '100vh'}}>
      <Container sx={{maxWidth: '1000px'}}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{fontWeight: 'bold', textAlign: 'center', mt: 4}}>
          ✈️ 여행 패키지 검색
        </Typography>

        {/* 검색 바 */}
        <Box display="flex" gap={1} sx={{mb: 3, justifyContent: 'center'}}>
          <TextField
            label="여행지를 검색하세요..."
            variant="outlined"
            fullWidth
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{maxWidth: 400}}
          />
          <Button variant="contained" color="primary" onClick={handleSearch}>
            검색
          </Button>
        </Box>

        {/* 로딩/에러 처리 */}
        {loading ? (
          <Typography variant="h6" align="center">
            로딩 중...
          </Typography>
        ) : error ? (
          <Typography variant="h6" align="center" color="error">
            {error}
          </Typography>
        ) : packages.length === 0 ? (
          <Typography variant="h6" align="center">
            등록된 패키지가 없습니다.
          </Typography>
        ) : (
          <>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
              {packages.map(pkg => {
                // 메인 이미지
                const mainImage =
                  pkg.images && pkg.images.length > 0
                    ? SERVER_URL + normalizeImagePath(pkg.images[0])
                    : '/default-image.jpg';

                // 실제 합산 로직 (roomIds / flights(seatsToUse) / tours)
                const {basePrice, finalPrice} = computePackagePrice(pkg);

                return (
                  <Card
                    key={pkg._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      transition: '0.3s',
                      '&:hover': {boxShadow: 5}
                    }}
                    onClick={() => navigate(`/package/${pkg._id}`)}>
                    {/* 왼쪽 이미지 */}
                    <CardMedia
                      component="img"
                      sx={{width: 180, height: 120, borderRadius: 2}}
                      image={mainImage}
                      alt={`패키지 ${pkg.name}`}
                    />

                    {/* 오른쪽 텍스트 정보 */}
                    <CardContent sx={{flex: 1, pl: 2}}>
                      <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                        {pkg.name}
                      </Typography>

                      {/* 포함된 서비스 표시 */}
                      <Stack direction="row" spacing={1} sx={{mt: 1, mb: 1}}>
                        {getIncludedCategories(pkg).map((category, index) => (
                          <Chip
                            key={index}
                            icon={category.icon}
                            label={category.label}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>

                      {/* 간단한 설명 */}
                      <Typography variant="body2" color="text.secondary">
                        {pkg.description.length > 80
                          ? pkg.description.substring(0, 80) + '...'
                          : pkg.description}
                      </Typography>

                      {/* 가격 정보 */}
                      <Box display="flex" alignItems="center" gap={1} sx={{mt: 1}}>
                        {pkg.discountRate > 0 ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{textDecoration: 'line-through', color: 'gray'}}>
                              {basePrice.toLocaleString()}원
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{fontWeight: 'bold', color: 'red'}}>
                              {finalPrice.toLocaleString()}원
                            </Typography>
                            <Typography variant="caption" sx={{color: 'blue'}}>
                              ({pkg.discountRate}% 할인)
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                            {finalPrice.toLocaleString()}원
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {/* 페이지네이션 */}
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              sx={{mt: 4, display: 'flex', justifyContent: 'center'}}
            />
          </>
        )}
      </Container>
    </Box>
  );
};

export default PackageList;
