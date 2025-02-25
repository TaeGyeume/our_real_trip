import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '../../../store/authStore';
import {deleteTravelItem} from '../../../api/travelItem/travelItemService';
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
  const SERVER_URL = 'http://localhost:5000';
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
        width: '100%',
        maxWidth: 300,
        borderRadius: 3,
        boxShadow: 3,
        cursor: 'pointer',
        transition: '0.3s',
        position: 'relative',
        '&:hover': {boxShadow: 6},
        mb: 2
      }}
      onClick={handleCardClick}>
      {/* 이미지 컨테이너 */}
      <Box sx={{position: 'relative'}}>
        <CardMedia
          component="img"
          height="200"
          image={!imgError ? imageUrl : '/default-image.jpg'}
          alt={travelItem?.name || '상품 이미지'}
          onError={() => setImgError(true)} // 한 번만 실행되도록 상태 업데이트
        />

        {/* 즐겨찾기 버튼 (이미지 내부 오른쪽 상단) */}
        <div
          className="favorite-icon-container"
          style={{position: 'absolute', top: 10, right: 10}}>
          <FavoriteButton
            itemId={travelItem._id}
            itemType="TravelItem"
            initialFavoriteStatus={isFavorite}
            onFavoriteToggle={onFavoriteToggle}
            className="favorite-icon"
          />
        </div>
      </Box>

      {/* 상품 정보 */}
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          {travelItem?.name || '상품명 없음'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {travelItem?.description || '설명 없음'}
        </Typography>
        <Typography variant="h6" color="primary" sx={{mt: 1}}>
          💰 {travelItem?.price?.toLocaleString() || '가격 미정'}₩
        </Typography>
        <Typography
          variant="body2"
          sx={{color: travelItem?.stock > 0 ? 'green' : 'red', mt: 1}}>
          {travelItem?.stock > 0 ? '재고 있음' : '품절'}
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
              handleModifyClick();
            }}>
            ✏️ 수정
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={e => {
              e.stopPropagation();
              handleDeleteClick();
            }}>
            ❌ 삭제
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default TravelItemCard;
