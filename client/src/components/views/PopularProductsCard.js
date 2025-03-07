import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import ReviewList from '../review/ReviewList';
import {Card, CardMedia, CardContent, Typography, Box} from '@mui/material';

const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ourrealtrip.shop/api';

const PopularProductsCard = ({product}) => {
  const [imageError, setImageError] = useState(false);
  const [ratingInfo, setRatingInfo] = useState({});
  const productId = product._id;

  // 기본 이미지 설정
  let imageUrl = '/default-image.jpg';
  if (product.images?.length > 0 && !imageError) {
    imageUrl = product.images[0];
    // `/uploads/` 경로라면 서버 URL을 붙이기
    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `${SERVER_URL}${imageUrl}`;
    }
  }

  return (
    <Card
      sx={{
        width: 250, // `TravelItemCard`와 동일한 크기
        // height: 330, // 기본 높이 (평점 추가 시 크기 조정 가능)
        borderRadius: 1,
        boxShadow: 1,
        cursor: 'pointer',
        transition: 'height 0.3s ease-in-out',
        '&:hover': {boxShadow: 6},
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      <Link
        to={
          product.type === 'tourTicket'
            ? `/tourTicket/list/${productId}`
            : `/travelItems/${productId}`
        }
        style={{textDecoration: 'none', color: 'inherit'}}>
        {/* 이미지 영역 */}
        <CardMedia
          component="img"
          height="150"
          image={imageUrl}
          alt={product.title || product.name}
          onError={() => setImageError(true)}
          sx={{objectFit: 'cover'}}
        />

        {/* 상품 정보 */}
        <CardContent
          sx={{
            textAlign: 'left',
            p: 1,
            height: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flexGrow: 1
          }}>
          {/* 상품명 (한 줄 고정, 길면 생략) */}
          <Typography
            variant="body1"
            fontWeight="bold"
            color="text.primary"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              fontSize: '14px !important',
              textOverflow: 'ellipsis'
            }}>
            {product.title || product.name}
          </Typography>
          <div className="user-list-review-summary">
            <ReviewList
              productId={productId}
              setRatingInfo={setRatingInfo}
              ratingInfo={ratingInfo[productId] || {avgRating: 0, reviewCount: 0}}
              showOnlySummary={true}
            />
          </div>
          {/* 가격 */}
          <Typography variant="h6" fontWeight="bold" color="text.primary" fontSize="12px">
            {product.price.toLocaleString()} 원
          </Typography>
        </CardContent>
      </Link>
    </Card>
  );
};

export default PopularProductsCard;
