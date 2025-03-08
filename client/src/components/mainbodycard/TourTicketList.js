import React, {useState, useEffect} from 'react';
import {Box, Card, CardMedia, CardContent, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {getTourTickets} from '../../api/tourTicket/tourTicketService';
import FavoriteButton from '../user/FavoriteButton';
import ReviewList from '../review/ReviewList';
import {getUserFavorites} from '../../api/user/favoriteService';

const TourTicketList = ({location}) => {
  const [tourTickets, setTourTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingInfo, setRatingInfo] = useState({});
  const [favorites, setFavorites] = useState([]);

  const navigate = useNavigate();

  // 서버 URL: 환경에 따라 수정
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  // 이미지 URL 처리 함수 (기본 이미지 처리 포함)
  const getImageUrl = ticket => {
    if (!ticket || !Array.isArray(ticket.images) || ticket.images.length === 0) {
      return '/default-image.jpg';
    }
    const firstImage = ticket.images[0];
    return firstImage.startsWith('/uploads/') ? `${SERVER_URL}${firstImage}` : firstImage;
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await getUserFavorites();
        setFavorites(response.favorites);
      } catch (error) {
        console.error('즐겨찾기 데이터를 가져오는 중 오류 발생:', error);
      }
    };
    fetchFavorites();
  }, []);

  const isFavoriteItem = itemId => {
    return favorites.some(fav => fav.itemId === itemId);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTourTickets();
        // location과 일치하는 항목만 필터링
        const filtered = data.filter(ticket => ticket.location === location);
        setTourTickets(filtered);
      } catch (err) {
        console.error('투어 티켓 데이터를 가져오는 중 오류 발생:', err);
        setError('투어 티켓 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [location]);

  if (loading) {
    return <Typography variant="body1">데이터를 불러오는 중...</Typography>;
  }

  if (error) {
    return (
      <Typography variant="body1" color="error">
        {error}
      </Typography>
    );
  }

  if (tourTickets.length === 0) {
    return (
      <Typography variant="body1">해당 지역의 투어 티켓 데이터가 없습니다.</Typography>
    );
  }

  return (
    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2}}>
      {tourTickets.map(ticket => (
        <Card
          key={ticket._id}
          sx={{width: 300, cursor: 'pointer'}}
          onClick={() => navigate(`/tourTicket/list/${ticket._id}`)}>
          <Box sx={{position: 'relative'}}>
            {/* 즐겨찾기 버튼: 우측 상단에 배치 */}
            <FavoriteButton
              itemId={ticket._id}
              itemType="TourTicket"
              initialFavoriteStatus={isFavoriteItem(ticket._id)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1
              }}
            />
            <CardMedia
              component="img"
              image={getImageUrl(ticket)}
              alt={ticket.title}
              sx={{height: 180, objectFit: 'cover'}}
            />
          </Box>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {ticket.title}
            </Typography>
            {/* 리뷰 요약 컴포넌트 */}
            <ReviewList
              productId={ticket._id}
              setRatingInfo={setRatingInfo}
              ratingInfo={ratingInfo[ticket._id] || {avgRating: 0, reviewCount: 0}}
              showOnlySummary
            />
            <Typography variant="body2" sx={{mt: 1}}>
              {ticket.price.toLocaleString()}원 / 1인
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TourTicketList;
