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
  Box,
  Chip,
  Stack,
  Grid,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';

import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import HotelIcon from '@mui/icons-material/Hotel';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AdSlider from './AdSlider';

// 서버 URL
const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ourrealtrip.shop/api';

// 이미지 경로 정규화
const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

// 가격 계산
const computePackagePrice = pkg => {
  let totalTourPrice = 0;
  let totalFlightPrice = 0;
  let totalRoomPrice = 0;

  if (Array.isArray(pkg.tours)) {
    totalTourPrice = pkg.tours.reduce((acc, t) => acc + (t.price || 0), 0);
  }

  if (Array.isArray(pkg.flights)) {
    totalFlightPrice = pkg.flights.reduce((acc, flightObj) => {
      if (!flightObj.flightId) return acc;
      const flightPrice = flightObj.flightId.price || 0;
      const seats = flightObj.seatsToUse || 0;
      return acc + flightPrice * seats;
    }, 0);
  }

  if (
    Array.isArray(pkg.accommodations) &&
    Array.isArray(pkg.roomIds) &&
    Array.isArray(pkg.startDates) &&
    Array.isArray(pkg.endDates)
  ) {
    const roomPriceMap = {};
    pkg.accommodations.forEach(acc => {
      if (acc.rooms) {
        acc.rooms.forEach(r => {
          const roomKey = typeof r._id === 'object' ? r._id.toString() : r._id;
          roomPriceMap[roomKey] = r.pricePerNight || 0;
        });
      }
    });

    for (let i = 0; i < pkg.roomIds.length; i++) {
      let rid = pkg.roomIds[i];
      if (typeof rid === 'object' && rid.$oid) {
        rid = rid.$oid;
      } else if (typeof rid !== 'string') {
        rid = rid.toString();
      }

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
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const roomPricePerNight = roomPriceMap[rid] || 0;
      totalRoomPrice += roomPricePerNight * nights;
    }
  }

  const basePrice = totalTourPrice + totalFlightPrice + totalRoomPrice;
  const discountRate = pkg.discountRate || 0;
  const finalPrice = Math.round(basePrice - (basePrice * discountRate) / 100);

  return {basePrice, finalPrice};
};

