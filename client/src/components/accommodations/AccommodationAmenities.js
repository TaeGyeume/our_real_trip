// src/components/accommodations/AccommodationAmenities.js
import React from 'react';
import {Box, Typography, List, ListItem, ListItemIcon, ListItemText} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AccommodationAmenities = ({amenities}) => {
  if (!amenities || amenities.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        등록된 편의시설이 없습니다.
      </Typography>
    );
  }

  return (
    <Box sx={{mt: 4, p: 2, borderRadius: 2, backgroundColor: '#f5f5f5'}}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        숙소 편의시설
      </Typography>

      {/* 편의시설 목록을 2열로 정렬 */}
      <List
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between', // 좌우 정렬
          gap: 1 // 항목 간 간격 추가
        }}>
        {amenities.map((amenity, index) => (
          <ListItem
            key={index}
            sx={{
              width: '48%', // 좌우 2열 배치
              py: 0.5,
              display: 'flex',
              alignItems: 'center'
            }}>
            <ListItemIcon sx={{minWidth: '32px', color: 'secondary.main'}}>
              <CheckCircleIcon />
            </ListItemIcon>
            <ListItemText primary={amenity} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default AccommodationAmenities;
