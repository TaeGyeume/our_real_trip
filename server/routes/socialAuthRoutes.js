const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT 토큰 생성 함수
const generateTokens = user => {
  const accessToken = jwt.sign(
    {id: user._id, provider: user.provider, roles: user.roles},
    process.env.JWT_SECRET,
    {expiresIn: process.env.JWT_EXPIRES_IN}
  );

  const refreshToken = jwt.sign(
    {id: user._id, provider: user.provider, roles: user.roles},
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN}
  );

  return {accessToken, refreshToken};
};
// =======================
//  Google 로그인 라우터
// =======================

// Google 로그인 시작
router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));

// Google 콜백 처리
router.get(
  '/google/callback',
  passport.authenticate('google', {session: false}),
  (req, res) => {
    const tokens = generateTokens(req.user);

    // 액세스 토큰 저장
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    // 리프레시 토큰 저장
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    // 클라이언트로 리디렉션
    res.redirect(`${process.env.CLIENT_URL}/google/callback`);
  }
);

// =======================
// 페이스북 로그인 라우터
// =======================

// 페이스북 로그인 시작
router.get('/facebook', passport.authenticate('facebook', {scope: ['email']}));

// 페이스북 콜백 처리
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {session: false}),
  (req, res) => {
    const tokens = generateTokens(req.user);

    // 액세스 토큰을 httpOnly 쿠키로 저장
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 15 * 60 * 1000 // 15분
    });

    // 리프레시 토큰을 httpOnly 쿠키로 저장
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    // 클라이언트로 리디렉션
    res.redirect(`${process.env.CLIENT_URL}/facebook/callback`);
  }
);

// =======================
// 네이버 로그인 라우터
// =======================
// 네이버 로그인 시작
router.get('/naver', passport.authenticate('naver'));

// 네이버 콜백 처리
router.get(
  '/naver/callback',
  passport.authenticate('naver', {session: false}),
  (req, res) => {
    const tokens = generateTokens(req.user);

    // 액세스 토큰 저장
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 15 * 60 * 1000 // 15분
    });

    // 리프레시 토큰 저장
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    res.redirect(`${process.env.CLIENT_URL}/naver/callback`);
  }
);

// =======================
// 카카오 로그인 라우터
// =======================

// 카카오 로그인 시작
router.get('/kakao', passport.authenticate('kakao'));

// 카카오 콜백 처리
router.get(
  '/kakao/callback',
  passport.authenticate('kakao', {session: false}),
  (req, res) => {
    const tokens = generateTokens(req.user);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.CLIENT_URL}/kakao/callback`);
  }
);

module.exports = router;
