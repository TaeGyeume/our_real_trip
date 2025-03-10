import React from 'react';
import {Box, Paper, Typography, Divider} from '@mui/material';

const MileageSummary = ({totalMileage, totalSpent, membershipLevel}) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        backgroundColor: 'grey.100'
      }}>
      <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
        {/* 내 마일리지 항목 */}
        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            내 마일리지
          </Typography>
          <Typography variant="h5" color="error.main" fontWeight="bold">
            {totalMileage?.toLocaleString()} P
          </Typography>
        </Box>
        <Divider sx={{backgroundColor: '#555'}} />
        {/* 총 결제 금액 항목 */}
        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
          <Typography variant="secondary" fontWeight="bold" color="text.primary">
            총 결제 금액
          </Typography>
          <Typography variant="secondary" color="primary" fontWeight="bold">
            {totalSpent?.toLocaleString()} 원
          </Typography>
        </Box>
        <Divider sx={{backgroundColor: '#555'}} />
        {/* 내 등급 (membershipLevel) 항목 */}
        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
          <Typography variant="secondary" fontWeight="bold" color="text.primary">
            내 등급
          </Typography>
          <Typography variant="secondary" color="secondary" fontWeight="bold">
            {membershipLevel || '미설정'}
          </Typography>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
          <Typography variant="secondary" color="gray">
            길초보 / 길잡이 / 모험왕
          </Typography>
          <Typography variant="h9" color="gray">
            1% / 3% / 5%
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MileageSummary;
