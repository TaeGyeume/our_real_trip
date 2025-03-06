import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {authAPI} from '../../../../api/auth'; // 예시 API
import {
  Box,
  Button,
  Card as MuiCard,
  FormLabel,
  FormControl,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import DaumPostcode from 'react-daum-postcode'; // 주소 검색 라이브러리
import {styled} from '@mui/material/styles';

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
  }
}));

const RegisterCard = () => {
  const [formData, setFormData] = useState({
    userid: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    provider: 'local',
    membershipLevel: '길초보',
    roles: ['user']
  });

  // 중복 체크 메시지 상태 (아이디, 이메일, 전화번호)
  const [checkMessage, setCheckMessage] = useState({
    userid: '',
    email: '',
    phone: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const navigate = useNavigate();

  // 입력값 변경 시 해당 필드의 중복 체크 메시지 초기화
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (['userid', 'email', 'phone'].includes(e.target.name)) {
      setCheckMessage(prev => ({...prev, [e.target.name]: ''}));
    }
  };

  // onBlur 시 중복 체크
  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    if (!['userid', 'email', 'phone'].includes(name)) return;
    if (!value.trim()) {
      setCheckMessage(prev => ({...prev, [name]: ''}));
      return;
    }
    try {
      const response = await authAPI.checkDuplicate({[name]: value});
      setCheckMessage(prev => ({...prev, [name]: response.message || ''}));
    } catch (err: any) {
      setCheckMessage(prev => ({
        ...prev,
        [name]: err.response?.data?.message || err.message || '중복 확인에 실패했습니다.'
      }));
    }
  };

  // 회원가입 폼 제출
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // 중복 체크 완료 여부 검증 (API가 "사용 가능" 메시지를 반환한다고 가정)
    const isUserIdOk = checkMessage.userid && checkMessage.userid.includes('사용 가능');
    const isEmailOk = checkMessage.email && checkMessage.email.includes('사용 가능');
    const isPhoneOk = checkMessage.phone && checkMessage.phone.includes('사용 가능');

    if (!isUserIdOk || !isEmailOk || !isPhoneOk) {
      setError('회원가입 정보를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      await authAPI.registerUser(formData);
      setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // DaumPostcode의 onComplete 콜백
  const handleAddressComplete = (data: {address: string}) => {
    setFormData(prev => ({...prev, address: data.address}));
    setOpenDialog(false);
  };

  return (
    <Card variant="outlined">
      <Typography
        component="h1"
        variant="h4"
        sx={{width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)'}}>
        회원가입
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
        {/* 아이디 */}
        <FormControl>
          <FormLabel htmlFor="userid">아이디</FormLabel>
          <TextField
            id="userid"
            name="userid"
            placeholder="아이디를 입력하세요"
            required
            fullWidth
            variant="outlined"
            value={formData.userid}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {checkMessage.userid && (
            <Typography variant="body2" color="error" sx={{mt: 0.5}}>
              {checkMessage.userid}
            </Typography>
          )}
        </FormControl>

        {/* 이름 */}
        <FormControl>
          <FormLabel htmlFor="username">이름</FormLabel>
          <TextField
            id="username"
            name="username"
            placeholder="이름을 입력하세요"
            required
            fullWidth
            variant="outlined"
            value={formData.username}
            onChange={handleChange}
          />
        </FormControl>

        {/* 이메일 */}
        <FormControl>
          <FormLabel htmlFor="email">이메일</FormLabel>
          <TextField
            id="email"
            name="email"
            type="email"
            placeholder="이메일을 입력하세요"
            required
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {checkMessage.email && (
            <Typography variant="body2" color="error" sx={{mt: 0.5}}>
              {checkMessage.email}
            </Typography>
          )}
        </FormControl>

        {/* 전화번호 */}
        <FormControl>
          <FormLabel htmlFor="phone">전화번호</FormLabel>
          <TextField
            id="phone"
            name="phone"
            placeholder="전화번호를 입력하세요"
            required
            fullWidth
            variant="outlined"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {checkMessage.phone && (
            <Typography variant="body2" color="error" sx={{mt: 0.5}}>
              {checkMessage.phone}
            </Typography>
          )}
        </FormControl>

        {/* 비밀번호 */}
        <FormControl>
          <FormLabel htmlFor="password">비밀번호</FormLabel>
          <TextField
            id="password"
            name="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            required
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
          />
        </FormControl>

        {/* 주소 */}
        <FormControl>
          <FormLabel htmlFor="address">주소</FormLabel>
          <TextField
            id="address"
            name="address"
            placeholder="주소를 입력하세요"
            value={formData.address}
            fullWidth
            variant="outlined"
            onChange={handleChange}
          />
          <Button variant="outlined" onClick={() => setOpenDialog(true)} sx={{mb: 2}}>
            주소 찾기
          </Button>
        </FormControl>

        {/* 가입하기 버튼 */}
        <Button type="submit" variant="contained" fullWidth disabled={loading}>
          {loading ? '가입 처리 중...' : '가입하기'}
        </Button>
      </Box>

      {/* 주소 검색 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>주소 검색</DialogTitle>
        <DialogContent>
          <DaumPostcode
            onComplete={handleAddressComplete}
            autoClose={false}
            style={{border: '1px solid #ccc', width: '100%', height: '500px'}}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
        </DialogActions>
      </Dialog>

      {/* 에러/성공 메시지 */}
      {error && (
        <Typography variant="body1" color="error" sx={{mb: 2}}>
          {error}
        </Typography>
      )}
      {success && (
        <Typography variant="body1" color="primary" sx={{mb: 2}}>
          {success}
        </Typography>
      )}
    </Card>
  );
};

export default RegisterCard;
