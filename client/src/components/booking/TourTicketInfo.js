import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getTourTicketById} from '../../api/tourTicket/tourTicketService';
import {Card, CardContent, Typography, Box, CardMedia} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const TourTicketInfo = ({booking}) => {
  const navigate = useNavigate();
  const [tourTickets, setTourTickets] = useState([]);

  // 투어 티켓 데이터 가져오기
  useEffect(() => {
    if (!booking.types?.includes('tourTicket') || !booking.productIds?.length) {
      return;
    }

    const fetchTourTickets = async () => {
      const SERVER_URL =
        process.env.REACT_APP_ENV === 'development'
          ? 'http://localhost:5000'
          : 'https://ourrealtrip.shop/api';

      try {
        const fetchedItems = await Promise.all(
          booking.productIds.map(async product => {
            const productId = typeof product === 'object' ? product._id : product;
            if (!productId) return null;

            const response = await getTourTicketById(productId);
            const productData = response;

            // 이미지 URL 설정
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

        setTourTickets(fetchedItems.filter(item => item !== null));
      } catch (error) {
        console.error('투어 티켓 데이터를 불러오는 중 오류 발생:', error);
      }
    };

    fetchTourTickets();
  }, [booking.productIds, booking.types]);

  const handleTourTicketClick = ticket => {
    if (!ticket?._id) return;
    navigate(`/tourTicket/list/${ticket._id}`);
  };

  if (!booking.types?.includes('tourTicket') || tourTickets.length === 0) return null;

  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        투어 티켓 정보
      </Typography>

      {tourTickets.map((ticket, index) => (
        <Card
          key={ticket._id}
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
          onClick={() => handleTourTicketClick(ticket)}>
          {/* 티켓 이미지 (왼쪽에 배치) */}
          <CardMedia
            component="img"
            image={ticket.imageUrl}
            alt={ticket.title || '투어 티켓 이미지'}
            sx={{
              width: 80,
              height: 80,
              objectFit: 'cover',
              borderRadius: 1,
              mr: 2
            }}
          />

          {/* 티켓 정보 (이미지 오른쪽) */}
          <CardContent sx={{flex: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              {ticket.title || '정보 없음'}
            </Typography>

            <Box sx={{display: 'flex', alignItems: 'center', mt: 1}}>
              <Typography
                variant="body2"
                sx={{fontWeight: 'bold', color: 'primary.main'}}>
                ₩{ticket.price?.toLocaleString() || '정보 없음'}
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
            onClick={() => handleTourTicketClick(ticket)}>
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

export default TourTicketInfo;
