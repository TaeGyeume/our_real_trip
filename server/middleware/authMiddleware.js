const jwt = require('jsonwebtoken');
const cookieOptions = require('../config/cookieConfig');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User'); //  유저 정보 가져오기 위해 추가

const authMiddleware = async (req, res, next) => {
  // console.log(' 요청된 쿠키:', req.cookies);
  // console.log(‘ 요청된 헤더:', req.headers);

  const accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

  // if (!accessToken) {
  //   console.log(' 액세스 토큰이 없음. 401 Unauthorized 발생');
  //   return res.status(401).json({message: '인증이 필요합니다.'});
  // }

  try {
    // 액세스 토큰 검증 및 user 정보 추출
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decodedToken;
    // console.log(' 인증된 사용자:', req.user);
    next();
  } catch (error) {
    // console.error(' 액세스 토큰 검증 실패:', error.message);

    // **🔹 더 이상 `refreshToken` 검증하지 않고, 401을 반환**
    return res.status(401).json({message: '토큰이 만료되었습니다. 다시 로그인해주세요.'});
  }
};
module.exports = authMiddleware;
