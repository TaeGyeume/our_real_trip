import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import {authAPI} from '../../../../api/auth'; // 비밀번호 찾기 API 호출
import {useState} from 'react';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

export default function ForgotPassword({open, handleClose}: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      await authAPI.forgotPassword(email);
      setSuccess('비밀번호 재설정 링크가 이메일로 발송되었습니다.');
      setEmail(''); // 입력 필드 초기화

      // 2초 후 다이얼로그 닫기
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      const err = error as {response?: {data?: {message?: string}}};
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('가입되지 않은 사용자입니다.');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: {backgroundImage: 'none'}
        }
      }}>
      <DialogTitle>비밀번호 재설정</DialogTitle>
      <DialogContent
        sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
        <DialogContentText>
          계정의 이메일 주소를 입력하면 비밀번호를 재설정할 수 있는 링크를 보내드립니다.
        </DialogContentText>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <OutlinedInput
          autoComplete="off"
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          label="Email address"
          placeholder="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={handleEmailChange}
        />
      </DialogContent>
      <DialogActions sx={{pb: 3, px: 3}}>
        <Button onClick={handleClose}>취소</Button>
        <Button variant="contained" type="submit">
          계속
        </Button>
      </DialogActions>
    </Dialog>
  );
}
