import * as React from 'react';
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
import {
  GoogleIcon,
  FacebookIcon,
  SitemarkIcon,
  KakaoIcon,
  NaverIcon
} from './CustomIcons';
import {useNavigate} from 'react-router-dom';
import {authAPI} from '../../../../api/auth';
import {useAuthStore} from '../../../../store/authStore';

const handleNaverLogin = () => {
  const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  window.location.href = `${SERVER_URL}/auth/naver`; // Naver 로그인 URL로 이동
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
  const [useridErrorMessage, setUseridErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [formData, setFormData] = React.useState({userid: '', password: ''});
  const [rememberUserId, setRememberUserId] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const navigate = useNavigate();
  const {fetchUserProfile} = useAuthStore();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleCheckboxChange = (
    event: React.SyntheticEvent<Element, Event>,
    checked: boolean
  ) => {
    setRememberUserId(checked);
    if (!checked) {
      localStorage.removeItem('savedUserId');
    }
  };

  const validateInputs = () => {
    const {userid, password} = formData;
    let isValid = true;

    if (!userid) {
      setUseridError(true);
      setUseridErrorMessage('아이디를 입력해주세요.');
      isValid = false;
    } else {
      setUseridError(false);
      setUseridErrorMessage('');
    }

    if (!password) {
      setPasswordError(true);
      setPasswordErrorMessage('비밀번호를 입력해주세요.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

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
        }
      } catch (error) {
        setLoading(false);
        setUseridError(true);
        setPasswordError(true);
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
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{display: 'flex', flexDirection: 'column', width: '100%', gap: 2}}>
        <FormControl>
          <FormLabel htmlFor="userid">아이디</FormLabel>
          <TextField
            error={useridError}
            helperText={useridErrorMessage}
            id="userid"
            type="text"
            name="userid"
            placeholder="아이디를 입력하세요"
            autoComplete="userid"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={useridError ? 'error' : 'primary'}
            value={formData.userid}
            onChange={handleChange}
          />
        </FormControl>
        <FormControl>
          <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
            <FormLabel htmlFor="password">비밀번호</FormLabel>
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{alignSelf: 'baseline'}}>
              비밀번호 찾기
            </Link>
          </Box>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="current-password"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={passwordError ? 'error' : 'primary'}
            value={formData.password}
            onChange={handleChange}
          />
        </FormControl>
        <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
          onChange={handleCheckboxChange}
        />
        <ForgotPassword open={open} handleClose={handleClose} />
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
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign in with Google')}
          startIcon={<GoogleIcon />}>
          Sign in with Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign in with Facebook')}
          startIcon={<FacebookIcon />}>
          Sign in with Facebook
        </Button>
        <Button
          onClick={handleNaverLogin} // 버튼 클릭 시 Naver 로그인 URL로 이동
          fullWidth
          variant="outlined"
          startIcon={<NaverIcon />}>
          Sign in with Naver
        </Button>

        <Button
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign in with Naver')}
          startIcon={<NaverIcon />}>
          Sign in with Naver
        </Button>
      </Box>
    </Card>
  );
}
