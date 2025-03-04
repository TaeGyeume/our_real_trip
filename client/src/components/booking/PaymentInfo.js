import React from 'react';
import {Card, CardContent, Typography, Box} from '@mui/material';

const PaymentInfo = ({booking, translatePaymentStatus, translateType}) => {
  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        예약 상세 정보
      </Typography>

      <Card sx={{p: 2, mb: 2, boxShadow: 3, borderRadius: 2}}>
        <CardContent>
          <Box sx={{mb: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              예약 번호
            </Typography>
            <Typography variant="body1">{booking.merchant_uid || '정보 없음'}</Typography>
          </Box>

          <Box sx={{mb: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              상품 유형
            </Typography>
            <Typography variant="body1">
              {booking.types && booking.types.length > 0
                ? booking.types.map(type => translateType(type)).join(', ')
                : '정보 없음'}
            </Typography>
          </Box>

          <Box sx={{mb: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              결제 상태
            </Typography>
            <Typography variant="body1" sx={{fontWeight: 'bold', color: 'primary.main'}}>
              {translatePaymentStatus(booking.paymentStatus) || '정보 없음'}
            </Typography>
          </Box>

          <Box sx={{mt: 2, pt: 1, borderTop: '1px solid #ddd'}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              총 금액
            </Typography>
            <Typography variant="body1">
              ₩{booking.totalPrice?.toLocaleString() || 0}
            </Typography>
          </Box>

          <Box sx={{mt: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              할인 금액
            </Typography>
            <Typography variant="body1" sx={{color: 'error.main'}}>
              -₩{booking.discountAmount?.toLocaleString() || 0}
            </Typography>
          </Box>

          <Box sx={{mt: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              사용 마일리지
            </Typography>
            <Typography variant="body1" sx={{color: 'error.main'}}>
              -₩{booking.usedMileage?.toLocaleString() || 0}
            </Typography>
          </Box>

          <Box sx={{mt: 2, pt: 1, borderTop: '2px solid #000'}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              최종 결제 금액
            </Typography>
            <Typography variant="h6" sx={{fontWeight: 'bold', color: 'green'}}>
              ₩{booking.finalPrice?.toLocaleString() || 0}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default PaymentInfo;
