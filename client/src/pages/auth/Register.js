import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import AppTheme from './style/theme/AppTheme';
import ColorModeSelect from './style/theme/ColorModeSelect';
import Content from './style/components/Content';
import RegisterCard from './style/components/RegisterCard';

const Register = () => {
  const location = useLocation();
  const [, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'duplicate') {
      setErrorMessage('이미 가입된 회원입니다. 기존 계정으로 로그인해주세요.');
    }
  }, [location]);

  // useEffect(() => {
  //   const savedUserId = localStorage.getItem('savedUserId');
  //   if (savedUserId) {
  //     setFormData(prev => ({...prev, userid: savedUserId}));
  //     setRememberUserId(true); // 체크박스도 활성화
  //   }
  // }, []);

  // const handleChange = e => {
  //   setFormData({...formData, [e.target.name]: e.target.value});
  // };

  // const handleCheckboxChange = e => {
  //   setRememberUserId(e.target.checked);
  //   if (!e.target.checked) {
  //     localStorage.removeItem('savedUserId'); // 체크 해제 시 저장된 아이디 삭제
  //   }
  // };

  // const handleSubmit = async e => {
  //   e.preventDefault();
  //   setError('');
  //   setLoading(true);

  //   try {
  //     const response = await authAPI.loginUser(formData);

  //     // 로그인 응답에서 성공 여부 확인
  //     if (!response || response.status !== 200 || !response.data || !response.data.user) {
  //       setError('아이디 또는 비밀번호가 잘못되었습니다.');
  //       setLoading(false);
  //       return; // 로그인 실패 시 fetchUserProfile() 실행하지 않음
  //     }

  //     // 아이디 저장이 체크된 경우 localStorage에 저장
  //     if (rememberUserId) {
  //       localStorage.setItem('savedUserId', formData.userid);
  //     }

  //     // 로그인 성공 후에만 프로필 가져오기 실행
  //     await fetchUserProfile();
  //     navigate('/main'); // 로그인 성공 후 메인 페이지로 이동
  //   } catch (error) {
  //     setLoading(false); // 로딩 상태 해제

  //     if (error.response?.status === 401) {
  //       setError('아이디 또는 비밀번호가 잘못되었습니다.');
  //     } else if (error.response?.status === 500) {
  //       setError('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
  //     } else {
  //       setError(error.response?.data?.message || '아이디 또는 비밀번호를 확인해주세요.');
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
            <RegisterCard></RegisterCard>
          </Stack>
        </Stack>
      </Stack>
    </AppTheme>
  );
};

export default Register;
