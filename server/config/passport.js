const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

/** 유저 아이디 자동 생성 */
const generateUniqueUserId = () =>
  `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

/** JWT 발급 (필요시 사용) */
const secretKey = process.env.JWT_SECRET || 'your_secret_key';
const generateToken = user => {
  console.log('[Debug] generateToken 호출. user.roles:', user.roles);
  return jwt.sign({id: user._id, roles: user.roles || ['user']}, secretKey, {
    expiresIn: '1h'
  });
};

/**
 * 공통 소셜 로그인 콜백 로직
 * 1) 소셜 ID 중복 체크 → 있으면 로그인
 * 2) 이메일 중복 체크 → 있으면 동일 provider라면 로그인, 다르면 에러
 * 3) 신규 가입
 */
const socialLoginCallback = async (
  accessToken,
  refreshToken,
  profile,
  done,
  provider
) => {
  try {
    console.log(`🔹 ${provider} 로그인 요청 - Profile:`, profile);

    /** 1) 프로필에서 이메일 추출 */
    let email = '';
    // provider별로 이메일이 어디 있는지 확인 필요
    if (provider === 'facebook') {
      // Facebook은 profile.emails가 있을 수도, 없을 수도 있음
      email = profile.emails?.[0]?.value || '';
    } else if (provider === 'naver') {
      // NaverStrategy는 profile.emails 배열이 있을 수도 있고, _json.email일 수도 있음
      email = profile.emails?.[0]?.value || profile._json?.email || '';
    } else if (provider === 'kakao') {
      // KakaoStrategy는 profile._json?.kakao_account?.email에 이메일이 있음
      email = profile._json?.kakao_account?.email || '';
    } else if (provider === 'google') {
      // Google은 profile.emails?.[0]?.value에 이메일이 있음
      email = profile.emails?.[0]?.value || '';
    }

    // 이메일이 없다면 에러 처리 (선택적)
    if (!email) {
      console.warn(`${provider}에서 이메일 정보를 가져올 수 없습니다.`);
      return done(null, false, {message: '이메일 정보가 없습니다.'});
    }

    /** 2) 소셜 ID 중복 체크: 같은 provider + same socialId */
    const existingUserBySocialId = await User.findOne({
      provider,
      socialId: profile.id
    });
    if (existingUserBySocialId) {
      // 이미 같은 소셜ID로 가입된 사용자
      console.log(`✅ 기존 ${provider} 사용자 (소셜ID 중복) 로그인`);
      return done(null, existingUserBySocialId);
    }

    /** 3) 이메일 중복 체크 */
    const existingUserByEmail = await User.findOne({email});
    if (existingUserByEmail) {
      // 같은 provider로 가입된 이메일이면 그대로 로그인
      if (existingUserByEmail.provider === provider) {
        console.log(`✅ 기존 ${provider} 사용자 (이메일 중복) 로그인`);
        return done(null, existingUserByEmail);
      }
      // 다른 provider로 가입된 이메일
      console.warn(`❌ 이미 ${existingUserByEmail.provider}로 가입된 이메일입니다.`);
      return done(null, false, {
        message: `이미 가입된 이메일입니다.`
      });
    }

    /** 4) 신규 가입 */
    const newUser = new User({
      userid: generateUniqueUserId(),
      provider,
      socialId: profile.id,
      email,
      username: profile.displayName || `${provider} User`,
      roles: ['user']
    });

    // 각 provider별로 phone, nickname 등 추가 프로필이 필요하다면 여기서 세팅
    if (provider === 'facebook' && profile.phone_number) {
      newUser.phone = profile.phone_number;
    } else if (provider === 'naver' && profile._json?.mobile) {
      newUser.phone = profile._json.mobile;
    } else if (provider === 'kakao' && profile._json?.kakao_account?.phone_number) {
      newUser.phone = profile._json.kakao_account.phone_number;
    }

    await newUser.save();
    console.log(`🚀 새 ${provider} 사용자 생성 완료!`);
    return done(null, newUser);
  } catch (err) {
    console.error(`🚨 ${provider} 로그인 중 오류 발생:`, err);
    return done(err, false);
  }
};

// ======================
//  각 소셜별 Strategy 설정
// ======================

/** Facebook */
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name']
    },
    (accessToken, refreshToken, profile, done) =>
      socialLoginCallback(accessToken, refreshToken, profile, done, 'facebook')
  )
);

/** Naver */
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_REDIRECT_URI
    },
    (accessToken, refreshToken, profile, done) =>
      socialLoginCallback(accessToken, refreshToken, profile, done, 'naver')
  )
);

/** Kakao */
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_REDIRECT_URI
    },
    (accessToken, refreshToken, profile, done) =>
      socialLoginCallback(accessToken, refreshToken, profile, done, 'kakao')
  )
);

/** Google */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    (accessToken, refreshToken, profile, done) =>
      socialLoginCallback(accessToken, refreshToken, profile, done, 'google')
  )
);

// ======================
//  세션 직렬화/역직렬화 (JWT 사용 시 보통 최소화 가능)
// ======================
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
