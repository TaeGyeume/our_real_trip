import api from '../axios';

// 모든 항공편 가져오기
export const fetchFlights = async () => {
  try {
    const response = await api.get('/flights'); // URL 명확히 설정
    return response.data;
  } catch (error) {
    console.error('모든 항공편 데이터를 불러오는 데 실패했습니다:', error);
    return [];
  }
};

// 검색된 항공편 가져오기
export const searchFlights = async (departure, arrival, date, passengers) => {
  try {
    console.log(
      `검색 요청: ${departure} → ${arrival}, 날짜: ${date}, 인원: ${passengers}`
    );

    const response = await api.get('/flights/search', {
      params: {departure, arrival, date, passengers} // 쿼리 파라미터 적용
    });

    console.log('검색 결과:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // 서버가 응답한 경우 (4xx, 5xx)
      console.error(`검색 API 오류 [${error.response.status}]:`, error.response.data);
    } else if (error.request) {
      // 요청은 보내졌지만 응답을 받지 못한 경우
      console.error('검색 API 응답 없음:', error.request);
    } else {
      // 요청 자체가 실패한 경우
      console.error('검색 API 요청 실패:', error.message);
    }
    return [];
  }
};

// ✈️ 모든 항공편 조회 (GET)
export const getFlights = async () => {
  try {
    const response = await api.get('/flights/list');
    return response.data;
  } catch (error) {
    console.error('항공편 목록 조회 오류:', error);
    throw error;
  }
};

// ✈️ 특정 항공편 조회 (GET)
export const getFlightById = async id => {
  try {
    const response = await api.get(`/flights/${id}`);
    return response.data;
  } catch (error) {
    console.error('항공편 조회 오류:', error);
    throw error;
  }
};

// ✈️ 항공편 추가 (POST)
export const createFlight = async flightData => {
  try {
    const response = await api.post('/flights/create', flightData);
    return response.data;
  } catch (error) {
    console.error('항공편 추가 오류:', error);
    throw error;
  }
};

// ✈️ 항공편 수정 (PUT)
export const updateFlight = async (id, flightData) => {
  try {
    const response = await api.put(`/flights/${id}`, flightData);
    return response.data;
  } catch (error) {
    console.error('항공편 수정 오류:', error);
    throw error;
  }
};

// ✈️ 항공편 삭제 (DELETE)
export const deleteFlight = async id => {
  try {
    await api.delete(`/flights/${id}`);
  } catch (error) {
    console.error('항공편 삭제 오류:', error);
    throw error;
  }
};
