const express = require('express');
const cookieOptions = require('./config/cookieConfig'); // 쿠키 설정 불러오기
const cors = require('cors');
const routes = require('./routes');
const connectDB = require('./config/db');
const passport = require('passport'); // Passport 불러오기
const busboy = require('connect-busboy');

require('./config/passport'); // Passport 설정 파일 불러오기
require('dotenv').config();
require('./models/TourTicket');
require('./models/Accommodation');
require('./models/Flight');

const favoriteRoutes = require('./routes/favoriteRoutes');
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const accommodationRoutes = require('./routes/accommodationRoutes');
const roomRoutes = require('./routes/roomRoutes');
const productRoutes = require('./routes/productRoutes');
const flightRoutes = require('./routes/flightRoutes');
const socialAuthRoutes = require('./routes/socialAuthRoutes');
const userTourTicketRoutes = require('./routes/tourTicket/userTourTicketRoutes');
const travelItemRoutes = require('./routes/travelItemRoutes');
const authMiddleware = require('./middleware/authMiddleware'); // JWT 인증 미들웨어 추가
const authorizeRoles = require('./middleware/authorizeRoles'); // 역할 기반 접근 제어 추가
const bookingRoutes = require('./routes/bookingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const userCouponRoutes = require('./routes/userCouponRoutes');
const userMileageRoutes = require('./routes/userMileageRoutes');
const qnaRoutes = require('./routes/qnaRoutes'); //
const reviewRoutes = require('./routes/reviewRoutes');
const viewsRoutes = require('./routes/viewsRoutes');

const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// DB 연결
connectDB();

const corsOptions = {
  origin: `http://localhost:${process.env.CLIENT_PORT || 3000}`,
  credentials: true, // 쿠키를 포함한 요청 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  exposedHeaders: ['set-cookie']
};

app.use(
  busboy({
    highWaterMark: 2 * 1024 * 1024, // 2MB로 설정하여 메모리 안정화
    limits: {
      files: 10, // 최대 10개 파일 업로드 허용
      fileSize: 10 * 1024 * 1024 // 최대 10MB 제한
    }
  })
);

// 미들웨어 설정
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(passport.initialize()); // Passport 초기화 추가

// 라우트 설정
app.use('/', routes);
app.use('/api/favorites', favoriteRoutes); // '/api/favorites' 경로로 라우터 연결
app.use('/api/locations', locationRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', socialAuthRoutes); // 소셜 로그인 라우트 추가
app.use('/api/flights', flightRoutes);
app.use('/api/mileage', userMileageRoutes); // 마일리지 API
app.use('/api/travelItems', travelItemRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/user-coupons', userCouponRoutes);
app.use('/api/views', viewsRoutes);
app.use('/product', productRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/tourTicket', userTourTicketRoutes);
app.use('/booking', bookingRoutes);
app.use('/api/qna', qnaRoutes);
app.use('/reviews', reviewRoutes);

//테스트용
app.post('/api/admin', authMiddleware, authorizeRoles('admin'), (req, res) => {
  res.json({message: '관리자 전용 페이지'});
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('서버 오류가 발생했습니다.');
});

module.exports = app;
