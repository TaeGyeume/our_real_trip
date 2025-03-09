import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {fetchAccommodationById} from '../../api/accommodation/accommodationService';
import {getRoomById} from '../../api/room/roomService';
import {Card, CardContent, Typography, Box, CardMedia} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const AccommodationInfo = ({booking}) => {
  const navigate = useNavigate();
  const [imageUrls, setImageUrls] = useState({});
  const [checkInTime, setCheckInTime] = useState('15:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');

  // 숙소 이미지 가져오기
  useEffect(() => {
    if (!booking.types?.includes('accommodation') || !booking.productIds?.length) return;

    const fetchImages = async () => {
      try {
        const SERVER_URL =
          process.env.REACT_APP_ENV === 'development'
            ? 'http://localhost:5000'
            : 'https://ourrealtrip.shop/api';

        const imagesData = await Promise.all(
          booking.productIds.map(async product => {
            const accommodationId = typeof product === 'object' ? product._id : product;
            if (!accommodationId) return null;

            try {
              const response = await fetchAccommodationById(accommodationId);
              const images = response.images || [];

              // 이미지 URL 설정
              let imageUrl = '/default-image.jpg';
              if (Array.isArray(images) && images.length > 0) {
                imageUrl = images[0];
                if (imageUrl.startsWith('/uploads/')) {
                  imageUrl = `${SERVER_URL}${imageUrl}`;
                }
              }

              return {id: accommodationId, imageUrl};
            } catch (error) {
              console.error(`숙소 ${accommodationId} 이미지 불러오기 실패:`, error);
              return null;
            }
          })
        );

        // 이미지 URL 상태 저장
        const imagesMap = imagesData
          .filter(item => item !== null)
          .reduce((acc, item) => {
            acc[item.id] = item.imageUrl;
            return acc;
          }, {});

        setImageUrls(imagesMap);
      } catch (error) {
        console.error('숙소 이미지 로딩 실패:', error);
      }
    };

    fetchImages();
  }, [booking.productIds, booking.types]);

  // 객실 체크인 & 체크아웃 시간 가져오기
  useEffect(() => {
    if (!booking.types?.includes('accommodation') || !booking.roomIds?.length) return;

    const fetchRoomTimes = async () => {
      const firstRoomId = booking.roomIds[0];
      const validRoomId = typeof firstRoomId === 'object' ? firstRoomId._id : firstRoomId;

      if (!validRoomId || typeof validRoomId !== 'string') return;

      try {
        const roomData = await getRoomById(validRoomId);
        setCheckInTime(roomData.checkInTime || '15:00');
        setCheckOutTime(roomData.checkOutTime || '11:00');
      } catch (error) {
        console.error(`객실 ${validRoomId} 정보 불러오기 실패:`, error);
      }
    };

    fetchRoomTimes();
  }, [booking.roomIds, booking.types]);

  if (!booking.types?.includes('accommodation')) return null;

  const handleAccommodationClick = accommodation => {
    if (!accommodation?._id) return;
    navigate(`/accommodations/${accommodation._id}/detail`);
  };

  // 날짜 변환 함수
  const formatDate = dateString => {
    if (!dateString) return '날짜 없음';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // 체크인 & 체크아웃 날짜 가져오기
  const checkInDate = booking.startDates?.length
    ? formatDate(booking.startDates[0])
    : '날짜 없음';
  const checkOutDate = booking.endDates?.length
    ? formatDate(booking.endDates[0])
    : '날짜 없음';

  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        숙소 정보
      </Typography>

      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          mb: 2,
          cursor: 'pointer',
          boxShadow: 3,
          borderRadius: 2,
          transition: '0.3s',
          '&:hover': {boxShadow: 6}
        }}
        onClick={() => {
          if (booking.productIds?.length > 0) {
            const firstProduct = booking.productIds.find(product =>
              booking.types.includes('accommodation')
            );
            if (firstProduct) handleAccommodationClick(firstProduct);
          }
        }}>
        {/* 숙소 이미지 (왼쪽에 배치) */}
        <CardMedia
          component="img"
          image={imageUrls[booking.productIds[0]?._id] || '/default-image.jpg'}
          alt="숙소 이미지"
          sx={{
            width: 100,
            height: 100,
            objectFit: 'cover',
            borderRadius: 2,
            mr: 3
          }}
        />

        {/* 숙소 정보 */}
        <CardContent sx={{flex: 1}}>
          {booking.productIds?.length > 0 &&
            booking.productIds
              .filter(product => booking.types.includes('accommodation'))
              .map(product => (
                <Typography
                  key={product._id}
                  variant="subtitle1"
                  sx={{fontWeight: 'bold', mb: 1}}>
                  {product.name || '정보 없음'}
                </Typography>
              ))}

          {/* 숙소 예약 날짜 정보 추가 */}
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
            <Typography variant="body2">
              <strong>체크인:</strong> {checkInDate} ({checkInTime})
            </Typography>
            <Typography variant="body2">
              <strong>체크아웃:</strong> {checkOutDate} ({checkOutTime})
            </Typography>
          </Box>
        </CardContent>

        {/* 상세 페이지 이동 버튼 (오른쪽 끝) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'primary.main',
            cursor: 'pointer'
          }}
          onClick={() => handleAccommodationClick(booking.productIds[0])}>
          <Typography variant="body2" fontWeight="bold">
            숙소 상세 페이지
          </Typography>
          <ArrowForwardIosIcon fontSize="small" sx={{ml: 0.5}} />
        </Box>
      </Card>
    </>
  );
};

export default AccommodationInfo;
