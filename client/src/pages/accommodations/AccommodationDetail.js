// src/pages/accommodation/AccommodationDetail.js
import React, {useState, useEffect} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import {fetchAccommodationDetail} from '../../api/accommodation/accommodationService';
import RoomCard from '../../components/accommodations/RoomCard';
import MapComponent from '../../components/accommodations/GoogleMapComponent';
import ReviewList from '../../components/review/ReviewList';
import AccommodationAmenities from '../../components/accommodations/AccommodationAmenities';
import AccommodationImageGallery from '../../components/accommodations/AccommodationImageGallery';
import AccommodationSearch from '../../components/accommodations/AccommodationSearch';
import {Box, Typography, Card, CardContent, Stack, Divider} from '@mui/material';

// 기본 날짜 설정 함수 (오늘 + n일)
const getFormattedDate = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
};

const AccommodationDetail = () => {
  const {accommodationId} = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accommodationData, setAccommodationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // `searchParams`에서 검색 조건 가져오되, 값이 없으면 기본값 사용
  const [startDate, setStartDate] = useState(
    new Date(searchParams.get('startDate') || getFormattedDate(1))
  );
  const [endDate, setEndDate] = useState(
    new Date(searchParams.get('endDate') || getFormattedDate(2))
  );
  const [adults, setAdults] = useState(Number(searchParams.get('adults')) || 1);
  const minPrice = searchParams.get('minPrice') || 0;
  const maxPrice = searchParams.get('maxPrice') || 500000;

  useEffect(() => {
    const loadAccommodationDetail = async () => {
      try {
        const params = {startDate, endDate, adults, minPrice, maxPrice};
        const data = await fetchAccommodationDetail(accommodationId, params);

        const updatedRooms = data.availableRooms.map(room => ({
          ...room,
          checkInTime: room.checkInTime || '15:00',
          checkOutTime: room.checkOutTime || '11:00'
        }));

        setAccommodationData({
          ...data,
          availableRooms: updatedRooms
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccommodationDetail();
  }, [accommodationId, startDate, endDate, adults, minPrice, maxPrice]);

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!accommodationData) return <Typography>데이터가 없습니다.</Typography>;

  const {accommodation, availableRooms} = accommodationData;
  const SERVER_URL = 'http://localhost:5000';

  // 검색 조건 변경 시 URL 업데이트 및 다시 검색
  const handleSearchUpdate = () => {
    const newParams = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      adults,
      minPrice,
      maxPrice
    };
    setSearchParams(newParams);
  };

  return (
    <Box sx={{maxWidth: '1200px', mx: 'auto', p: 3}}>
      {/* 숙소 제목 & 설명 */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {accommodation.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
        {accommodation.description}
      </Typography>

      {/* 숙소 이미지 갤러리 */}
      <AccommodationImageGallery
        images={accommodation.images}
        accommodationName={accommodation.name}
        serverUrl={SERVER_URL}
      />

      {/* 숙소 정보 (주소 & 지도) */}
      <Card sx={{my: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, boxShadow: 1}}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold">
            📍 주소
          </Typography>
          <Typography variant="body1">{accommodation.address}</Typography>

          {/* Google Maps 추가 */}
          {accommodation.coordinates?.coordinates ? (
            <Box sx={{mt: 2, borderRadius: 2, overflow: 'hidden'}}>
              <MapComponent
                lat={accommodation.coordinates.coordinates[1]}
                lng={accommodation.coordinates.coordinates[0]}
              />
            </Box>
          ) : (
            <Typography color="text.secondary" mt={2}>
              지도 정보를 불러올 수 없습니다.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 숙소 편의시설 */}
      <AccommodationAmenities amenities={accommodation.amenities} />

      {/* 날짜 및 인원 검색 기능 */}
      <AccommodationSearch
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        adults={adults}
        setAdults={setAdults}
        onSearch={handleSearchUpdate}
      />

      {/* 예약 가능한 객실 목록 */}
      <Box sx={{mt: 4}}>
        <Typography variant="h5" fontWeight="bold" sx={{mb: 2}}>
          🏨 예약 가능한 객실
        </Typography>
        <Divider sx={{mb: 2}} />
        {availableRooms?.length > 0 ? (
          <Stack spacing={2}>
            {availableRooms.map(room => (
              <RoomCard key={room._id} room={room} />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">예약 가능한 객실이 없습니다.</Typography>
        )}
      </Box>

      {/* 리뷰 리스트  */}
      <Box sx={{mt: 4}}>
        <Typography variant="h5" fontWeight="bold" sx={{mb: 2}}>
          📝 리뷰
        </Typography>
        <Divider sx={{mb: 2}} />
        <ReviewList productId={accommodationId} />
      </Box>
    </Box>
  );
};

export default AccommodationDetail;
