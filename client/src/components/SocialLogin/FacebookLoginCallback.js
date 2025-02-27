import {useEffect} from 'react';
import {useAuthStore} from '../../store/authStore';
import {useNavigate} from 'react-router-dom';

const FacebookLoginCallback = () => {
  const setAuthState = useAuthStore(state => state.setAuthState); // Zustand의 상태 업데이트 함수 가져오
  const checkAuth = useAuthStore(state => state.checkAuth);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(' FacebookLoginCallback 호출됨');

    const handleFacebookLoginSuccess = async () => {
      try {
        // console.log(' 페이스북 로그인 성공, isAuthenticated 설정 중');
        setAuthState({isAuthenticated: true}); // 로그인 상태 설정
        await checkAuth(); // 프로필 요청
        // console.log(' 프로필 요청 성공, 메인 페이지로 이동');
        navigate('/main');
      } catch (error) {
        // console.error(' 페이스북 로그인 후 인증 실패:', error);
        navigate('/login');
      }
    };

    handleFacebookLoginSuccess();
  }, []);

  return <div>로그인 처리 중...</div>;
};

export default FacebookLoginCallback;
