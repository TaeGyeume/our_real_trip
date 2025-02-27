import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '../../store/authStore';

const KakaoLoginCallback = () => {
  const setAuthState = useAuthStore(state => state.setAuthState); // Zustand 상태 업데이트 함
  const checkAuth = useAuthStore(state => state.checkAuth);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(' KakaoLoginCallback 호출됨');

    const handleKakaoLoginSuccess = async () => {
      try {
        // 로그인 상태를 true로 설정
        setAuthState({isAuthenticated: true});

        // 프로필 요청
        await checkAuth();

        console.log(' 카카오 로그인 성공, 메인 페이지로 이동');
        navigate('/main'); // 메인 페이지로 이동
      } catch (error) {
        console.error(' 카카오 로그인 실패:', error);
        navigate('/login'); // 로그인 실패 시 로그인 페이지로 이동
      }
    };

    handleKakaoLoginSuccess();
  }, [checkAuth, navigate, setAuthState]);

  return <div>카카오 로그인 처리 중입니다...</div>;
};

export default KakaoLoginCallback;
