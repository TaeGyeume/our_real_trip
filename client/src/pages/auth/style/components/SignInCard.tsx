import * as React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {styled} from '@mui/material/styles';
import ForgotPassword from './ForgotPassword';
import FindUserId from './FindUserId'; // 아이디 찾기 모달 컴포넌트
import {GoogleIcon, SitemarkIcon, KakaoIcon, NaverIcon} from './CustomIcons';
import {authAPI} from '../../../../api/auth';
import {useAuthStore} from '../../../../store/authStore';

// 네이버 로그인 핸들러
const handleNaverLogin = () => {
  const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  window.location.href = `${SERVER_URL}/auth/naver`;
};

// 구글 로그인 핸들러
const handleGoogleLogin = () => {
  const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  window.location.href = `${SERVER_URL}/auth/google`;
};

// 카카오톡 로그인 핸들러
const handleKakaoLogin = () => {
  const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  window.location.href = `${SERVER_URL}/auth/kakao`;
};

const Card = styled(MuiCard)(({theme}) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px'
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px'
  })
}));

export default function SignInCard() {
  const [useridError, setUseridError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [formData, setFormData] = React.useState({userid: '', password: ''});
  const [rememberUserId, setRememberUserId] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [openForgot, setOpenForgot] = React.useState(false);
  const [openFindUserId, setOpenFindUserId] = React.useState(false);

  const navigate = useNavigate();
  const {fetchUserProfile} = useAuthStore();
  const location = useLocation();

  // 소셜 로그인에서 중복 에러 전달 시 처리
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'duplicate') {
      setUseridError(true);
      setErrorMessage('이미 가입된 사용자입니다.');
    }
  }, [location]);

  // 비밀번호 찾기 모달 열기
  const handleForgotOpen = () => {
    setOpenForgot(true);
  };
  const handleForgotClose = () => {
    setOpenForgot(false);
  };

  // 아이디 찾기 모달 열기
  const handleFindUserIdOpen = () => {
    setOpenFindUserId(true);
  };
  const handleFindUserIdClose = () => {
    setOpenFindUserId(false);
  };

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // "아이디 저장" 체크박스 핸들러
  const handleCheckboxChange = (
    event: React.SyntheticEvent<Element, Event>,
    checked: boolean
  ) => {
    setRememberUserId(checked);
    if (!checked) {
      localStorage.removeItem('savedUserId');
    }
  };

  // 아이디/비밀번호 유효성 검사
  const validateInputs = () => {
    let isValid = true;

    if (!formData.userid || !formData.password) {
      setUseridError(!formData.userid);
      setPasswordError(!formData.password);
      setErrorMessage('아이디 또는 비밀번호를 입력해주세요.');
      isValid = false;
    } else {
      setUseridError(false);
      setPasswordError(false);
      setErrorMessage('');
    }

    return isValid;
  };

  // 폼 제출 (로그인)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (validateInputs()) {
      try {
        const response = await authAPI.loginUser(formData);

        if (response.status === 200 && response.data?.user) {
          if (rememberUserId) {
            localStorage.setItem('savedUserId', formData.userid);
          }
          await fetchUserProfile();
          navigate('/main');
        } else {
          setUseridError(true);
          setPasswordError(true);
          setErrorMessage('아이디 또는 비밀번호를 확인해주세요.');
        }
      } catch (error) {
        setLoading(false);
        setUseridError(true);
        setPasswordError(true);
        setErrorMessage('아이디 또는 비밀번호를 확인해주세요.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <Box sx={{display: {xs: 'flex', md: 'none'}}}>
        <SitemarkIcon />
      </Box>
      <Typography
        component="h1"
        variant="h4"
        sx={{width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)'}}>
        로그인
      </Typography>

      {/* 상단 에러 메시지 */}
      {errorMessage && (
        <Typography
          color="error"
          textAlign="center"
          sx={{fontSize: '0.875rem', fontWeight: 'bold'}}>
          {errorMessage}
        </Typography>
      )}

      {/* 로그인 폼 */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{display: 'flex', flexDirection: 'column', width: '100%', gap: 2}}>
        <FormControl>
          <FormLabel htmlFor="userid">아이디</FormLabel>
          <TextField
            error={useridError}
            id="userid"
            type="text"
            name="userid"
            autoComplete="off"
            autoFocus
            required
            fullWidth
            variant="outlined"
            value={formData.userid}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <Box
            sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <FormLabel htmlFor="password">비밀번호</FormLabel>
            {/* 아이디 찾기 & 비밀번호 찾기 링크 (모달 방식) */}
            <Box>
              <Link
                component="button"
                variant="body2"
                sx={{marginRight: 2, textDecoration: 'underline'}}
                onClick={handleFindUserIdOpen}>
                아이디 찾기
              </Link>
              <Link
                component="button"
                variant="body2"
                sx={{textDecoration: 'underline'}}
                onClick={handleForgotOpen}>
                비밀번호 찾기
              </Link>
            </Box>
          </Box>
          <TextField
            error={passwordError}
            name="password"
            type="password"
            id="password"
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
          />
        </FormControl>

        <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
          onChange={handleCheckboxChange}
        />

        <ForgotPassword open={openForgot} handleClose={handleForgotClose} />

        <Button type="submit" fullWidth variant="contained" disabled={loading}>
          {loading ? 'Loading...' : '로그인'}
        </Button>

        <Typography sx={{textAlign: 'center'}}>
          Don&apos;t have an account?{' '}
          <span>
            <Link href="/register" variant="body2" sx={{alignSelf: 'center'}}>
              Sign up
            </Link>
          </span>
        </Typography>
      </Box>

      <Divider>or</Divider>

      <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
        <Button
          onClick={handleGoogleLogin}
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}>
          Sign in with Google
        </Button>
        <Button
          onClick={handleNaverLogin}
          fullWidth
          variant="outlined"
          startIcon={<NaverIcon />}>
          Sign in with Naver
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleKakaoLogin}
          startIcon={<KakaoIcon />}>
          Sign in with KakaoTack
        </Button>
      </Box>

      {/* 아이디 찾기 모달 */}
      <FindUserId open={openFindUserId} handleClose={handleFindUserIdClose} />
    </Card>
  );
}
