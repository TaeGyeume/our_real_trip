import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 20000, // 서버 초기 로딩 시간 증가시켜 타임아웃 방지
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
  response => response, // 정상 응답이면 그대로 반환
  async error => {
    const originalRequest = error.config;

    // 401 Unauthorized 발생 시 리프레시 토큰 요청을 시도해야 함
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        console.log(' [클라이언트] 리프레시 토큰 요청 시작');
        const res = await api.post('/auth/refresh-token');

        if (res.status === 200 && res.data.accessToken) {
          console.log(' [클라이언트] 리프레시 토큰 갱신 성공:', res.data.accessToken);
          const newAccessToken = res.data.accessToken;

          // 새 액세스 토큰 저장
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);

          isRefreshing = false;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error(' [클라이언트] 리프레시 토큰 갱신 실패:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        window.location.href = '/login'; // 로그인 페이지로 리디렉트
      }
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
