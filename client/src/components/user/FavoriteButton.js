import React, {useState, useEffect} from 'react';
import {toggleFavorite} from '../../api/user/favoriteService';
import './styles/styles.css';

const FavoriteButton = ({itemId, itemType, initialFavoriteStatus, sx = {}}) => {
  const [isFavorite, setIsFavorite] = useState(initialFavoriteStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    //  초기값이 변경되면 업데이트
    setIsFavorite(initialFavoriteStatus);
  }, [initialFavoriteStatus]);

  const handleFavoriteToggle = async e => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    try {
      setLoading(true);
      setIsFavorite(prev => !prev); // 낙관적 UI 업데이트

      const response = await toggleFavorite(itemId, itemType);
      // console.log(' Favorite toggled:', response);

      if (!(response.status === 'success' || response.message?.includes('success'))) {
        setIsFavorite(prev => !prev); // 서버 응답 실패 시 롤백
      }
    } catch (error) {
      setIsFavorite(prev => !prev); // 에러 발생 시 롤백
      console.error(' 즐겨찾기 토글 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFavoriteToggle}
      className={`favorite-button ${isFavorite ? 'favorite' : ''}`} // UI 업데이트
      disabled={loading}
      style={sx}>
      <i className={isFavorite ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'} />
    </button>
  );
};

export default FavoriteButton;
