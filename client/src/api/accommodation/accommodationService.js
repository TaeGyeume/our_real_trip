import axios from '../axios';

/**
 * 숙소 자동완성 API 호출
 * @param {string} query - 검색어
 * @returns {Promise<Array>} 자동완성 목록
 */
export const fetchSuggestions = async query => {
  try {
    const response = await axios.get('/accommodations/autocomplete', {params: {query}});
    return [...response.data.locations, ...response.data.accommodations];
  } catch (error) {
    console.error('자동완성 오류:', error);
    return [];
  }
};

/**
 * 특정 숙소 삭제 요청
 * @param {string} accommodationId - 삭제할 숙소 ID
 * @returns {Promise<void>}
 */
export const deleteAccommodation = async accommodationId => {
  return await axios.delete(`/accommodations/${accommodationId}`);
};

/**
 * 새로운 숙소 등록 요청
 * @param {FormData} formData - 숙소 등록 데이터
 * @returns {Promise<Object>} - 생성된 숙소 데이터
 */
export const createAccommodation = async formData => {
  return await axios.post('/accommodations/new', formData, {
    headers: {'Content-Type': 'multipart/form-data'}
  });
};

/**
 * 숙소 목록 가져오기
 * @returns {Promise<Array>} 숙소 목록 데이터
 */
export const fetchAccommodations = async () => {
  try {
    const response = await axios.get('/accommodations/list');
    return response.data.accommodations;
  } catch (error) {
    console.error('숙소 리스트 불러오기 실패:', error);
    throw new Error('숙소 데이터를 불러오는 중 오류가 발생했습니다.');
  }
};

/**
 * 숙소 상세 정보 가져오기
 * @param {string} accommodationId - 숙소 ID
 * @param {Object} params - 검색 조건 (체크인, 체크아웃, 인원, 가격 범위)
 * @returns {Promise<Object>} 숙소 데이터
 */
export const fetchAccommodationDetail = async (accommodationId, params) => {
  try {
    const response = await axios.get(`/accommodations/${accommodationId}/rooms`, {
      params
    });
    return response.data;
  } catch (error) {
    console.error('숙소 상세 정보 오류:', error);
    throw new Error('숙소 정보를 불러오는 중 오류 발생');
  }
};

/**
 * 숙소 검색 API 요청
 * @param {Object} filters - 검색 조건
 * @param {number} page - 페이지 번호
 * @returns {Promise<Object>} 검색된 숙소 데이터
 */
export const searchAccommodations = async (filters, page = 1) => {
  try {
    const response = await axios.get('/accommodations/search', {
      params: {...filters, page}
    });

    return {
      accommodations: response.data.accommodations || [],
      totalPages: response.data.totalPages || 1
    };
  } catch (error) {
    console.error('숙소 검색 오류:', error);
    throw new Error('숙소 검색 중 오류 발생');
  }
};

/**
 * 숙소 수정 요청
 * @param {string} accommodationId - 숙소 ID
 * @param {FormData} formData - 수정할 숙소 데이터
 * @returns {Promise<Object>} 수정된 숙소 데이터
 */
export const updateAccommodation = async (accommodationId, formData) => {
  return await axios.patch(`/accommodations/${accommodationId}`, formData, {
    headers: {'Content-Type': 'multipart/form-data'}
  });
};

/**
 * 특정 숙소 이미지 삭제 요청
 * @param {string} accommodationId - 숙소 ID
 * @param {string} imageUrl - 삭제할 이미지 URL
 * @returns {Promise<void>}
 */
export const deleteAccommodationImage = async (accommodationId, imageUrl) => {
  return await axios.delete(`/accommodations/${accommodationId}/images`, {
    data: {imageUrl}
  });
};

/**
 * 특정 숙소의 객실 목록 가져오기
 * @param {string} accommodationId - 숙소 ID
 * @returns {Promise<Array>} 객실 목록
 */
export const fetchRoomList = async accommodationId => {
  try {
    const response = await axios.get(`/accommodations/${accommodationId}/rooms`);
    return response.data.availableRooms;
  } catch (error) {
    console.error('객실 목록 불러오기 실패:', error);
    return [];
  }
};

/**
 * 특정 숙소 상세 정보 가져오기 (ID 기반)
 * @param {string} accommodationId - 숙소 ID
 * @returns {Promise<Object>} 숙소 데이터
 */
export const fetchAccommodationById = async accommodationId => {
  try {
    const response = await axios.get(`/accommodations/${accommodationId}`);
    const data = response.data;

    // `coordinates.coordinates` 배열이 없을 경우 예외처리
    const coordinatesData = Array.isArray(data.coordinates?.coordinates)
      ? data.coordinates.coordinates
      : [126.978, 37.5665]; // 기본값 설정

    return {
      ...data,
      coordinates: {
        lat: coordinatesData[1] || '', // 위도
        lng: coordinatesData[0] || '' // 경도
      },
      location: data.location?._id || '',
      images: data.images || []
    };
  } catch (error) {
    console.error('숙소 정보 불러오기 오류:', error);
    throw new Error('숙소 정보를 불러오는 중 오류 발생');
  }
};

/**
 * 인기 숙소(조회수 높은 순) 가져오기
 * @returns {Promise<Array>} 인기 숙소 리스트
 */
export const fetchPopularAccommodations = async () => {
  try {
    const response = await axios.get('/accommodations/popular');
    return response.data.accommodations;
  } catch (error) {
    console.error('인기 숙소 불러오기 오류:', error);
    throw new Error('인기 숙소 데이터를 불러오는 중 오류가 발생했습니다.');
  }
};

/**
 * 특정 좌표 주변 숙소 가져오기
 * @param {number} lat 위도
 * @param {number} lng 경도
 * @param {number} maxDistance 검색 반경 (미터 단위, 기본값 5000m)
 * @param {number} limit 최대 결과 개수 (기본값 10개)
 * @returns {Promise<Array>} 주변 숙소 리스트
 */
export const fetchNearbyAccommodations = async (
  lat,
  lng,
  maxDistance = 5000,
  limit = 10
) => {
  try {
    const response = await axios.get('/accommodations/nearby', {
      params: {lat, lng, maxDistance, limit}
    });
    return response.data;
  } catch (error) {
    console.error('주변 숙소 조회 오류:', error);
    throw new Error('주변 숙소 데이터를 불러오는 중 오류 발생');
  }
};
