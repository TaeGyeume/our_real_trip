import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '../../store/authStore';

const NaverLoginCallback = () => {
  const setAuthState = useAuthStore(state => state.setAuthState); // 상태 업데이트 함수 추
  const checkAuth = useAuthStore(state => state.checkAuth);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(' NaverLoginCallback 호출됨');

    const handleNaverLoginSuccess = async () => {
      try {
        // 로그인 상태를 true로 설정
        setAuthState({isAuthenticated: true});

        // 프로필 요청
        await checkAuth();

        console.log(' 네이버 로그인 성공, 메인 페이지로 이동');
        navigate('/main');
      } catch (error) {
        console.error(' 네이버 로그인 실패:', error);
        navigate('/login'); // 인증 실패 시 로그인 페이지로 이동
      }
    };

    handleNaverLoginSuccess();
  }, [checkAuth, navigate, setAuthState]);

  return <div>로그인 처리 중입니다...</div>;
};

export default NaverLoginCallback;
