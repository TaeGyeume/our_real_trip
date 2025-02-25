import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, Typography, Box} from '@mui/material';

const AccommodationInfo = ({booking}) => {
  const navigate = useNavigate();

  const handleAccommodationClick = accommodation => {
    if (!accommodation?._id) return;
    navigate(`/accommodations/${accommodation._id}/detail`);
  };

  if (!booking.types?.includes('accommodation')) return null;

  // 날짜 변환 함수 (ISO 형식 -> YYYY-MM-DD)
  const formatDate = dateString => {
    if (!dateString) return '날짜 없음';
    return new Date(dateString).toISOString().split('T')[0]; // YYYY-MM-DD 형식 변환
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
        <CardContent>
          {booking.productIds?.length > 0 &&
            booking.productIds
              .filter(product => booking.types.includes('accommodation'))
              .map(product => (
                <Typography
                  key={product._id}
                  variant="subtitle1"
                  sx={{fontWeight: 'bold'}}>
                  숙소 상품명{' '}
                  <Typography component="span">{product.name || '정보 없음'}</Typography>
                </Typography>
              ))}

          {booking.roomIds?.length > 0 &&
            booking.roomIds.map(room => (
              <Box key={room._id} sx={{mt: 1}}>
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                  객실명 <Typography component="span">{room.name}</Typography>
                </Typography>
                <Typography variant="subtitle1">
                  가격{' '}
                  <Typography
                    component="span"
                    sx={{fontWeight: 'bold', color: 'primary.main'}}>
                    ₩{room.pricePerNight?.toLocaleString()} / 박
                  </Typography>
                </Typography>
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                  체크인 시간{' '}
                  <Typography component="span">{room.checkInTime || '15:00'}</Typography>
                </Typography>
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                  체크아웃 시간{' '}
                  <Typography component="span">{room.checkOutTime || '11:00'}</Typography>
                </Typography>
              </Box>
            ))}

          {/* 숙소 예약 날짜 정보 추가 */}
          <Box sx={{mt: 2}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              체크인 <Typography component="span">{checkInDate}</Typography>
            </Typography>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              체크아웃 <Typography component="span">{checkOutDate}</Typography>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default AccommodationInfo;