export default function PackageList() {
  // 1) 사용자 입력 상태 (텍스트필드에서 입력 중)
  const [searchInput, setSearchInput] = useState('');
  // 2) 실제 서버에 보내는 검색어 (검색 버튼을 눌렀을 때만 갱신)
  const [searchQuery, setSearchQuery] = useState('');

  // 나머지 상태들
  const [allPackages, setAllPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 무한 스크롤
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 필터
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [includeFlight, setIncludeFlight] = useState(false);
  const [includeTour, setIncludeTour] = useState(false);
  const [includeAccommodation, setIncludeAccommodation] = useState(false);
  const [discountMin, setDiscountMin] = useState(0);

  const navigate = useNavigate();

  // 서버에서 패키지 목록 불러오기
  const fetchPackages = async pageNum => {
    try {
      setLoading(true);
      setError(null);

      // searchQuery를 사용해서 API 호출
      const data = await getPackages(pageNum, 6, searchQuery);

      if (Array.isArray(data.packages)) {
        if (pageNum === 1) {
          // 새로 세팅
          setAllPackages(data.packages);
        } else {
          // 이어붙이기
          setAllPackages(prev => [...prev, ...data.packages]);
        }
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

  // page, searchQuery가 바뀔 때만 fetch
  useEffect(() => {
    fetchPackages(page);
    // eslint-disable-next-line
  }, [page, searchQuery]);

  // 무한 스크롤
  useEffect(() => {
    const handleScroll = () => {
      if (!loading && page < totalPages) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
          setPage(prev => prev + 1);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, page, totalPages]);

  // (검색 버튼 클릭 시) - 같은 검색어여도 다시 검색
  const handleSearch = () => {
    // 기존 목록 제거
    setAllPackages([]);
    // 페이지 1로
    setPage(1);

    // 만약 입력한 검색어(searchInput)가 기존 검색어(searchQuery)와 같아도
    // 다시 fetchPackages(1)을 호출하여 목록 갱신
    if (searchInput === searchQuery) {
      // 강제로 다시 fetch
      fetchPackages(1);
    } else {
      // 검색어를 새로 적용
      setSearchQuery(searchInput);
    }
  };

  // Enter 키로 검색
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // 필터 적용
  const getFilteredPackages = () => {
    return allPackages.filter(pkg => {
      const {finalPrice} = computePackagePrice(pkg);
      if (finalPrice < priceRange[0] || finalPrice > priceRange[1]) return false;
      if (pkg.discountRate < discountMin) return false;
      if (includeFlight && (!pkg.flights || pkg.flights.length === 0)) return false;
      if (includeTour && (!pkg.tours || pkg.tours.length === 0)) return false;
      if (includeAccommodation) {
        const hasRoomIds = pkg.roomIds && pkg.roomIds.length > 0;
        const hasAcc = pkg.accommodations && pkg.accommodations.length > 0;
        if (!hasRoomIds && !hasAcc) return false;
      }
      return true;
    });
  };

  const getIncludedCategories = pkg => {
    const categories = [];
    if (pkg.flights && pkg.flights.length > 0) {
      categories.push({label: '항공', icon: <FlightTakeoffIcon />});
    }
    if (pkg.roomIds && pkg.roomIds.length > 0) {
      categories.push({label: '숙소', icon: <HotelIcon />});
    }
    if (pkg.tours && pkg.tours.length > 0) {
      categories.push({label: '투어/티켓', icon: <ConfirmationNumberIcon />});
    }
    return categories;
  };

  const filteredPackages = getFilteredPackages();

  return (
    <Box sx={{minHeight: '100vh'}}>
      <Container sx={{maxWidth: '1000px'}}>
        {/* 광고 슬라이드 */}
        <AdSlider />

        <Grid container spacing={3}>
          {/* 왼쪽: 필터 */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 2,
                p: 2,
                mt: 4
              }}>
              <Typography variant="h6" gutterBottom>
                필터
              </Typography>

              {/* 가격 슬라이더 */}
              <Typography variant="body2" sx={{mt: 2, mb: 1}}>
                가격대 (원) [{priceRange[0].toLocaleString()} ~{' '}
                {priceRange[1].toLocaleString()}]
              </Typography>
              <Slider
                value={priceRange}
                onChange={(e, val) => setPriceRange(val)}
                min={0}
                max={5000000}
                step={10000}
                valueLabelDisplay="auto"
                valueLabelFormat={val => `${val.toLocaleString()}원`}
              />

              {/* 최소 할인율 */}
              <Typography variant="body2" sx={{mt: 2, mb: 1}}>
                최소 할인율 (%) [{discountMin}%]
              </Typography>
              <Slider
                value={discountMin}
                onChange={(e, val) => setDiscountMin(val)}
                valueLabelDisplay="auto"
                min={0}
                max={100}
              />

              {/* 항공/투어/숙소 */}
              <FormGroup sx={{mt: 3}}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeFlight}
                      onChange={() => setIncludeFlight(prev => !prev)}
                    />
                  }
                  label="항공 포함"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeTour}
                      onChange={() => setIncludeTour(prev => !prev)}
                    />
                  }
                  label="투어/티켓 포함"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeAccommodation}
                      onChange={() => setIncludeAccommodation(prev => !prev)}
                    />
                  }
                  label="숙소 포함"
                />
              </FormGroup>
            </Box>
          </Grid>

          {/* 오른쪽: 패키지 목록 */}
          <Grid item xs={12} md={9}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{fontWeight: 'bold', textAlign: 'center', mt: 4}}>
              ✈️ 여행 패키지
            </Typography>

            {/* 검색 바 */}
            <Box display="flex" gap={1} sx={{mb: 3, justifyContent: 'center'}}>
              <TextField
                label="여행지를 검색하세요"
                variant="outlined"
                fullWidth
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown} // 엔터 검색
                sx={{maxWidth: 400}}
              />
              <Button variant="contained" color="primary" onClick={handleSearch}>
                검색
              </Button>
            </Box>

            {loading && (
              <Typography variant="h6" align="center">
                로딩 중...
              </Typography>
            )}
            {error && (
              <Typography variant="h6" align="center" color="error">
                {error}
              </Typography>
            )}

            {!loading && !error && (
              <Typography variant="subtitle1" sx={{mb: 2, textAlign: 'right'}}>
                총 {filteredPackages.length}개 패키지
              </Typography>
            )}

            {filteredPackages.length === 0 && !loading && !error ? (
              <Typography variant="h6" align="center">
                조건에 맞는 패키지가 없습니다.
              </Typography>
            ) : (
              <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                {filteredPackages.map(pkg => {
                  const mainImage =
                    pkg.images && pkg.images.length > 0
                      ? SERVER_URL + normalizeImagePath(pkg.images[0])
                      : '/default-image.jpg';

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
                      <CardMedia
                        component="img"
                        sx={{width: 180, height: 120, borderRadius: 2}}
                        image={mainImage}
                        alt={`패키지 ${pkg.name}`}
                      />
                      <CardContent sx={{flex: 1, pl: 2}}>
                        <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                          {pkg.name}
                        </Typography>

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

                        <Typography variant="body2" color="text.secondary">
                          {pkg.description.length > 80
                            ? pkg.description.substring(0, 80) + '...'
                            : pkg.description}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} sx={{mt: 1}}>
                          {pkg.discountRate > 0 ? (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: 'line-through',
                                  color: 'gray'
                                }}>
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
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
