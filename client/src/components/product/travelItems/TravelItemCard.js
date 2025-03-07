import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '../../../store/authStore';
import {deleteTravelItem} from '../../../api/travelItem/travelItemService';
import ReviewList from '../../review/ReviewList';
import FavoriteButton from '../../user/FavoriteButton'; // 즐겨찾기 버튼 추가
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box
} from '@mui/material';

const TravelItemCard = ({travelItem, onItemDeleted, isFavorite, onFavoriteToggle}) => {
  const navigate = useNavigate();
  const {user, isAuthenticated} = useAuthStore();
  const [ratingInfo, setRatingInfo] = useState({avgRating: 0, reviewCount: 0});
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  const [imgError, setImgError] = useState(false);

  // 이미지 URL 설정
  let imageUrl = imgError ? '/default-image.jpg' : '/default-image.jpg';

  if (!imgError && Array.isArray(travelItem?.images) && travelItem.images.length > 0) {
    imageUrl = travelItem.images[0];
    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `${SERVER_URL}${imageUrl}`;
    }
  }

  // 카드 클릭 시 상세 페이지로 이동
  const handleCardClick = () => {
    navigate(`/travelItems/${travelItem._id}`);
  };

  const handleModifyClick = e => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    navigate(`/product/travelItems/edit/${travelItem._id}`); // 수정 페이지로 이동
  };

  // 삭제 버튼 클릭 시 호출
  const handleDeleteClick = async e => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    if (!window.confirm(`'${travelItem.name}'을(를) 삭제하시겠습니까?`)) return;

    try {
      await deleteTravelItem(travelItem._id);
      alert('상품이 삭제되었습니다.');

      // 리스트 새로고침을 위해 콜백 실행
      if (onItemDeleted) {
        onItemDeleted(travelItem._id); // 삭제된 항목의 ID 전달
      } else {
        window.location.reload(); // 콜백이 없으면 강제 새로고침
      }
    } catch (error) {
      console.error('상품 삭제 중 오류 발생:', error);
      alert('상품 삭제 실패');
    }
  };

  return (
    <Card
      sx={{
        width: 300,
        height: isAuthenticated && user?.roles.includes('admin') ? 370 : 330, // 관리자일 때 크기 증가
        borderRadius: 1,
        boxShadow: 1,
        cursor: 'pointer',
        transition: 'height 0.3s ease-in-out', // 부드러운 크기 변화 효과 추가
        '&:hover': {boxShadow: 6},
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onClick={handleCardClick}>
      {/* 이미지 영역 */}
      <CardMedia
        component="img"
        height="190"
        image={imageUrl}
        alt={travelItem?.name || '상품 이미지'}
        onError={() => setImgError(true)}
        sx={{objectFit: 'cover'}}
      />

      {/* 상품 정보 */}
      <CardContent
        sx={{
          textAlign: 'left',
          p: 1,
          height: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexGrow: 1 // 버튼이 추가될 때 밀리지 않도록 함
        }}>
        {/* 상품명 (한 줄 고정, 길면 생략) */}
        <Typography
          variant="body1"
          fontWeight="bold"
          color="text.primary"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
          {travelItem?.name || '상품명 없음'}
        </Typography>

        <ReviewList
          productId={travelItem._id}
          setRatingInfo={setRatingInfo}
          ratingInfo={ratingInfo[travelItem._id] || {avgRating: 0, reviewCount: 0}} // 해당 상품의 리뷰 정보만 전달
          showOnlySummary={true}
        />

        {/* 가격 */}
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          {travelItem?.price?.toLocaleString() || '가격 미정'}원
        </Typography>
      </CardContent>

      {/* 관리자 전용 버튼 */}
      {isAuthenticated && user?.roles.includes('admin') && (
        <CardActions sx={{justifyContent: 'space-between', px: 1, pb: 1}}>
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={handleModifyClick}>
            ✏️ 수정
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleDeleteClick}>
            ❌ 삭제
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default TravelItemCard;
