// 메인 페이지 또는 루트 경로와 관련된 라우트 관리

const express = require('express');
const authRoutes = require('./authRoutes'); // 기존 라우터
const socialAuthRoutes = require('./socialAuthRoutes'); // 새로 생성한 소셜 로그인 라우터
const travelItemRoutes = require('./travelItemRoutes');
const accommodationRoutes = require('./accommodationRoutes');
const bookingRoutes = require('./bookingRoutes');
const couponRoutes = require('./couponRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const flightRoutes = require('./flightRoutes');
const locationRoutes = require('./locationRoutes');
const notificationRoutes = require('./notificationRoutes');
const packageRoutes = require('./packageRoutes');
const productRoutes = require('./productRoutes');
const qnaRoutes = require('./qnaRoutes');
const reviewRoutes = require('./reviewRoutes');
const roomRoutes = require('./roomRoutes');
const userCouponRoutes = require('./userCouponRoutes');
const userMileageRoutes = require('./userMileageRoutes');
const userTourTicketRoutes = require('./tourTicket/userTourTicketRoutes');
const TourTicketRoutes = require('./tourTicket/tourTicketRoutes');
const viewsRoutes = require('./viewsRoutes');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Express Server!'); // 웹 페이지에서 서버 접속 성공 시, 출력됨
});

router.use('/auth', authRoutes);
router.use('/auth', socialAuthRoutes); // '/api/auth'로 소셜 로그인 라우터 등록
router.use('/travelItems', travelItemRoutes);
router.use('/accommodations', accommodationRoutes);
router.use('/booking', bookingRoutes);
router.use('/coupons', couponRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/flights', flightRoutes);
router.use('/locations', locationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/packages', packageRoutes);
router.use('/product', productRoutes);
router.use('/qna', qnaRoutes);
router.use('/reviews', reviewRoutes);
router.use('/rooms', roomRoutes);
router.use('/user-coupons', userCouponRoutes);
router.use('/mileage', userMileageRoutes);
router.use('/tourTicket', userTourTicketRoutes);
router.use('/tourTicket', TourTicketRoutes);
router.use('/views', viewsRoutes);

module.exports = router;
