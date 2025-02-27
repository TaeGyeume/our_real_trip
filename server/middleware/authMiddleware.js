const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');

// 🔹 인증이 필요하지 않은 API 목록 (조회용 API는 로그인 없이 접근 가능)
const PUBLIC_ROUTES = ['/api/favorites', '/api/public-data'];

const authMiddleware = async (req, res, next) => {
  // console.log('🛠 [Middleware] 요청된 쿠키:', req.cookies);
  // console.log('🛠 [Middleware] 요청된 헤더:', req.headers);

  let accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

  // 1 인증이 필요 없는 API 요청이면 인증 없이 진행 (next() 호출)
  if (PUBLIC_ROUTES.includes(req.path)) {
    // console.log(' [Middleware] 인증이 필요 없는 요청 → 인증 없이 진행');
    return next(); // 바로 컨트롤러로 이동
  }

  // 2️ accessToken이 없을 경우, refreshToken을 검사하여 새 accessToken 발급
  if (!accessToken) {
    // console.log(' [Middleware] 액세스 토큰이 없음 → 리프레시 토큰 확인');

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      // console.warn(' [Middleware] 리프레시 토큰도 없음 → 로그인 필요');
      req.user = null; // 로그인하지 않은 사용자
      return next();
      return res.status(401).json({message: '로그인이 필요합니다.'});
    }

    try {
      //  3️ 리프레시 토큰 검증
      const decodedRefreshToken = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      // console.log(' [Middleware] 리프레시 토큰 검증 성공:', decodedRefreshToken);

      // 4️ DB에서 리프레시 토큰 확인
      const storedToken = await RefreshToken.findOne({
        userId: decodedRefreshToken.id,
        token: refreshToken
      });

      if (!storedToken) {
        // console.error(' [Middleware] 리프레시 토큰이 DB에 없음 → 403 Forbidden');
        return res.status(403).json({message: '유효하지 않은 리프레시 토큰입니다.'});
      }

      //  5️ 새로운 accessToken 발급
      accessToken = jwt.sign(
        {id: decodedRefreshToken.id, roles: decodedRefreshToken.roles},
        process.env.JWT_SECRET,
        {expiresIn: '15m'}
      );

      // console.log(' [Middleware] 새로 발급된 액세스 토큰:', accessToken);

      //6️ 새로운 accessToken을 쿠키에 저장
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/',
        maxAge: 15 * 60 * 1000
      });

      // 7️ accessToken이 발급되었으므로 요청에 추가하여 계속 진행
      req.user = jwt.verify(accessToken, process.env.JWT_SECRET);
      return next();
    } catch (error) {
      // console.error('[Middleware] 리프레시 토큰 검증 실패:', error.message);
      return res.status(403).json({message: '유효하지 않은 리프레시 토큰입니다.'});
    }
  }

  // 8️ accessToken이 있으면 검증 후 요청 진행
  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decodedToken;
    // console.log('[Middleware] 인증된 사용자:', req.user);
    next();
  } catch (error) {
    // console.error('[Middleware] 액세스 토큰 검증 실패:', error.message);
    return res.status(401).json({message: '토큰이 만료되었습니다. 다시 로그인해주세요.'});
  }
};

module.exports = authMiddleware;
