// src/components/accommodations/AccommodationCard.js
import React, {useState} from 'react';
import {createSearchParams, useNavigate} from 'react-router-dom';
import {deleteAccommodation} from '../../../api/accommodation/accommodationService';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  CardActions,
  Box
} from '@mui/material';
import ReviewList from '../../review/ReviewList';
import {useAuthStore} from '../../../store/authStore';

// 기본 날짜 설정 함수 (오늘 + n일)
const getFormattedDate = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
};

const AccommodationCard = ({
  accommodation,
  queryOptions = {},
  onAccommodationDeleted
}) => {
  const navigate = useNavigate(); // 페이지 이동을 위한 `useNavigate` 사용
  const [ratingInfo, setRatingInfo] = useState({avgRating: 0, reviewCount: 0});
  const {user, isAuthenticated} = useAuthStore();

  // 기본 필터값 설정 (queryOptions가 없을 경우 적용)
  const params = {
    city: queryOptions.city || '서울',
    startDate: queryOptions.startDate || getFormattedDate(1), // 내일
    endDate: queryOptions.endDate || getFormattedDate(2), // 모레
    adults: queryOptions.adults || 1,
    minPrice: queryOptions.minPrice || 0,
    maxPrice: queryOptions.maxPrice || 500000,
    category: queryOptions.category || 'all',
    sortBy: queryOptions.sortBy || 'default'
  };

  // 카드 클릭 시 상세 페이지로 이동
  const handleCardClick = () => {
    const url = `/accommodations/${accommodation._id}/detail?${createSearchParams(
      params
    )}`;
    window.open(url, '_blank');
  };

  // 이미지 URL 변환 로직 추가
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';
  let imageUrl = accommodation.images?.[0] || '/default-image.jpg';

  // 이미지가 상대 경로(`/uploads/...`)일 경우, 서버 주소 추가
  if (imageUrl.startsWith('/uploads/')) {
    imageUrl = `${SERVER_URL}${imageUrl}`;
  }

  return (
    <Card
      sx={{
        maxWidth: 260,
        height: isAuthenticated && user?.roles.includes('admin') ? 350 : 310, // 관리자일 때 카드 크기 증가
        borderRadius: 3,
        boxShadow: 3,
        cursor: 'pointer',
        transition: 'height 0.3s ease-in-out', // 부드러운 크기 변환
        '&:hover': {boxShadow: 6},
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // 내용이 넘치지 않도록 설정
      }}
      onClick={handleCardClick}>
      {/* 숙소 이미지 */}
      <CardMedia
        component="img"
        height="170"
        image={imageUrl}
        alt={accommodation.name}
        sx={{
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          objectFit: 'cover'
        }}
      />

      {/* 숙소 정보 */}
      <CardContent sx={{p: 2, flexGrow: 1}}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {accommodation.name}
        </Typography>

        {/* 평점 표시 */}
        <ReviewList
          productId={accommodation._id}
          setRatingInfo={setRatingInfo}
          ratingInfo={ratingInfo[accommodation._id] || {avgRating: 0, reviewCount: 0}}
          showOnlySummary={true}
        />

        {/* 가격 */}
        <Typography variant="h6" fontWeight="bold" sx={{mt: 1}}>
          {accommodation.minPrice?.toLocaleString()}원/박
        </Typography>
      </CardContent>

      {/* 관리자 전용 버튼 */}
      {isAuthenticated && user?.roles.includes('admin') && (
        <CardActions sx={{justifyContent: 'space-between', px: 2, pb: 2}}>
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={e => {
              e.stopPropagation();
              navigate(`/product/accommodations/modify/${accommodation._id}`);
            }}>
            ✏️ 수정
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={async e => {
              e.stopPropagation();
              const confirmDelete = window.confirm(
                `"${accommodation.name}" 숙소를 삭제하시겠습니까?`
              );
              if (!confirmDelete) return;

              try {
                await deleteAccommodation(accommodation._id);
                alert('숙소가 삭제되었습니다.');
                if (onAccommodationDeleted) {
                  onAccommodationDeleted(accommodation._id);
                } else {
                  window.location.reload();
                }
              } catch (err) {
                console.error('숙소 삭제 오류:', err);
                alert('숙소 삭제에 실패했습니다.');
              }
            }}>
            🗑️ 삭제
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default AccommodationCard;
