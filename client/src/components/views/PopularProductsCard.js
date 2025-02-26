import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Card, CardMedia, CardContent, Typography, Box} from '@mui/material';
import './styles/PopularProductsCard.css';

const SERVER_URL = 'http://localhost:5000';

const PopularProductsCard = ({product}) => {
  const [imageError, setImageError] = useState(false);
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
        maxWidth: 300,
        borderRadius: 3,
        boxShadow: 3,
        cursor: 'pointer',
        transition: '0.3s',
        position: 'relative',
        '&:hover': {boxShadow: 6},
        mb: 2
      }}>
      <Link
        to={
          product.type === 'tourTicket'
            ? `/tourTicket/list/${productId}`
            : `/travelItems/${productId}`
        }
        style={{textDecoration: 'none'}}>
        <Box sx={{position: 'relative'}}>
          <CardMedia
            component="img"
            height="200"
            image={imageUrl}
            alt={product.title || product.name}
            onError={() => setImageError(true)}
          />
        </Box>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{height: '2rem', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {product.title || product.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{height: '2rem', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {product.description || '설명 없음'}
          </Typography>
          <Typography variant="h6" color="primary" sx={{mt: 1}}>
            💰 {product.price.toLocaleString()} 원
          </Typography>
          <Typography variant="body2" sx={{color: 'green', mt: 1}}>
            {product.stock > 0 ? '재고 있음' : '품절'}
          </Typography>
        </CardContent>
      </Link>
    </Card>
  );
};

export default PopularProductsCard;
