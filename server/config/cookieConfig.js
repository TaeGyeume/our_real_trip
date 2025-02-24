const cookieOptions = {
  httpOnly: true, // 클라이언트에서 쿠키 접근 불가
  secure: false, // 로컬 환경에서는 HTTPS가 아니므로 false
  // secure: process.env.NODE_ENV === "production"? true : false,  // 프로덕션 환경에서만 true
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
  path: '/' // 전체 경로에서 쿠키 사용
};

module.exports = cookieOptions;
