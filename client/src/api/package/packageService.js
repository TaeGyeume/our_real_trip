import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/packages'; // 로컬 API 경로

// Axios 인스턴스 생성 (쿠키 only 설정)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true //  쿠키 기반 인증 설정
});

//  패키지 등록
export const createPackage = async packageData => {
  try {
    const response = await api.post('/', packageData);
    return response.data;
  } catch (error) {
    console.error('패키지 등록 실패:', error);
    throw error;
  }
};

//  패키지 목록 조회 (페이징, 검색 가능)
export const getPackages = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await api.get('/', {
      params: {page, limit, search}
    });
    return response.data;
  } catch (error) {
    console.error('패키지 목록 조회 실패:', error);
    throw error;
  }
};

//  패키지 상세 조회
export const getPackageById = async id => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('패키지 조회 실패:', error);
    throw error;
  }
};

//  패키지 수정
export const updatePackage = async (id, updateData) => {
  try {
    const response = await api.put(`/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('패키지 수정 실패:', error);
    throw error;
  }
};

//  패키지 삭제
export const deletePackage = async id => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('패키지 삭제 실패:', error);
    throw error;
  }
};
