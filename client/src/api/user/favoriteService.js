import api from '../axios';

// Axios 전역 설정: 쿠키 포함
axios.defaults.withCredentials = true;

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
