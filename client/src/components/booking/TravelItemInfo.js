import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {fetchTravelItem} from '../../api/travelItem/travelItemService';
import {Card, CardContent, Typography, Box, CardMedia} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const TravelItemInfo = ({booking}) => {
  const navigate = useNavigate();
  const [travelItems, setTravelItems] = useState([]);

  useEffect(() => {
    if (!booking.types?.includes('travelItem') || !booking.productIds?.length) {
      return;
    }

    const fetchTravelItems = async () => {
      const SERVER_URL =
        process.env.REACT_APP_ENV === 'development'
          ? 'http://localhost:5000'
          : 'https://ourrealtrip.shop/api';

      try {
        const fetchedItems = await Promise.all(
          booking.productIds.map(async product => {
            const productId = typeof product === 'object' ? product._id : product;
            if (!productId) return null;

            const response = await fetchTravelItem(productId);
            const productData = response.data;

            let imageUrl = '/default-image.jpg';
            if (Array.isArray(productData.images) && productData.images.length > 0) {
              imageUrl = productData.images[0];
              if (imageUrl.startsWith('/uploads/')) {
                imageUrl = `${SERVER_URL}${imageUrl}`;
              }
            }

            return {...productData, imageUrl};
          })
        );

        setTravelItems(fetchedItems.filter(item => item !== null));
      } catch (error) {
        console.error('여행 용품 데이터를 불러오는 중 오류 발생:', error);
      }
    };

    fetchTravelItems();
  }, [booking.productIds, booking.types]);

  const handleTravelItemClick = travelItem => {
    if (!travelItem?._id) return;
    navigate(`/travelItems/${travelItem._id}`);
  };

  if (!booking.types?.includes('travelItem') || travelItems.length === 0) return null;

  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        여행 용품 정보
      </Typography>

      {travelItems.map((product, index) => (
        <Card
          key={product._id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            mb: 2,
            cursor: 'pointer',
            boxShadow: 3,
            borderRadius: 2,
            transition: '0.3s',
            '&:hover': {boxShadow: 6}
          }}
          onClick={() => handleTravelItemClick(product)}>
          {/* 상품 이미지 (왼쪽에 작게 배치) */}
          <CardMedia
            component="img"
            image={product.imageUrl} // 이미지 URL
            alt={product.name || '상품 이미지'}
            sx={{
              width: 80, // 썸네일 크기 조정
              height: 80, // 정사각형 썸네일
              objectFit: 'cover',
              borderRadius: 1,
              mr: 2 // 오른쪽 여백 추가
            }}
          />

          {/* 상품 정보 (이미지 오른쪽에 배치) */}
          <CardContent sx={{flex: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              {product.name || '정보 없음'}
            </Typography>

            <Box sx={{display: 'flex', alignItems: 'center', mt: 1}}>
              <Typography
                variant="body2"
                sx={{fontWeight: 'bold', color: 'primary.main'}}>
                ₩{product.price?.toLocaleString() || '정보 없음'}
              </Typography>
              <Typography variant="body2" sx={{ml: 2, color: 'text.secondary'}}>
                구매 수량: {booking.counts?.[index] || '정보 없음'}
              </Typography>
            </Box>
          </CardContent>
          {/* 상세 페이지 이동 버튼 (오른쪽 끝) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
              cursor: 'pointer'
            }}
            onClick={() => handleTravelItemClick(product)}>
            <Typography variant="body2" fontWeight="bold">
              상품 상세 페이지
            </Typography>
            <ArrowForwardIosIcon fontSize="small" sx={{ml: 0.5}} />
          </Box>
        </Card>
      ))}
    </>
  );
};

export default TravelItemInfo;
