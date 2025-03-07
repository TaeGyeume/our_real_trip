// src/pages/LocationDetailPage.jsx
import React from 'react';
import {useParams} from 'react-router-dom';
import {Box, Typography} from '@mui/material';
import {locationData} from '../../data/locationData';

// 예시 데이터: Main.jsx의 locationData를 그대로 가져오거나, API로 불러올 수도 있음

const LocationDetailPage = () => {
  const {id} = useParams();

  // locationData 배열에서 현재 id에 해당하는 정보를 찾음
  const locationInfo = locationData.find(loc => loc.id === id);

  // 해당 id에 맞는 데이터가 없을 경우 처리
  if (!locationInfo) {
    return (
      <Box sx={{p: 3}}>
        <Typography variant="h5" color="error">
          해당 지역 정보를 찾을 수 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{p: 3}}>
      <Typography variant="h4" gutterBottom>
        {locationInfo.title}
      </Typography>
      <img
        src={locationInfo.image}
        alt={locationInfo.title}
        style={{maxWidth: '100%', borderRadius: 8}}
      />
      <Typography variant="body1" sx={{mt: 2}}>
        {locationInfo.description}
      </Typography>

      {/* 예: 더 자세한 내용, 티켓 정보, 지도, etc. */}
      <Box sx={{mt: 2}}>
        <Typography variant="h6">추가 정보</Typography>
        <Typography variant="body2">
          여기에 지역과 관련된 상세 정보나 상품 리스트, 지도 등을 표시할 수 있습니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default LocationDetailPage;
