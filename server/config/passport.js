const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // User 모델 불러오기
const jwt = require('jsonwebtoken');

const generateUniqueUserId = () =>
  `user_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;
const secretKey = process.env.JWT_SECRET || 'your_secret_key';

//  JWT 발급 함수
const generateToken = user => {
  console.log(
    ' generateToken 함수안 에 1라인 콘솔로그 JWT 발급 전 user.roles:',
    user.roles
  ); //  roles 값 확인
  return jwt.sign({id: user._id, roles: user.roles || ['user']}, secretKey, {
    expiresIn: '1h'
  });
};

//  Passport 전략에 JWT 발급 로직 추가
const socialLoginCallback = async (
  accessToken,
  refreshToken,
  profile,
  done,
  provider
) => {
  try {
    console.log(`🔹 ${provider} 로그인 요청 - Profile:`, profile);

    const email = profile.emails?.[0]?.value || '';

    //  동일한 이메일을 가진 기존 사용자 찾기
    let user = await User.findOne({email});

    if (user) {
      //  같은 provider라면 그대로 로그인
      if (user.provider === provider) {
        console.log(` 기존 ${provider} 사용자 로그인`);
        return done(null, user);
      }

      //  다른 provider로 가입된 이메일이라면 로그인 불가 처리
      console.log(` 이미 다른 소셜 계정(${user.provider})으로 가입된 이메일입니다.`);
      return done(null, false, {message: '이미 가입된 회원입니다.'});
    }

    //  새로운 사용자 생성
    user = new User({
      userid: generateUniqueUserId(),
      provider,
      socialId: profile.id,
      email,
      username: profile.displayName || `${provider} User`,
      roles: ['user']
    });

    await user.save();
    console.log(` 새 ${provider} 사용자 생성 완료!`);

    return done(null, user);
  } catch (err) {
    console.error(` ${provider} 로그인 중 오류 발생:`, err);
    return done(err, false);
  }
};

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

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

//  Google 로그인 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL // Google OAuth 콜백 URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(`🔹 Google OAuth 프로필:`, profile);

        const email = profile.emails?.[0]?.value || '';

        // 1️ **이메일 중복 확인**
        let existingUser = await User.findOne({email});

        if (existingUser) {
          if (existingUser.provider === 'google') {
            // console.log(` 기존 Google 사용자 로그인`);
            return done(null, existingUser);
          }
          console.log(
            ` 이미 다른 소셜 계정(${existingUser.provider})으로 가입된 이메일입니다.`
          );
          return done(null, false, {message: '이미 가입된 회원입니다.'});
        }

        // 2️ **새 사용자 생성**
        const newUser = new User({
          userid: generateUniqueUserId(),
          provider: 'google',
          socialId: profile.id,
          email,
          username: profile.displayName || 'Google User',
          roles: ['user']
        });

        await newUser.save();
        console.log(` 새 Google 사용자 생성 완료!`);

        return done(null, newUser);
      } catch (err) {
        console.error(` Google 로그인 중 오류 발생:`, err);
        return done(err, false);
      }
    }
  )
);

// 페이스북 설정
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID, // .env 파일에서 페이스북 앱 ID 불러오기
      clientSecret: process.env.FACEBOOK_APP_SECRET, // .env 파일에서 페이스북 앱 시크릿 불러오기
      callbackURL: process.env.FACEBOOK_CALLBACK_URL, // 콜백 URL 설정
      profileFields: ['id', 'emails', 'name'] // 가져올 페이스북 프로필 필드 설정
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 페이스북 소셜 ID로 기존 사용자 찾기
        let user = await User.findOne({provider: 'facebook', socialId: profile.id});
        if (!user) {
          // 새 사용자 생성
          user = new User({
            userid: generateUniqueUserId(),
            provider: 'facebook',
            socialId: profile.id,
            email: profile.emails ? profile.emails[0].value : '',
            username: `${profile.name.givenName} ${profile.name.familyName}`,
            phone: profile.phone_number ? profile.phone_number : undefined
            // null 대신 undefined로 설정하여 저장 방지
          });
          await user.save();
        }
        return done(null, user); // 사용자 반환
      } catch (err) {
        return done(err, null); // 에러 처리
      }
    }
  )
);

// 네이버 전략 설정
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_REDIRECT_URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 네이버에서 받은 프로필 정보
        const naverProfile = profile._json;

        // 기존 사용자 찾기
        let user = await User.findOne({provider: 'naver', socialId: profile.id});

        if (!user) {
          // 새 사용자 생성
          user = new User({
            userid: generateUniqueUserId(),
            provider: 'naver',
            socialId: profile.id,
            email: naverProfile.email || '', // 네이버에서 제공하는 이메일
            username: naverProfile.nickname || 'Naver User', // 닉네임이 없을 경우 기본값
            phone: profile.phone_number ? profile.phone_number : undefined
            // null 대신 undefined로 설정하여 저장 방지
          });
          await user.save();
        }

        return done(null, user); // 로그인 성공
      } catch (err) {
        return done(err, null); // 에러 처리
      }
    }
  )
);

// 카카오 전략 설정
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET, // 클라이언트 시크릿 키는 선택 사항
      callbackURL: process.env.KAKAO_REDIRECT_URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const kakaoProfile = profile._json;

        let user = await User.findOne({provider: 'kakao', socialId: profile.id});

        if (!user) {
          user = new User({
            userid: generateUniqueUserId(), //  userid 자동 생성
            provider: 'kakao',
            socialId: profile.id,
            email: kakaoProfile.kakao_account?.email || '',
            username: kakaoProfile.properties?.nickname || 'Kakao User',
            phone: profile.phone_number || undefined // null 대신 undefined로 설정하여 저장 방지
          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Passport 세션 설정 (JWT 사용 시 필요 없지만 기본 구조 유지)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
