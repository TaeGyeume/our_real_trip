import api from '../axios';

// const API_BASE_URL = 'http://localhost:5000/api/packages'; // 로컬 API 경로

// 패키지 생성에 필요한 데이터 가져오기 (숙소, 투어/티켓, 항공)
export const getCreatePackageData = async () => {
  try {
    const response = await api.get('/packages/create');
    return response.data;
  } catch (error) {
    console.error('패키지 생성 데이터 가져오기 실패:', error);
    throw error;
  }
};

//  패키지 등록
export const createPackage = async packageData => {
  try {
    // POST로 패키지 생성 요청
    const response = await api.post('/packages', packageData); // 기존 경로 '/api/packages/create' 대신 '/api/packages'로 수정
    return response.data;
  } catch (error) {
    console.error('패키지 등록 실패:', error);
    throw error;
  }
};

//  패키지 목록 조회 (페이징, 검색 가능)
export const getPackages = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await api.get('/packages', {
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
    const response = await api.get(`packages/${id}`);
    return response.data;
  } catch (error) {
    console.error('패키지 조회 실패:', error);
    throw error;
  }
};

//  패키지 수정
export const updatePackage = async (id, updateData) => {
  try {
    const response = await api.put(`packages/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('패키지 수정 실패:', error);
    throw error;
  }
};

//  패키지 삭제
export const deletePackage = async id => {
  try {
    const response = await api.delete(`packages/${id}`);
    return response.data;
  } catch (error) {
    console.error('패키지 삭제 실패:', error);
    throw error;
  }
};
