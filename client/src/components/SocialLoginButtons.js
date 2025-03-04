import React from 'react';

// 환경 변수를 활용한 API URL 설정 (개발/배포 자동 감지)
const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SocialLoginButtons = () => {
  // 페이스북 로그인 핸들러
  const handleFacebookLogin = () => {
    window.location.href = `${SERVER_URL}/auth/facebook`;
  };

  // 네이버 로그인 핸들러
  const handleNaverLogin = () => {
    window.location.href = `${SERVER_URL}/auth/naver`;
  };

  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => {
    window.location.href = `${SERVER_URL}/auth/kakao`;
  };

  // Google 로그인 핸들러
  const handleGoogleLogin = () => {
    window.location.href = `${SERVER_URL}/auth/google`;
  };

  return (
    <div>
      {/* 페이스북 로그인 버튼 */}
      <button
        onClick={handleFacebookLogin}
        className="btn btn-primary"
        style={{marginBottom: '10px'}}>
        Facebook으로 로그인
      </button>
      <br />

      {/* 네이버 로그인 버튼 */}
      <button
        onClick={handleNaverLogin}
        className="btn btn-success"
        style={{marginBottom: '10px'}}>
        Naver로 로그인
      </button>
      <br />

      {/* 카카오 로그인 버튼 */}
      <button
        onClick={handleKakaoLogin}
        className="btn btn-warning"
        style={{marginBottom: '10px'}}>
        Kakao로 로그인
      </button>
      <br />

      {/* Google 로그인 버튼 */}
      <button onClick={handleGoogleLogin} className="btn btn-danger">
        Google로 로그인
      </button>
    </div>
  );
};

export default SocialLoginButtons;
