import {useEffect, useCallback} from 'react';
import {useAuthStore} from '../../store/authStore';
import {useNavigate} from 'react-router-dom';

const FacebookLoginCallback = () => {
  const setAuthState = useAuthStore(state => state.setAuthState);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const navigate = useNavigate();

  //  useCallback을 사용하여 함수 메모이제이션 (불필요한 재생성 방지)
  const handleFacebookLoginSuccess = useCallback(async () => {
    try {
      console.log('Facebook 로그인 성공, isAuthenticated 설정 중');
      setAuthState({isAuthenticated: true});
      await checkAuth();
      console.log('프로필 요청 성공, 메인 페이지로 이동');
      navigate('/main');
    } catch (error) {
      console.error('Facebook 로그인 후 인증 실패:', error);
      navigate('/login');
    }
  }, [setAuthState, checkAuth, navigate]); //  의존성 추가

  useEffect(() => {
    console.log('FacebookLoginCallback 호출됨');
    handleFacebookLoginSuccess();
  }, [handleFacebookLoginSuccess]); //  useEffect 의존성 배열 추가

  return <div>로그인 처리 중...</div>;
};

export default FacebookLoginCallback;
