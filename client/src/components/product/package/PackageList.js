import React, {useEffect, useState} from 'react';
import {getPackages} from '../../../api/package/packageService';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Pagination
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

// 숙소 최고가를 계산하는 함수 (각 숙소의 maxPrice 필드를 우선 사용하고, 없으면 minPrice)
const computeAccommodationMaxPrice = accommodations => {
  if (!accommodations || accommodations.length === 0) return null;
  const prices = accommodations.map(acc => acc.maxPrice || acc.minPrice || 0);
  return prices.length > 0 ? Math.max(...prices) : null;
};

// 객실 가격을 계산하는 함수 (각 숙소에서 첫 번째 객실의 pricePerNight를 사용)
// 여러 객실이 있을 경우, 필요한 로직에 따라 합산하거나 평균, 최저값 등으로 변경 가능
const computeRoomPrice = accommodations => {
  if (!accommodations || accommodations.length === 0) return null;
  // 여기서는 첫번째 숙소의 첫번째 객실의 가격을 사용
  const firstAcc = accommodations[0];
  if (firstAcc.rooms && firstAcc.rooms.length > 0) {
    return firstAcc.rooms[0].pricePerNight || null;
  }
  return null;
};

// 항공 총합계 계산: 각 항공 객체의 가격 * 선택한 좌석 수 (populated된 flight 객체가 있다고 가정)
const computeFlightTotal = flights => {
  if (!flights || flights.length === 0) return 0;
  return flights.reduce((sum, flight) => {
    // 만약 flight.price가 없다면 0으로 처리
    return sum + (flight.price || 0) * (flight.seatsToUse || 1);
  }, 0);
};

// 투어 티켓 총합계 계산: 각 투어 객체의 가격 (단, 수량이 1개라고 가정)
const computeTourTotal = tours => {
  if (!tours || tours.length === 0) return 0;
  return tours.reduce((sum, tour) => sum + (tour.price || 0), 0);
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
    } catch (error) {
      console.error('패키지 목록 불러오기 실패:', error);
      setError('패키지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchPackages();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        패키지 목록
      </Typography>

      <TextField
        label="검색"
        variant="outlined"
        fullWidth
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{mb: 2}}
      />
      <Button variant="contained" color="primary" onClick={handleSearch} sx={{mb: 2}}>
        검색
      </Button>

      {loading ? (
        <Typography variant="h6">로딩 중...</Typography>
      ) : error ? (
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      ) : packages.length === 0 ? (
        <Typography variant="h6">등록된 패키지가 없습니다.</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {packages.map(pkg => {
              // 패키지 이미지: 패키지 이미지, 첫번째 숙소의 이미지, 투어 이미지 등을 결합
              const packageImages = pkg.images && pkg.images.length > 0 ? pkg.images : [];
              const accommodationImages =
                pkg.accommodations && pkg.accommodations.length > 0
                  ? pkg.accommodations[0].images || []
                  : [];
              const tourImages =
                pkg.tours && pkg.tours.length > 0
                  ? pkg.tours.flatMap(tour => tour.images || [])
                  : [];
              const images = [...packageImages, ...accommodationImages, ...tourImages];

              // 가격 계산
              // 숙소 최고가는 서버에서 전달된 값이 없으면 계산 (객실 가격은 별도로 계산)
              const accommodationMaxPrice =
                pkg.accommodationMaxPrice ||
                computeAccommodationMaxPrice(pkg.accommodations);
              const roomPrice = pkg.roomPrice || computeRoomPrice(pkg.accommodations);

              // 항공 및 투어 가격은 populate되어 있다면 계산
              const flightTotal =
                pkg.flights && pkg.flights.length > 0
                  ? computeFlightTotal(pkg.flights)
                  : 0;
              const tourTotal =
                pkg.tours && pkg.tours.length > 0 ? computeTourTotal(pkg.tours) : 0;

              // 최종 패키지 가격 계산: 항공 + 투어 + 객실 가격 (숙소 최고가는 별도 표시)
              const computedFinalPrice = flightTotal + tourTotal + (roomPrice || 0);

              return (
                <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                  <Card
                    onClick={() => navigate(`/package/${pkg._id}`)}
                    sx={{
                      cursor: 'pointer',
                      height: '400px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                    <div style={{width: '100%', height: '250px', overflow: 'hidden'}}>
                      {images.length > 1 ? (
                        <Slider
                          dots={true}
                          infinite={true}
                          speed={500}
                          slidesToShow={1}
                          slidesToScroll={1}>
                          {images.map((img, index) => (
                            <img
                              key={index}
                              src={`${SERVER_URL}${img}`}
                              alt={`패키지 ${pkg.name}`}
                              style={{
                                width: '100%',
                                height: '250px',
                                objectFit: 'cover',
                                objectPosition: 'center'
                              }}
                            />
                          ))}
                        </Slider>
                      ) : (
                        <img
                          src={
                            images.length > 0
                              ? `${SERVER_URL}${images[0]}`
                              : '/default-image.jpg'
                          }
                          alt={`패키지 ${pkg.name}`}
                          style={{
                            width: '100%',
                            height: '250px',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                        />
                      )}
                    </div>

                    <CardContent sx={{flexGrow: 1}}>
                      <Typography variant="h6">{pkg.name}</Typography>
                      <Typography variant="body2" sx={{mb: 1}}>
                        {pkg.description}
                      </Typography>
                      <Typography variant="subtitle1">
                        숙소 최고가:{' '}
                        {accommodationMaxPrice
                          ? accommodationMaxPrice.toLocaleString()
                          : '가격 정보 없음'}{' '}
                        원
                      </Typography>
                      <Typography variant="subtitle1">
                        객실 가격:{' '}
                        {roomPrice ? roomPrice.toLocaleString() : '가격 정보 없음'} 원
                      </Typography>
                      <Typography variant="subtitle1">
                        항공 가격: {flightTotal ? flightTotal.toLocaleString() : '0'} 원
                      </Typography>
                      <Typography variant="subtitle1">
                        투어 가격: {tourTotal ? tourTotal.toLocaleString() : '0'} 원
                      </Typography>
                      <Typography variant="h6" sx={{mt: 1}}>
                        최종 패키지 가격: {computedFinalPrice.toLocaleString()} 원
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
            sx={{mt: 3, display: 'flex', justifyContent: 'center'}}
          />
        </>
      )}
    </Container>
  );
};

export default PackageList;
