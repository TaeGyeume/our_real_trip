import React, {useEffect, useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {authAPI} from '../../api/auth';
import {useAuthStore} from '../../store/authStore';
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Link,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import SocialLoginButtons from '../../components/SocialLoginButtons'; // 소셜 로그인 버튼
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import AppTheme from './style/theme/AppTheme';
import ColorModeSelect from './style/theme/ColorModeSelect';
import Content from './style/components/Content';
import SignInCard from './style/components/SignInCard';

const Login = () => {
  const location = useLocation();
  const [, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const {fetchUserProfile} = useAuthStore();
  const [formData, setFormData] = useState({userid: '', password: ''});
  const [rememberUserId, setRememberUserId] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'duplicate') {
      setErrorMessage('이미 가입된 회원입니다. 기존 계정으로 로그인해주세요.');
    }
  }, [location]);

  useEffect(() => {
    const savedUserId = localStorage.getItem('savedUserId');
    if (savedUserId) {
      setFormData(prev => ({...prev, userid: savedUserId}));
      setRememberUserId(true); // 체크박스도 활성화
    }
  }, []);

  const handleChange = e => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleCheckboxChange = e => {
    setRememberUserId(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem('savedUserId'); // 체크 해제 시 저장된 아이디 삭제
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.loginUser(formData);

      // 로그인 응답에서 성공 여부 확인
      if (!response || response.status !== 200 || !response.data || !response.data.user) {
        setError('아이디 또는 비밀번호가 잘못되었습니다.');
        setLoading(false);
        return; // 로그인 실패 시 fetchUserProfile() 실행하지 않음
      }

      // 아이디 저장이 체크된 경우 localStorage에 저장
      if (rememberUserId) {
        localStorage.setItem('savedUserId', formData.userid);
      }

      // 로그인 성공 후에만 프로필 가져오기 실행
      await fetchUserProfile();
      navigate('/main'); // 로그인 성공 후 메인 페이지로 이동
    } catch (error) {
      setLoading(false); // 로딩 상태 해제

      if (error.response?.status === 401) {
        setError('아이디 또는 비밀번호가 잘못되었습니다.');
      } else if (error.response?.status === 500) {
        setError('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError(error.response?.data?.message || '아이디 또는 비밀번호를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{position: 'fixed', top: '1rem', right: '1rem'}} />
      <Stack
        direction="column"
        component="main"
        sx={[
          {
            justifyContent: 'center',
            height: 'calc((1 - var(--template-frame-height, 0)) * 100%)',
            marginTop: 'max(40px - var(--template-frame-height, 0px), 0px)',
            minHeight: '100%'
          },
          theme => ({
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              zIndex: -1,
              inset: 0,
              backgroundImage:
                'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
              backgroundRepeat: 'no-repeat',
              ...theme.applyStyles('dark', {
                backgroundImage:
                  'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
              })
            }
          })
        ]}>
        <Stack
          direction={{xs: 'column-reverse', md: 'row'}}
          sx={{
            justifyContent: 'center',
            gap: {xs: 6, sm: 12},
            p: 2,
            mx: 'auto'
          }}>
          <Stack
            direction={{xs: 'column-reverse', md: 'row'}}
            sx={{
              justifyContent: 'center',
              gap: {xs: 6, sm: 12},
              p: {xs: 2, sm: 4},
              m: 'auto'
            }}>
            <Content />
            <SignInCard>
              <Typography variant="h5" sx={{color: '#000', fontWeight: 'bold', mb: 2}}>
                로그인
              </Typography>

              {error && (
                <Typography variant="body2" color="error" sx={{mb: 2}}>
                  {error}
                </Typography>
              )}

              <form onSubmit={handleSubmit} style={{width: '100%'}}>
                <TextField
                  fullWidth
                  label="아이디"
                  name="userid"
                  variant="outlined"
                  margin="normal"
                  value={formData.userid}
                  onChange={handleChange}
                  required
                  InputProps={{
                    style: {color: '#000'}
                  }}
                  sx={{
                    input: {color: '#000'},
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {borderColor: 'rgba(0, 0, 0, 0.5)'},
                      '&:hover fieldset': {borderColor: 'rgba(0, 0, 0, 0.8)'}
                    },
                    '& .MuiInputLabel-root': {color: '#000'}
                  }}
                />
                <TextField
                  fullWidth
                  label="비밀번호"
                  name="password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    style: {color: '#000'}
                  }}
                  sx={{
                    input: {color: '#000'},
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {borderColor: 'rgba(0, 0, 0, 0.5)'},
                      '&:hover fieldset': {borderColor: 'rgba(0, 0, 0, 0.8)'}
                    },
                    '& .MuiInputLabel-root': {color: '#000'}
                  }}
                />

                {/* 아이디 저장 체크박스 */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberUserId}
                      onChange={handleCheckboxChange}
                      sx={{color: '#000'}}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{color: '#000'}}>
                      아이디 저장
                    </Typography>
                  }
                  sx={{mt: 1, textAlign: 'left', width: '100%'}}
                />

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 2,
                    bgcolor: 'black',
                    color: 'white',
                    borderRadius: '50px',
                    '&:hover': {bgcolor: 'gray'}
                  }}
                  type="submit"
                  disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : '로그인'}
                </Button>
              </form>

              <Box sx={{mt: 3}}>
                <Link href="/find-userid" underline="hover" sx={{color: '#000'}}>
                  아이디 찾기
                </Link>
                <span style={{color: '#000'}}> | </span>
                <Link href="/forgot-password" underline="hover" sx={{color: '#000'}}>
                  비밀번호 찾기
                </Link>
                <Box sx={{mt: 2}}>
                  <Link href="/register" underline="hover" sx={{color: '#000'}}>
                    회원가입
                  </Link>
                </Box>
              </Box>

              <SocialLoginButtons />
            </SignInCard>
          </Stack>
        </Stack>
      </Stack>
    </AppTheme>
  );
};

export default Login;
