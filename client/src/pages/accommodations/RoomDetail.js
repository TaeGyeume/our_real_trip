import React, {useState, useEffect} from 'react';
import {useParams, useSearchParams, useNavigate} from 'react-router-dom';
import {getRoomById} from '../../api/room/roomService';
import RoomImageGallery from '../../components/accommodations/RoomImageGallery';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Grid,
  ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const RoomDetail = () => {
  const {roomId} = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const adults = searchParams.get('adults') || 1;

  useEffect(() => {
    const loadRoomDetail = async () => {
      try {
        const room = await getRoomById(roomId);
        setRoomData(room);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRoomDetail();
  }, [roomId]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!roomData) return <div>객실 정보를 찾을 수 없습니다.</div>;

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  const imageUrls =
    roomData.images?.length > 0
      ? roomData.images.map(img =>
          img.startsWith('/uploads/') ? `${SERVER_URL}${img}` : img
        )
      : ['/default-image.jpg'];

  // 예약하기 버튼 클릭 시 이동
  const handleBooking = () => {
    navigate(
      `/accommodation/booking/${roomId}?startDate=${startDate}&endDate=${endDate}&adults=${adults}`
    );
  };

  return (
    <Box sx={{maxWidth: 900, mx: 'auto', mt: 4, p: 2}}>
      {/* 객실 이미지 갤러리 */}
      <RoomImageGallery imageUrls={imageUrls} />

      {/* 객실 정보 카드 */}
      <Paper elevation={3} sx={{mt: 4, p: 3, borderRadius: 2}}>
        {/* 체크인/체크아웃 정보 */}
        <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 3}}>
          <Paper
            elevation={2}
            sx={{p: 2, borderRadius: 2, flex: 1, textAlign: 'center', mx: 1}}>
            <Typography variant="subtitle1" fontWeight="bold">
              체크인 날짜
            </Typography>
            <Typography variant="body1">{startDate}</Typography>
          </Paper>
          <Paper
            elevation={2}
            sx={{p: 2, borderRadius: 2, flex: 1, textAlign: 'center', mx: 1}}>
            <Typography variant="subtitle1" fontWeight="bold">
              체크아웃 날짜
            </Typography>
            <Typography variant="body1">{endDate}</Typography>
          </Paper>
        </Box>

        {/* 객실 이름과 설명 */}
        <Typography variant="h4" fontWeight="bold" sx={{mb: 2}}>
          {roomData.name}
        </Typography>
        {roomData.description && (
          <Typography variant="body1" sx={{fontSize: '1.1rem', color: '#555', mb: 2}}>
            {roomData.description}
          </Typography>
        )}

        <Divider sx={{mb: 3}} />

        {/* 객실 상세 정보 */}
        <Box sx={{mb: 3}}>
          <Typography variant="body1">
            <strong>최대 수용 인원:</strong> {roomData.maxGuests}명
          </Typography>
        </Box>

        {/* 체크인/체크아웃 시간 */}
        <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 3}}>
          <Typography variant="body1">
            <strong>체크인 시간:</strong> {roomData.checkInTime || '15:00'}
          </Typography>
          <Typography variant="body1">
            <strong>체크아웃 시간:</strong> {roomData.checkOutTime || '11:00'}
          </Typography>
        </Box>

        <Divider sx={{mb: 3}} />

        {/* 편의시설 */}
        {roomData.amenities?.length > 0 && (
          <Box sx={{mt: 3, p: 2, borderRadius: 2, backgroundColor: '#f5f5f5'}}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              객실 편의시설
            </Typography>

            <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1}}>
              {roomData.amenities.map((amenity, index) => (
                <Box key={index} sx={{display: 'flex', alignItems: 'center'}}>
                  <CheckCircleIcon sx={{color: 'secondary.main', mr: 1}} />
                  <Typography variant="body1" sx={{color: 'text.primary'}}>
                    {amenity}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{mt: 3, mb: 3}} />

        {/* 가격 & 예약 버튼 */}
        <Box
          sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Typography variant="h5" fontWeight="bold">
            {roomData.pricePerNight.toLocaleString()}원 / 1박
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleBooking}>
            🏨 예약하기
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RoomDetail;
