import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {authAPI} from '../../api/auth'; // 예시 API
import {
  Container,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DaumPostcode from 'react-daum-postcode'; // 주소 검색 라이브러리

const Register = () => {
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

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 주소 검색 Dialog 열림 상태
  const [openDialog, setOpenDialog] = useState(false);

  const navigate = useNavigate();

  // 폼 입력값 변경
  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // 회원가입 폼 제출
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authAPI.registerUser(formData);
      setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // DaumPostcode 컴포넌트의 onComplete 콜백
  const handleAddressComplete = data => {
    // 선택된 주소: data.address
    setFormData(prev => ({...prev, address: data.address}));
    setOpenDialog(false); // 다이얼로그 닫기
  };

  return (
    <Container maxWidth="sm" sx={{mt: 5}}>
      <Typography variant="h4" gutterBottom textAlign="center">
        회원가입
      </Typography>

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

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit}>
        {/* 아이디 */}
        <TextField
          label="아이디"
          name="userid"
          fullWidth
          margin="normal"
          required
          value={formData.userid}
          onChange={handleChange}
        />
        {/* 이름 */}
        <TextField
          label="이름"
          name="username"
          fullWidth
          margin="normal"
          required
          value={formData.username}
          onChange={handleChange}
        />
        {/* 이메일 */}
        <TextField
          label="이메일"
          name="email"
          fullWidth
          margin="normal"
          required
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        {/* 전화번호 */}
        <TextField
          label="전화번호"
          name="phone"
          fullWidth
          margin="normal"
          required
          value={formData.phone}
          onChange={handleChange}
        />
        {/* 비밀번호 */}
        <TextField
          label="비밀번호"
          name="password"
          type="password"
          fullWidth
          margin="normal"
          required
          value={formData.password}
          onChange={handleChange}
        />

        {/* 주소 + 주소검색 버튼 */}
        <TextField
          label="주소"
          name="address"
          fullWidth
          margin="normal"
          value={formData.address}
          onChange={handleChange}
        />
        <Button variant="outlined" onClick={() => setOpenDialog(true)} sx={{mb: 2}}>
          주소 찾기
        </Button>

        {/* 가입하기 버튼 */}
        <Button type="submit" variant="contained" fullWidth disabled={loading}>
          {loading ? '가입 처리 중...' : '가입하기'}
        </Button>
      </form>

      {/* 주소 검색 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>주소 검색</DialogTitle>
        <DialogContent>
          {/* react-daum-postcode 컴포넌트 */}
          <DaumPostcode
            onComplete={handleAddressComplete}
            autoClose={false}
            width="100%"
            height="500px"
            style={{border: '1px solid #ccc'}}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;
