import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '../../store/authStore';

const GoogleLoginCallback = () => {
  const setAuthState = useAuthStore(state => state.setAuthState);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(' GoogleLoginCallback 호출됨');

    const handleGoogleLoginSuccess = async () => {
      try {
        setAuthState({isAuthenticated: true});
        await checkAuth();
        console.log(' Google 로그인 성공 메인 페이지로 이동');
        navigate('/main');
      } catch (error) {
        console.error(' Google 로그인 실패:', error);
        navigate('/login');
      }
    };

    handleGoogleLoginSuccess();
  }, [checkAuth, navigate, setAuthState]);

  return <div>Google 로그인 처리 중입니다...</div>;
};

export default GoogleLoginCallback;
