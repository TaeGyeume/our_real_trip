import api from '../axios'; // axios.js에서 공통 설정을 가져옴

// 서버 URL을 환경 변수로 설정 (로컬 환경에서만 사용, 배포 시 환경 변수로 변경 가능)
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/favorites';

//  itemType을 일관되게 소문자로 변환하는 함수
const normalizeItemType = itemType => itemType.toLowerCase();

//  즐겨찾기 추가/삭제 (토글)
export const toggleFavorite = async (itemId, itemType) => {
  try {
    const formattedItemType = normalizeItemType(itemType);
    // console.log(` Sending request - itemId: ${itemId}, itemType: ${formattedItemType}`);

    const response = await api.post(
      `${API_BASE_URL}/toggle`,
      {itemId, itemType: formattedItemType},
      {withCredentials: true}
    );

    // console.log(` Favorite toggled successfully: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error(' Error toggling favorite:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to toggle favorite'
    );
  }
};

//  사용자 즐겨찾기 목록 조회
export const getUserFavorites = async () => {
  try {
    const response = await api.get(API_BASE_URL, {withCredentials: true});
    // console.log('Fetched favorites:', response.data.favorites);
    return response.data;
  } catch (error) {
    // console.error('Error fetching favorites:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to fetch user favorites'
    );
  }
};
