import React, {useState, useEffect} from 'react';
import {fetchAccommodations} from '../../../api/accommodation/accommodationService';
import AccommodationCard from './AccommodationCard';
import {Box, Typography, CircularProgress} from '@mui/material';

const AccommodationList = ({limit = null}) => {
  // limit을 props로 받음 (기본값: null)
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 모든 숙소 불러오기
  useEffect(() => {
    const loadAccommodations = async () => {
      try {
        const data = await fetchAccommodations();
        setAccommodations(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccommodations();
  }, []);

  // 삭제 시 숙소 리스트에서 제거
  const handleAccommodationDeleted = deletedId => {
    setAccommodations(prevAccommodations =>
      prevAccommodations.filter(accommodation => accommodation._id !== deletedId)
    );
  };

  return (
    <Box sx={{maxWidth: 1200, mx: 'auto', mt: 4, px: 2}}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🏨 숙소 리스트
      </Typography>

      {/* 로딩 상태 표시 */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      )}

      {/* 오류 발생 시 메시지 표시 */}
      {error && (
        <Typography variant="body1" color="error" textAlign="center">
          {error}
        </Typography>
      )}

      {/* 숙소 목록 (한 줄에 3개씩) */}
      {!loading && !error && (
        <Box display="flex" flexWrap="wrap" gap={3} mt={3}>
          {accommodations.length > 0 ? (
            accommodations
              .slice(0, limit || accommodations.length) // 최대 `limit` 개수만 표시
              .map(accommodation => (
                <Box key={accommodation._id} sx={{width: '31%'}}>
                  <AccommodationCard
                    accommodation={accommodation}
                    onAccommodationDeleted={handleAccommodationDeleted}
                  />
                </Box>
              ))
          ) : (
            <Typography variant="body1" textAlign="center">
              등록된 숙소가 없습니다.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AccommodationList;
