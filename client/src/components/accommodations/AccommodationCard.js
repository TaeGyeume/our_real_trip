import React, {useState} from 'react';
import {createSearchParams} from 'react-router-dom';
import {Card, CardMedia, CardContent, Typography, Box} from '@mui/material';
import FavoriteButton from '../user/FavoriteButton';
import ReviewList from '../review/ReviewList';

const getFormattedDate = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
};

const AccommodationCard = ({
  accommodation,
  queryOptions = {},
  isFavorite,
  onFavoriteToggle
}) => {
  const params = {
    city: queryOptions.city || '서울',
    startDate: queryOptions.startDate || getFormattedDate(1),
    endDate: queryOptions.endDate || getFormattedDate(2),
    adults: queryOptions.adults || 1,
    minPrice: queryOptions.minPrice || 0,
    maxPrice: queryOptions.maxPrice || 500000,
    category: queryOptions.category || 'all',
    sortBy: queryOptions.sortBy || 'default'
  };

  const handleCardClick = () => {
    const url = `/accommodations/${accommodation._id}/detail?${createSearchParams(params)}`;
    window.open(url, '_blank');
  };

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  let imageUrl = accommodation.images?.[0] || '/default-image.jpg';

  if (imageUrl.startsWith('/uploads/')) {
    imageUrl = `${SERVER_URL}${imageUrl}`;
  }
  const [ratingInfo, setRatingInfo] = useState({avgRating: 0, reviewCount: 0});

  return (
    <Card
      sx={{
        display: 'flex',
        width: '100%',
        height: '200px', // 높이 유지
        cursor: 'pointer',
        mb: 2, // 카드 간격 조정
        position: 'relative' // 즐겨찾기 버튼 위치 조정을 위해 relative 설정
      }}
      onClick={handleCardClick}>
      {/* 왼쪽 이미지 */}
      <CardMedia
        component="img"
        image={imageUrl}
        alt={accommodation.name}
        sx={{
          width: '300px', // 기존 이미지 크기 유지
          height: '100%', // 카드 높이에 맞춤
          objectFit: 'cover'
        }}
      />

      {/* 오른쪽 정보 */}
      <CardContent sx={{display: 'flex', flexDirection: 'column', flex: 1, p: 2}}>
        <Typography variant="h6" sx={{fontWeight: 'bold', mb: 1}}>
          {accommodation.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{flexGrow: 1, mb: 1}}>
          {accommodation.description}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{flexGrow: 1, mb: 1}}>
          {accommodation.address}
        </Typography>
        <ReviewList
          productId={accommodation._id}
          setRatingInfo={setRatingInfo}
          ratingInfo={ratingInfo[accommodation._id] || {avgRating: 0, reviewCount: 0}} // 해당 상품의 리뷰 정보만 전달
          showOnlySummary={true}
        />
        <Typography variant="body1" color="primary" sx={{mt: 1}}>
          <strong>최저가:</strong> {accommodation.minPrice?.toLocaleString()}원 / 박
        </Typography>
      </CardContent>

      {/* 즐겨찾기 버튼 (카드 내부에서 우측 상단에 배치) */}
      <Box
        sx={{
          position: 'absolute', // 이제 Card 내부에서 배치됨
          top: 8, // 상단 여백
          right: 8, // 오른쪽 여백
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // 배경 추가 (더 잘 보이도록)
          borderRadius: '50%',
          padding: '4px'
        }}>
        <FavoriteButton
          itemId={accommodation._id}
          itemType="Accommodation"
          initialFavoriteStatus={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
        />
      </Box>
    </Card>
  );
};

export default AccommodationCard;
