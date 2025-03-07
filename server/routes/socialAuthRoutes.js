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

// Google 로그인 시작 (GET /api/auth/google)
router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));

// Google 로그인 콜백
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {session: false}, (err, user, info) => {
    if (err) {
      console.error('Google 로그인 중 오류 발생:', err);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent('server')}`
      );
    }
    if (!user) {
      console.warn('Google 로그인 실패:', info?.message);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(info?.message || '로그인 실패')}`
      );
    }
    const tokens = generateTokens(user);

    // 액세스 토큰 저장
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 리프레시 토큰 저장
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('Google 로그인 성공:', user.email);
    res.redirect(`${process.env.CLIENT_URL}/google/callback`);
  })(req, res, next);
});

// =======================
//  페이스북 로그인 라우터
// =======================

// 페이스북 로그인 시작
router.get('/facebook', passport.authenticate('facebook', {scope: ['email']}));

// 페이스북 콜백 처리
router.get('/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', {session: false}, (err, user, info) => {
    if (err) {
      console.error('Facebook 로그인 중 오류 발생:', err);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent('server')}`
      );
    }
    if (!user) {
      console.warn('Facebook 로그인 실패:', info?.message);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(info?.message || '로그인 실패')}`
      );
    }
    const tokens = generateTokens(user);

    // 액세스 토큰 저장
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 리프레시 토큰 저장
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.CLIENT_URL}/facebook/callback`);
  })(req, res, next);
});

// =======================
//  네이버 로그인 라우터
// =======================

router.get('/naver', passport.authenticate('naver'));

// 네이버 콜백 처리
router.get('/naver/callback', (req, res, next) => {
  passport.authenticate('naver', {session: false}, (err, user, info) => {
    if (err) {
      console.error('네이버 로그인 중 오류 발생:', err);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent('server')}`
      );
    }
    if (!user) {
      console.warn('네이버 로그인 실패:', info?.message);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(info?.message || '로그인 실패')}`
      );
    }

    const tokens = generateTokens(user);

    // 액세스 토큰 저장
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 리프레시 토큰 저장
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.CLIENT_URL}/naver/callback`);
  })(req, res, next);
});

// =======================
//  카카오 로그인 라우터
// =======================

// 카카오 로그인 시작
router.get('/kakao', passport.authenticate('kakao'));

// 카카오 콜백 처리
router.get('/kakao/callback', (req, res, next) => {
  passport.authenticate('kakao', {session: false}, (err, user, info) => {
    if (err) {
      console.error('카카오 로그인 중 오류 발생:', err);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent('server')}`
      );
    }
    if (!user) {
      console.warn('카카오 로그인 실패:', info?.message);
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(info?.message || '로그인 실패')}`
      );
    }
    const tokens = generateTokens(user);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.CLIENT_URL}/kakao/callback`);
  })(req, res, next);
});

module.exports = router;
