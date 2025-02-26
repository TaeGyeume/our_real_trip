import React, {useEffect, useState} from 'react';
import {fetchPopularAccommodations} from '../../api/accommodation/accommodationService';
import AccommodationCard from '../product/accommodations/AccommodationCard';
import {Box, Typography, CircularProgress} from '@mui/material';

const PopularAccommodations = () => {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPopularAccommodations = async () => {
      try {
        const data = await fetchPopularAccommodations();
        setAccommodations(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPopularAccommodations();
  }, []);

  return (
    <Box sx={{maxWidth: 1200, mx: 'auto', mt: 3, px: 2}}>
      {/* 제목 */}
      <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center">
        다른 회원님들이 많이 본 숙소
      </Typography>

      {/* 로딩 중이면 로딩 표시 */}
      {loading ? (
        <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center', // 가운데 정렬로 변경
            gap: 2 // 간격 균등 조정
          }}>
          {accommodations.length > 0 ? (
            accommodations.map(acc => (
              <Box key={acc._id}>
                <AccommodationCard accommodation={acc} />
              </Box>
            ))
          ) : (
            <Typography variant="body1" textAlign="center" sx={{mt: 4}}>
              조회수가 높은 숙소가 없습니다.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PopularAccommodations;
