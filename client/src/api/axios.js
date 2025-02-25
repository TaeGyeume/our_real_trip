import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 서버 초기 로딩 시간 증가시켜 타임아웃 방지
  withCredentials: true // httpOnly 쿠키 전송 허용
});

let isRefreshing = false;
let failedQueue = []; // 실패한 요청 큐 (리프레시 완료 후 재요청 처리)

// 요청 큐 관리 함수
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 응답 인터셉터
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // 401 Unauthorized 에러 처리 (액세스 토큰 만료 시)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // 현재 리프레시 중일 경우 큐에 요청 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            // 새로 발급된 액세스 토큰으로 헤더 업데이트 후 재요청
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // 리프레시 토큰 API 요청
        const res = await api.post('/auth/refresh-token');

        if (res.status === 200 && res.data.accessToken) {
          console.log('리프레시 토큰 갱신 성공');
          const newAccessToken = res.data.accessToken;

          // 새 액세스 토큰을 Authorization 헤더에 저장
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);

          isRefreshing = false;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest); // 원래 요청 재시도
        }
      } catch (refreshError) {
        console.error(
          '리프레시 토큰 갱신 실패:',
          refreshError.response?.data?.message || refreshError.message
        );
        processQueue(refreshError, null);
        isRefreshing = false;

        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
      }
    }

    // 403 Forbidden 접근 권한 없음 -> 로그인 페이지 이동
    if (error.response?.status === 403) {
      console.error('접근 권한 없음, 로그인 페이지로 이동');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// 로그아웃 함수 추가
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout', {}, {withCredentials: true});
    return response.data;
  } catch (error) {
    console.error('로그아웃 실패:', error);
  }
};

export default api;
