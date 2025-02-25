import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, Typography, Box} from '@mui/material';

const TravelItemInfo = ({booking}) => {
  const navigate = useNavigate();

  const handleTravelItemClick = travelItem => {
    if (!travelItem?._id) return;
    navigate(`/travelItems/${travelItem._id}`);
  };

  if (!booking.types?.includes('travelItem') || booking.productIds?.length === 0)
    return null;

  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        여행 용품 정보
      </Typography>

      {booking.productIds.map((product, index) => (
        <Card
          key={product._id}
          sx={{
            p: 2,
            mb: 2,
            cursor: 'pointer',
            boxShadow: 3,
            borderRadius: 2,
            transition: '0.3s',
            '&:hover': {boxShadow: 6}
          }}
          onClick={() => handleTravelItemClick(product)}>
          <CardContent>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              상품명
            </Typography>
            <Typography variant="body1">{product.name || '정보 없음'}</Typography>

            <Box sx={{mt: 1}}>
              <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                가격
              </Typography>
              <Typography
                variant="body1"
                sx={{fontWeight: 'bold', color: 'primary.main'}}>
                ₩{product.price?.toLocaleString() || '정보 없음'}
              </Typography>
            </Box>

            <Box sx={{mt: 1}}>
              <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                구매 수량
              </Typography>
              <Typography variant="body1">
                {booking.counts?.[index] || '정보 없음'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default TravelItemInfo;
