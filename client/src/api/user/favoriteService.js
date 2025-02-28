import axios from 'axios';

// ✅ Axios 기본 인스턴스 생성 (환경 변수 활용)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // 쿠키 포함 요청
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json'
  }
});

// API 엔드포인트 경로 설정
const FAVORITES_API = '/favorites';

// itemType을 소문자로 변환하는 함수
const normalizeItemType = itemType => itemType.toLowerCase();

/**
 * 즐겨찾기 추가/삭제 (토글)
 * @param {string} itemId - 아이템 ID
 * @param {string} itemType - 아이템 타입 (예: 숙소, 투어, 항공 등)
 * @returns {Promise<Object>} - 응답 데이터
 */
export const toggleFavorite = async (itemId, itemType) => {
  try {
    const formattedItemType = normalizeItemType(itemType);
    const response = await api.post(`${FAVORITES_API}/toggle`, {
      itemId,
      itemType: formattedItemType
    });

    return response.data;
  } catch (error) {
    console.error('Error toggling favorite:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to toggle favorite'
    );
  }
};

/**
 * 사용자 즐겨찾기 목록 조회
 * @returns {Promise<Object>} - 즐겨찾기 목록 데이터
 */
export const getUserFavorites = async () => {
  try {
    const response = await api.get(`${FAVORITES_API}/list`);
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to fetch user favorites'
    );
  }
};
