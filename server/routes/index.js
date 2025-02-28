// 메인 페이지 또는 루트 경로와 관련된 라우트 관리

const express = require('express');
const authRoutes = require('./authRoutes'); // 기존 라우터
const socialAuthRoutes = require('./socialAuthRoutes'); // 새로 생성한 소셜 로그인 라우터
const travelItemRoutes = require('./travelItemRoutes');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Express Server!'); // 웹 페이지에서 서버 접속 성공 시, 출력됨
});

router.use('/auth', authRoutes);
router.use('/auth', socialAuthRoutes); // '/api/auth'로 소셜 로그인 라우터 등록
router.use('/travelItems', travelItemRoutes);

module.exports = router;
