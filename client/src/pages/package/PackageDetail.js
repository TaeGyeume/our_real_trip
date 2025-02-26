import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {getPackageById} from '../../api/package/packageService';
import {fetchFlights} from '../../api/flight/flights'; // 기존 API 호출 사용
import {Container, Typography, Button, Grid, Card, CardContent} from '@mui/material';

const PackageDetail = () => {
  const {id} = useParams();
  const [packageData, setPackageData] = useState(null);
  const [flightsData, setFlightsData] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetchPackage();
  }, []);

  const fetchPackage = async () => {
    try {
      const data = await getPackageById(id);
      setPackageData(data);

      // 항공편 데이터 가져오기
      if (data.flights && data.flights.length > 0) {
        const flightIds = data.flights.map(flight => flight.flightId); // flightId만 추출
        const flightPromises = flightIds.map(flightId => fetchFlightById(flightId)); // flightId로 항공편 정보 가져오기
        const flights = await Promise.all(flightPromises);
        setFlightsData(flights); // 항공편 데이터 상태 설정
      }
    } catch (error) {
      console.error('패키지 조회 실패:', error);
    }
  };

  const fetchFlightById = async flightId => {
    try {
      // 모든 항공편을 가져와서 해당 ID를 찾아 반환
      const flights = await fetchFlights();
      return flights.find(flight => flight._id === flightId);
    } catch (error) {
      console.error('항공편 데이터 불러오기 실패:', error);
      return null;
    }
  };

  // 숙소, 투어, 항공편 가격 계산
  const calculateTotalPrice = () => {
    if (!packageData) return 0;

    let accommodationPrice = 0;
    let flightPrice = 0;
    let tourPrice = 0;

    // 숙소 가격
    if (packageData.accommodations) {
      accommodationPrice = packageData.accommodations.reduce(
        (acc, accItem) => acc + (accItem.minPrice || 0),
        0
      );
    }

    // 항공편 가격 (flightsData에서 가격 사용)
    if (flightsData && flightsData.length > 0) {
      flightPrice = flightsData.reduce((acc, flight) => acc + (flight.price || 0), 0);
    }

    // 투어 가격
    if (packageData.tours) {
      tourPrice = packageData.tours.reduce((acc, tour) => acc + (tour.price || 0), 0);
    }

    // 최종 가격 계산
    setTotalPrice(accommodationPrice + flightPrice + tourPrice);
  };

  useEffect(() => {
    calculateTotalPrice(); // 가격 계산
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
      <Typography variant="h6" sx={{mt: 2}}>
        가격: {totalPrice.toLocaleString()} 원
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
          <Typography variant="body1">
            {/* 숙소 */}
            숙소:{' '}
            {packageData.accommodations
              ? packageData.accommodations.map(acc => acc.name).join(', ')
              : '없음'}
            <br />
            가격:{' '}
            {packageData.accommodations
              ? packageData.accommodations
                  .map(acc =>
                    acc.minPrice ? acc.minPrice.toLocaleString() : '가격 없음'
                  )
                  .join(', ')
              : '가격 없음'}
            <br />
            설명:{' '}
            {packageData.accommodations
              ? packageData.accommodations.map(acc => acc.description).join(', ')
              : '설명 없음'}
            <br />
            <br />
            {/* 투어 */}
            투어:{' '}
            {packageData.tours
              ? packageData.tours.map(tour => tour.title).join(', ')
              : '없음'}
            <br />
            가격:{' '}
            {packageData.tours
              ? packageData.tours
                  .map(tour => (tour.price ? tour.price.toLocaleString() : '가격 없음'))
                  .join(', ')
              : '가격 없음'}
            <br />
            설명:{' '}
            {packageData.tours
              ? packageData.tours.map(tour => tour.description).join(', ')
              : '설명 없음'}
            <br />
            <br />
            {/* 항공편 */}
            항공편:{' '}
            {flightsData && flightsData.length > 0
              ? flightsData.map(flight => flight.flightNumber).join(', ')
              : '없음'}
            <br />
            가격:{' '}
            {flightsData && flightsData.length > 0
              ? flightsData
                  .map(flight =>
                    flight.price ? flight.price.toLocaleString() : '가격 없음'
                  )
                  .join(', ')
              : '가격 없음'}
            <br />
            설명:{' '}
            {flightsData && flightsData.length > 0
              ? flightsData.map(flight => flight.airline).join(', ')
              : '설명 없음'}
            <br />
            <br />
            {/* 왕복 항공편 */}
            {flightsData && flightsData.length > 0 && flightsData[0].returnFlight && (
              <Typography variant="body1" sx={{mt: 2}}>
                오는 항공편: {flightsData[0].returnFlight.flightNumber}
                <br />
                가격:{' '}
                {flightsData[0].returnFlight.price
                  ? flightsData[0].returnFlight.price.toLocaleString()
                  : '가격 없음'}
                <br />
                설명: {flightsData[0].returnFlight.airline}
              </Typography>
            )}
          </Typography>
        </CardContent>
      </Card>

      {/* 예약 버튼 */}
      <Button variant="contained" color="primary" sx={{mt: 3}}>
        예약하기
      </Button>
    </Container>
  );
};

export default PackageDetail;
