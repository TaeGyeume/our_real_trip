import React from 'react';
import {Box, Typography} from '@mui/material';

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(/images/screen/background.gif)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
      <Box
        component="img"
        src="/images/screen/flightsloading.gif"
        alt="Loading..."
        sx={{
          width: 1000,
          mb: 2,
          position: 'relative',
          zIndex: 2
        }}
      />
      <Typography
        variant="h4"
        component="p"
        sx={{
          color: 'white',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 2
        }}>
        항공편 정보를 불러오는 중입니다...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
