import React from 'react';
import {Card, CardContent, Typography, Box} from '@mui/material';

const PaymentInfo = ({booking, translatePaymentStatus, translateType}) => {
  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        결제 내역
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
          {/* 예약 번호 */}
          <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
              예약 번호
            </Typography>
            <Typography variant="body2">{booking.merchant_uid || '정보 없음'}</Typography>
          </Box>

          {/* 상품 유형 */}
          <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
              상품 유형
            </Typography>
            <Typography variant="body2">
              {booking.types && booking.types.length > 0
                ? booking.types.map(type => translateType(type)).join(', ')
                : '정보 없음'}
            </Typography>
          </Box>

          {/* 결제 상태 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
              borderBottom: '1px dashed #bbb',
              pb: 1
            }}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
              결제 상태
            </Typography>
            <Typography variant="body2" sx={{fontWeight: 'bold', color: 'primary.main'}}>
              {translatePaymentStatus(booking.paymentStatus) || '정보 없음'}
            </Typography>
          </Box>

          {/* 가격 정보 */}
          <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 2}}>
            <Typography variant="subtitle2" color="text.secondary">
              총 금액
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {booking.totalPrice?.toLocaleString() || 0} 원
            </Typography>
          </Box>

          {/* 쿠폰 할인 금액이 0 이상일 때만 표시 */}
          {booking.discountAmount > 0 && (
            <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 1}}>
              <Typography variant="subtitle2" color="text.secondary">
                쿠폰 할인 금액
              </Typography>
              <Typography variant="body2" sx={{color: 'error.main'}}>
                -{booking.discountAmount?.toLocaleString()} 원
              </Typography>
            </Box>
          )}

          {/* 사용 마일리지가 0 이상일 때만 표시 */}
          {booking.usedMileage > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 1,
                borderBottom: '1px dashed #bbb',
                pb: 1
              }}>
              <Typography variant="subtitle2" color="text.secondary">
                사용 마일리지
              </Typography>
              <Typography variant="body2" sx={{color: 'error.main'}}>
                -{booking.usedMileage?.toLocaleString()} 원
              </Typography>
            </Box>
          )}

          {/* 최종 결제 금액 강조 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 2,
              pt: 1,
              borderTop: '2px solid #000'
            }}>
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
