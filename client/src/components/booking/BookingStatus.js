import React from 'react';
import {Box, Typography} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// 연한 배경색 적용 (완료된 상태도 연하게 표시)
const getStatusStyle = (status, isCurrent, isCompleted) => {
  const baseStyles = {
    PENDING: {color: '#FF9800', bg: '#FFF8E1', border: '#FB8C00'}, // 연한 주황색
    COMPLETED: {color: '#1976D2', bg: '#E3F2FD', border: '#1565C0'}, // 연한 파랑
    CONFIRMED: {color: '#2E7D32', bg: '#E8F5E9', border: '#1B5E20'}, // 연한 초록
    CANCELED: {color: '#757575', bg: '#F5F5F5', border: '#BDBDBD'} // 연한 회색
  };

  let style = baseStyles[status] || baseStyles.PENDING;

  if (isCurrent) {
    return {...style, bg: style.bg, color: style.color, border: style.border};
  }
  if (isCompleted) {
    return {
      ...style,
      bg: baseStyles[status].bg,
      color: style.color,
      border: style.border
    }; // 완료된 상태도 연한 배경색 유지
  }
  return {...style, bg: '#EEEEEE', color: '#9E9E9E', border: '#BDBDBD'};
};

// 예약 진행 상태 UI 컴포넌트
const BookingStatus = ({status}) => {
  const statusOrder = ['PENDING', 'COMPLETED', 'CONFIRMED']; // 진행 순서
  const currentStepIndex = statusOrder.indexOf(status);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        mb: 4
      }}>
      {statusOrder.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const stepStyle = getStatusStyle(step, isCurrent, isCompleted);

        return (
          <React.Fragment key={step}>
            {/* 진행 연결선 (첫 번째 요소에는 표시 X) */}
            {index > 0 && (
              <Box
                sx={{
                  width: 50,
                  height: 4,
                  backgroundColor:
                    // 결제 완료 상태에서는 첫 번째 연결선이 파란색
                    status === 'COMPLETED' && index === 1
                      ? getStatusStyle('COMPLETED', true, true).border
                      : // 구매 확정 상태에서는 첫 번째 연결선은 파란색, 두 번째 연결선은 초록색
                        status === 'CONFIRMED' && index === 1
                        ? getStatusStyle('COMPLETED', true, true).border
                        : status === 'CONFIRMED' && index === 2
                          ? getStatusStyle('CONFIRMED', true, true).border
                          : '#BDBDBD', // 기본값 (회색)
                  mt: 3
                }}
              />
            )}

            {/* 단계 카드 */}
            <Box
              sx={{
                width: 200,
                p: 3,
                textAlign: 'center',
                borderRadius: 2,
                border: `3px solid ${stepStyle.border}`,
                backgroundColor: stepStyle.bg
              }}>
              {step === 'CANCELED' ? (
                <CancelIcon sx={{color: stepStyle.color, fontSize: 40}} />
              ) : (
                <CheckCircleIcon sx={{color: stepStyle.color, fontSize: 40}} />
              )}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mt: 1,
                  color: stepStyle.color
                }}>
                {step === 'PENDING'
                  ? '예약'
                  : step === 'COMPLETED'
                    ? '결제'
                    : '구매 확정'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step === 'PENDING' && '요금 확정'}
                {step === 'COMPLETED' && '결제 완료'}
                {step === 'CONFIRMED' && '구매 확정 완료'}
              </Typography>
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default BookingStatus;
