import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useAuthStore} from '../../store/authStore';
import {deleteRoom, getAvailableRoomsByDate} from '../../api/room/roomService';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box
} from '@mui/material';

const RoomCard = ({room, onRoomDeleted}) => {
  const navigate = useNavigate();
  const {user, isAuthenticated} = useAuthStore();
  const [searchParams] = useSearchParams();
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';
  const [availableRooms, setAvailableRooms] = useState(null);

  // 이미지가 없는 경우 기본 이미지 설정
  let imageUrl = room.images?.[0] || '/default-image.jpg';

  // 이미지가 상대 경로(`/uploads/...`)일 경우, 서버 주소 추가
  if (imageUrl.startsWith('/uploads/')) {
    imageUrl = `${SERVER_URL}${imageUrl}`;
  }

  // 검색된 날짜와 인원 정보를 가져오기
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const adults = searchParams.get('adults') || 1;

  // 특정 날짜의 예약 가능 객실 조회
  useEffect(() => {
    if (startDate) {
      const fetchAvailability = async () => {
        try {
          const available = await getAvailableRoomsByDate(room._id, startDate);
          setAvailableRooms(available);
        } catch (error) {
          console.error('객실 예약 가능 여부 조회 실패:', error);
        }
      };
      fetchAvailability();
    }
  }, [room._id, startDate]);

  // 객실 상세 페이지 이동
  const handleRoomDetail = () => {
    navigate(
      `/accommodation/room/${room._id}?startDate=${startDate}&endDate=${endDate}&adults=${adults}`
    );
  };

  // 객실 삭제 핸들러
  const handleDeleteRoom = async event => {
    event.stopPropagation(); // 카드 클릭 방지
    const confirmDelete = window.confirm(`"${room.name}" 객실을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      await deleteRoom(room._id);
      alert('객실이 삭제되었습니다.');

      if (onRoomDeleted) {
        onRoomDeleted(room._id); // 부모 컴포넌트에서 목록 업데이트
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('객실 삭제 오류:', err);
      alert('객실 삭제에 실패했습니다.');
    }
  };

  // 예약 버튼 클릭 시 이동
  const handleBooking = event => {
    event.stopPropagation(); // 카드 클릭 방지
    navigate(
      `/accommodation/booking/${room._id}?startDate=${startDate}&endDate=${endDate}&adults=${adults}`
    );
  };

  // 수정 버튼 클릭 시 이동
  const handleEditRoom = event => {
    event.stopPropagation(); // 카드 클릭 방지
    navigate(`/product/room/modify/${room._id}`);
  };

  return (
    <Card
      sx={{
        mb: 3,
        display: 'flex',
        flexDirection: 'row', // 가로 정렬
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 4,
        cursor: 'pointer',
        width: '100%', // 너비를 100%로 확장
        maxWidth: '1400px', // 최대 너비 설정 (더 넓게)
        margin: 'auto' // 중앙 정렬
      }}
      onClick={handleRoomDetail}>
      {/* 객실 이미지 */}
      <CardMedia
        component="img"
        sx={{width: '35%', height: '250px', objectFit: 'cover'}}
        image={imageUrl}
        alt={room.name}
      />

      {/* 객실 정보 */}
      <Box sx={{display: 'flex', flexDirection: 'column', flex: 1}}>
        <CardContent sx={{padding: '16px'}}>
          <Typography variant="h5" fontWeight="bold">
            {room.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <strong>가격:</strong> {room.pricePerNight.toLocaleString()}원/1박
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>최대 수용 인원:</strong> {room.maxGuests}명
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>체크인:</strong> {room.checkInTime}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>체크아웃:</strong> {room.checkOutTime}
          </Typography>
          {room.amenities?.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              <strong>편의시설:</strong> {room.amenities.join(', ')}
            </Typography>
          )}
          {startDate && availableRooms !== null && availableRooms <= 3 && (
            <Typography
              variant="body2"
              color={availableRooms > 0 ? 'success.main' : 'error.main'}>
              {availableRooms > 0 ? `객실이 ${availableRooms}개 남았어요!` : '예약 불가'}
            </Typography>
          )}
        </CardContent>

        {/* 액션 버튼 (예약, 수정, 삭제) */}
        <CardActions sx={{justifyContent: 'flex-end', pr: 3, pb: 2}}>
          <Button
            variant="contained"
            sx={{backgroundColor: 'primary.light', color: 'primary.contrastText'}}
            size="medium"
            onClick={handleBooking}>
            🏨 객실 예약
          </Button>

          {/* 관리자인 경우 수정/삭제 버튼 표시 */}
          {isAuthenticated && user?.roles.includes('admin') && (
            <>
              <Button
                variant="contained"
                color="warning"
                size="medium"
                onClick={handleEditRoom}>
                ✏️ 수정
              </Button>
              <Button
                variant="contained"
                color="error"
                size="medium"
                onClick={handleDeleteRoom}>
                🗑️ 삭제
              </Button>
            </>
          )}
        </CardActions>
      </Box>
    </Card>
  );
};

export default RoomCard;
