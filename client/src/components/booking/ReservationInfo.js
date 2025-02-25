import React from 'react';
import {Card, CardContent, Typography, Box} from '@mui/material';

const ReservationInfo = ({booking}) => {
  if (!booking.reservationInfo) {
    return (
      <Typography variant="body1" sx={{fontStyle: 'italic', color: 'gray'}}>
        예약자 정보 없음
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        예약자 정보
      </Typography>

      <Card sx={{p: 2, mb: 2, boxShadow: 3, borderRadius: 2}}>
        <CardContent>
          <Box sx={{mb: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              이름
            </Typography>
            <Typography variant="body1">
              {booking.reservationInfo.name || '정보 없음'}
            </Typography>
          </Box>

          <Box sx={{mb: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              이메일
            </Typography>
            <Typography variant="body1">
              {booking.reservationInfo.email || '정보 없음'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              연락처
            </Typography>
            <Typography variant="body1">
              {booking.reservationInfo.phone || '정보 없음'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default ReservationInfo;
