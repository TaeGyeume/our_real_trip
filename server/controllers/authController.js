const authService = require('../services/authService');
const cookieOptions = require('../config/cookieConfig');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken'); //  추가

//  아이디 찾기 컨트롤러 (이메일 입력 → 인증 코드 발송)
exports.findUserId = async (req, res) => {
  try {
    const {email} = req.body;

    //  요청 데이터 확인
    // console.log(' [컨트롤러] 클라이언트에서 받은 이메일:', email);

    if (!email) {
      return res.status(400).json({message: '이메일을 입력해주세요.'});
    }

    //  서비스 호출 로그
    // console.log(' [컨트롤러] authService.findUserIdByEmail 호출');

    const response = await authService.findUserIdByEmail(email);

    //  응답 로그 확인
    // console.log(' [컨트롤러] 서비스에서 반환된 응답:', response);

    return res.status(200).json(response);
  } catch (error) {
    console.error(' [컨트롤러] 아이디 찾기 중 오류 발생:', error.message);
    res.status(500).json({message: '아이디 찾기 중 오류 발생', error: error.message});
  }
};

exports.verifyCodeAndFindUserId = async (req, res) => {
  try {
    const {email, verificationCode} = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({message: '이메일과 인증 코드를 모두 입력해주세요.'});
    }

    console.log(' [서버] 인증 코드 확인 요청:', email, verificationCode);

    // 서비스에서 인증 코드 검증 후 아이디 찾기
    const isVerified = await authService.verifyCode(email, verificationCode);

    if (isVerified) {
      const user = await User.findOne({email});
      if (!user) {
        throw new Error('이메일에 해당하는 사용자가 없습니다.');
      }
      return res.status(200).json({userId: user.userid, message: '아이디 찾기 성공'});
    } else {
      throw new Error('인증 코드가 유효하지 않습니다.');
    }
  } catch (error) {
    console.error(' [서버] 인증 코드 검증 실패:', error.message);
    res.status(500).json({message: '인증 코드 검증 실패', error: error.message});
  }
};

// 아이디, 이메일, 전화번호 중복 확인 컨트롤러
exports.checkDuplicate = async (req, res) => {
  try {
    const response = await authService.checkDuplicate(req.body);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({message: error.message});
  }
};

// 회원가입 컨트롤러
exports.register = async (req, res) => {
  try {
    const response = await authService.registerUser(req.body);
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({message: error.message});
  }
};

// 로그인 컨트롤러 (액세스 및 리프레시 토큰 설정)
exports.login = async (req, res) => {
  try {
    // 로그인 서비스 호출
    const {user} = await authService.loginUser(req.body, res);

    // 성공 시 사용자 정보 응답
    return res.status(200).json({success: true, user});
  } catch (error) {
    console.error('로그인 오류:', error.message);

    // ❌ 기존: 400 에러 응답 → 클라이언트 콘솔에 Bad Request 표시됨
    // res.status(400).json({ message: '아이디 또는 비밀번호를 확인해주세요.' });

    // ✅ 변경: 200 OK 응답, but success: false 로 로그인 실패 처리
    return res
      .status(200)
      .json({success: false, message: '아이디 또는 비밀번호를 확인해주세요.'});
  }
};

// 사용자 프로필 조회 컨트롤러
exports.getUserProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({message: error.message});
  }
};

// 사용자 프로필 수정 컨트롤러
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const response = await authService.updateProfile(userId, updateData);

    res.status(200).json(response);
  } catch (error) {
    console.error('프로필 업데이트 오류:', error.message);
    res.status(400).json({message: error.message || '서버 오류가 발생했습니다.'});
  }
};

// 비밀번호 변경 컨트롤러
exports.changePassword = async (req, res) => {
  try {
    const response = await authService.changePassword(req.user.id, req.body);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({message: error.message});
  }
};

// 비밀번호 찾기 컨트롤러
exports.forgotPassword = async (req, res) => {
  try {
    const response = await authService.forgotPassword(req.body.email);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({message: error.message});
  }
};

// 비밀번호 재설정 컨트롤러
exports.resetPassword = async (req, res) => {
  try {
    const {token, currentPassword, newPassword} = req.body;
    const userId = req.user ? req.user.id : null;

    if (!newPassword) {
      return res.status(400).json({message: '새 비밀번호를 입력해주세요.'});
    }

    const response = await authService.resetPassword({
      userId,
      token,
      currentPassword,
      newPassword
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({message: error.message || '비밀번호 변경에 실패했습니다.'});
  }
};

// 로그아웃 컨트롤러 (쿠키 삭제 + DB에서 리프레시 토큰 삭제)
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    await authService.logoutUser(res, userId);

    // 액세스 토큰과 리프레시 토큰을 명확히 삭제
    res.clearCookie('accessToken', {
      ...cookieOptions,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/'
    });

    res.clearCookie('refreshToken', {
      ...cookieOptions,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 크로스 사이트 쿠키 허용
      path: '/'
    });

    res.status(200).json({message: '로그아웃 성공'});
  } catch (error) {
    console.error('로그아웃 오류:', error.message);
    res.status(500).json({message: '로그아웃 처리 실패', error: error.message});
  }
};

// 리프레시 토큰을 이용한 액세스 토큰 갱신
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    // console.log(' [리프레시 요청] 전달된 리프레시 토큰:', refreshToken);

    if (!refreshToken) {
      console.error(' 리프레시 토큰이 없습니다.');
      return res.status(401).json({message: '리프레시 토큰이 없습니다.'});
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    // console.log(' [리프레시 요청] 디코딩된 정보:', decoded);

    const storedToken = await RefreshToken.findOne({
      userId: decoded.id,
      token: refreshToken
    });

    // console.log(' [리프레시 요청] DB에 저장된 리프레시 토큰:', storedToken);

    if (!storedToken) {
      console.error(' DB에서 리프레시 토큰을 찾을 수 없습니다.');
      return res
        .status(403)
        .json({message: '유효하지 않은 리프레시 토큰입니다. 다시 로그인해주세요.'});
    }

    const newAccessToken = jwt.sign(
      {id: decoded.id, roles: decoded.roles},
      process.env.JWT_SECRET,
      {expiresIn: '1h'}
    );

    // console.log(' [리프레시 요청] 새로 발급된 액세스 토큰:', newAccessToken);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
      // maxAge: 15 * 60 * 1000 //15분
    });

    return res.status(200).json({message: '토큰 갱신 성공', accessToken: newAccessToken});
  } catch (error) {
    console.error('❌ 리프레시 토큰 검증 실패:', error.message);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/'
    });

    return res
      .status(403)
      .json({message: '유효하지 않은 리프레시 토큰입니다. 다시 로그인해주세요.'});
  }
};

exports.verifyCode = async (req, res) => {
  try {
    const {email, code} = req.body;
    console.log('🔍 [서버] 인증 코드 검증 요청:', email, code);

    const result = await authService.verifyCodeAndFindUserId(email, code);

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ [서버] 인증 코드 검증 실패:', error.message);
    res.status(500).json({message: '인증 코드 확인 중 오류 발생', error: error.message});
  }
};
