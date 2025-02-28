import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getPackageById} from '../../../api/package/packageService';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const PackageDetail = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState(null);
  const [flightsData, setFlightsData] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);

  useEffect(() => {
    fetchPackage();
  }, []);

  const fetchPackage = async () => {
    try {
      const data = await getPackageById(id);
      setPackageData(data);

      // 항공편 정보가 있으면 각 항공편에 대해 개별 API 호출
      if (data.flights && data.flights.length > 0) {
        const flightPromises = data.flights.map(flightEntry =>
          fetchFlightById(flightEntry.flightId)
        );
        const flights = await Promise.all(flightPromises);
        setFlightsData(flights.filter(f => f));
      }
    } catch (error) {
      console.error('패키지 조회 실패:', error);
    }
  };

  // 단일 항공편 정보를 가져오는 함수 (API 엔드포인트가 있다고 가정)
  const fetchFlightById = async flightId => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}/api/flight/${flightId}`
      );
      if (!response.ok) {
        throw new Error('항공편 데이터를 가져오는데 실패했습니다.');
      }
      return await response.json();
    } catch (error) {
      console.error('항공편 데이터 불러오기 실패:', error);
      return null;
    }
  };

  // 예약일수 계산 (startDates[0], endDates[0] 기준)
  const bookingDays =
    packageData &&
    packageData.startDates &&
    packageData.endDates &&
    packageData.startDates.length > 0 &&
    packageData.endDates.length > 0
      ? Math.ceil(
          (new Date(packageData.endDates[0]) - new Date(packageData.startDates[0])) /
            (1000 * 60 * 60 * 24)
        )
      : 1;

  // 가격 계산: 각 항목(숙소의 객실, 항공, 투어티켓)의 합계를 구한 뒤 할인율 적용
  const calculateTotalPrice = () => {
    if (!packageData) return;

    let roomPriceTotal = 0;
    let flightPriceTotal = 0;
    let tourPriceTotal = 0;

    // 숙소 내 모든 객실의 가격 계산 (객실 가격 × 예약일수)
    if (packageData.accommodations) {
      packageData.accommodations.forEach(acc => {
        if (acc.rooms && acc.rooms.length > 0) {
          acc.rooms.forEach(room => {
            if (room.pricePerNight) {
              roomPriceTotal += room.pricePerNight * bookingDays;
            }
          });
        }
      });
    }

    // 항공 가격 계산 (항공 가격 × 선택한 좌석 수)
    if (packageData.flights && packageData.flights.length > 0) {
      packageData.flights.forEach(flightEntry => {
        const flight = flightsData.find(f => f && f._id === flightEntry.flightId);
        if (flight && flight.price) {
          flightPriceTotal += flight.price * flightEntry.seatsToUse;
        }
      });
    }

    // 투어 티켓 가격 계산 (투어 가격 × 수량, 수량이 없으면 1로 가정)
    if (packageData.tours && packageData.tours.length > 0) {
      packageData.tours.forEach(tour => {
        if (tour.price) {
          tourPriceTotal += tour.price * (tour.quantity || 1);
        }
      });
    }

    const calculatedTotalPrice = roomPriceTotal + flightPriceTotal + tourPriceTotal;
    setTotalPrice(calculatedTotalPrice);

    // 할인율 적용 (할인율이 있을 경우, 총합에서 할인 금액을 차감)
    if (packageData.discountRate) {
      setDiscountRate(packageData.discountRate);
      setFinalPrice(
        calculatedTotalPrice -
          Math.floor((calculatedTotalPrice * packageData.discountRate) / 100)
      );
    } else {
      setFinalPrice(calculatedTotalPrice);
    }
  };

  useEffect(() => {
    calculateTotalPrice();
  }, [packageData, flightsData]);

  if (!packageData) return <Typography>로딩 중...</Typography>;

  return (
    <Container>
      <Typography variant="h4" sx={{mt: 3}}>
        {packageData.name}
      </Typography>
      <Typography variant="body1" sx={{mt: 2}}>
        {packageData.description}
      </Typography>

      <Box sx={{mt: 2, display: 'flex', alignItems: 'center'}}>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{textDecoration: 'line-through', mr: 2}}>
          원래 가격: {totalPrice.toLocaleString()} 원
        </Typography>
        {discountRate > 0 && (
          <Typography variant="h6" color="primary">
            할인율: {discountRate}% 적용
          </Typography>
        )}
      </Box>

      <Typography variant="h6" sx={{mt: 1}}>
        최종 가격 (할인 적용):{' '}
        <span style={{fontWeight: 'bold'}}>{finalPrice.toLocaleString()} 원</span>
      </Typography>

      {/* 상품 이미지 목록 */}
      <Grid container spacing={2} sx={{mt: 2}}>
        {packageData.images && packageData.images.length > 0 ? (
          packageData.images.map((img, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <img
                src={`${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}${img}`}
                alt={`패키지 ${packageData.name}`}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <img
              src="/default-image.jpg"
              alt="기본 이미지"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover'
              }}
            />
          </Grid>
        )}
      </Grid>

      {/* 포함 사항 */}
      <Typography variant="h5" sx={{mt: 3}}>
        포함 사항
      </Typography>
      <Card sx={{mt: 2}}>
        <CardContent>
          {/* 숙소 및 객실 정보 */}
          <Typography variant="body1" sx={{mb: 2}}>
            <strong>숙소 및 객실 정보:</strong>
            {packageData.accommodations && packageData.accommodations.length > 0
              ? packageData.accommodations.map((acc, index) => {
                  // 각 숙소의 최고 객실 가격 계산 (가격 정보가 있는 경우)
                  const maxRoomPrice =
                    acc.rooms && acc.rooms.length > 0
                      ? Math.max(...acc.rooms.map(room => room.pricePerNight || 0))
                      : 0;
                  return (
                    <Box key={index} sx={{mt: 1, ml: 2}}>
                      <Typography variant="subtitle1">
                        {acc.name} (최고 객실가:{' '}
                        {maxRoomPrice
                          ? maxRoomPrice.toLocaleString() + ' 원'
                          : '가격 정보 없음'}
                        )
                      </Typography>
                      {acc.rooms && acc.rooms.length > 0 ? (
                        <List>
                          {acc.rooms.map((room, idx) => (
                            <ListItem key={idx} disableGutters>
                              <ListItemText
                                primary={`${room.name || '객실'} - ${room.pricePerNight ? room.pricePerNight.toLocaleString() + ' 원/박' : '가격 정보 없음'}`}
                                secondary={`총 ${bookingDays}박: ${
                                  room.pricePerNight
                                    ? (
                                        room.pricePerNight * bookingDays
                                      ).toLocaleString() + ' 원'
                                    : '가격 정보 없음'
                                }`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ml: 2}}>
                          객실 정보 없음
                        </Typography>
                      )}
                    </Box>
                  );
                })
              : '없음'}
          </Typography>

          {/* 투어/티켓 정보 */}
          <Typography variant="body1" sx={{mb: 2}}>
            <strong>투어/티켓 정보:</strong>
            {packageData.tours && packageData.tours.length > 0
              ? packageData.tours.map((tour, idx) => (
                  <Box key={idx} sx={{mt: 1, ml: 2}}>
                    <Typography variant="subtitle1">
                      {tour.title} -{' '}
                      {tour.price
                        ? tour.price.toLocaleString() + ' 원'
                        : '가격 정보 없음'}
                    </Typography>
                  </Box>
                ))
              : '없음'}
          </Typography>

          {/* 항공편 정보 */}
          <Typography variant="body1">
            <strong>항공편 정보:</strong>
            {flightsData && flightsData.length > 0
              ? flightsData.map((flight, index) => (
                  <Box key={index} sx={{mt: 1, ml: 2}}>
                    <Typography variant="subtitle1">
                      {flight.flightNumber || '정보 없음'} -{' '}
                      {flight.airline || '항공사 정보 없음'} -{' '}
                      {flight.price
                        ? flight.price.toLocaleString() + ' 원'
                        : '가격 정보 없음'}
                    </Typography>
                  </Box>
                ))
              : '없음'}
          </Typography>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        color="primary"
        sx={{mt: 3}}
        onClick={() => navigate(`/package/booking/${packageData._id}`)}>
        예약하기
      </Button>
    </Container>
  );
};

export default PackageDetail;
