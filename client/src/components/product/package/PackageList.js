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
 * 이미지 경로를 정규화
 * 역슬래시(\) → 슬래시(/), 맨 앞에 '/' 붙이기
 */
const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

/**
 * 투어·숙소(객실)·항공 가격 합산 후 할인율 적용
 * (상세 페이지와 동일한 로직)
 */
const computePackagePrice = pkg => {
  let totalTourPrice = 0;
  let totalRoomPrice = 0;
  let totalFlightPrice = 0;

  // 1) 투어 가격 합산
  if (Array.isArray(pkg.tours)) {
    totalTourPrice = pkg.tours.reduce((sum, tour) => sum + (tour.price || 0), 0);
  }

  // 2) 숙소(객실) 가격 합산
  if (Array.isArray(pkg.accommodations)) {
    totalRoomPrice = pkg.accommodations.reduce((acc, accommodation) => {
      if (!accommodation.rooms) return acc;
      const sumRooms = accommodation.rooms.reduce(
        (roomAcc, r) => roomAcc + (r.pricePerNight || 0),
        0
      );
      return acc + sumRooms;
    }, 0);
  }

  // 3) 항공 가격 합산
  if (Array.isArray(pkg.flights)) {
    totalFlightPrice = pkg.flights.reduce((acc, flightObj) => {
      const flightDoc = flightObj.flightId; // populate된 항공 문서
      if (!flightDoc) return acc;
      // seatsToUse * flightDoc.price 로 바꿀 수도 있음
      return acc + (flightDoc.price || 0);
    }, 0);
  }

  // 4) 합산
  const basePrice = totalTourPrice + totalRoomPrice + totalFlightPrice;

  // 5) 할인율 적용
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
    if (pkg.accommodations && pkg.accommodations.length > 0) {
      categories.push({label: '숙박/숙소', icon: <HotelIcon />});
    }
    if (pkg.tours && pkg.tours.length > 0) {
      categories.push({label: '투어/티켓', icon: <ConfirmationNumberIcon />});
    }
    return categories.slice(0, 3);
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
            {/* 패키지 목록을 세로로 배치 (Grid 대신 Box) */}
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
              {packages.map(pkg => {
                // 메인 이미지
                const mainImage =
                  pkg.images && pkg.images.length > 0
                    ? `${SERVER_URL}${normalizeImagePath(pkg.images[0])}`
                    : '/default-image.jpg';

                // 실제 합산 로직
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
                          ? `${pkg.description.substring(0, 80)}...`
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
