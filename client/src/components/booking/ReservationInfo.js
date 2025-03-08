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

      <Card
        sx={{
          p: 2,
          mb: 2,
          boxShadow: 1,
          borderRadius: 1,
          border: '1px solid #ddd',
          backgroundColor: '#fafafa'
        }}>
        <CardContent>
          {/* 이름 */}
          <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
              이름
            </Typography>
            <Typography variant="body2">
              {booking.reservationInfo.name || '정보 없음'}
            </Typography>
          </Box>

          {/* 이메일 */}
          <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
              이메일
            </Typography>
            <Typography variant="body2">
              {booking.reservationInfo.email || '정보 없음'}
            </Typography>
          </Box>

          {/* 연락처 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
              borderBottom: '1px dashed #bbb',
              pb: 1
            }}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
              연락처
            </Typography>
            <Typography variant="body2">
              {booking.reservationInfo.phone || '정보 없음'}
            </Typography>
          </Box>

          {/* 주소 (존재할 경우에만 표시) */}
          {booking.reservationInfo.address && (
            <Box sx={{mt: 2}}>
              <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
                주소
              </Typography>
              <Typography variant="body2">{booking.reservationInfo.address}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ReservationInfo;
