import * as React from 'react';
import {useState} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import {authAPI} from '../../../../api/auth'; // 아이디 찾기, 인증코드 검증 API
import Typography from '@mui/material/Typography';

interface FindUserIdProps {
  open: boolean;
  handleClose: () => void;
}

export default function FindUserId({open, handleClose}: FindUserIdProps) {
  // 스텝 (1: 이메일 입력, 2: 인증코드 입력, 3: 아이디 결과)
  const [step, setStep] = useState<number>(1);

  // 이메일, 인증코드, 최종 찾은 아이디
  const [email, setEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  // 에러/성공 메시지
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 입력 핸들러 (이메일, 인증코드)
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
  };

  // "확인"/"계속" 버튼을 누를 때 실행되는 메인 로직
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (step === 1) {
        // Step 1: 이메일 입력 후 아이디 찾기(인증코드 발송)
        await authAPI.findUserId(email);
        setSuccess('인증 코드가 이메일로 전송되었습니다.');
        setStep(2);
      } else if (step === 2) {
        // Step 2: 인증 코드 검증 후 아이디 조회
        const response = await authAPI.verifyCode({email, code: verificationCode});
        if (response && response.userId) {
          setUserId(response.userId);
          setStep(3);
        } else {
          setError('잘못된 인증 코드입니다.');
        }
      } else if (step === 3) {
        // Step 3: 아이디 조회 결과 확인 후 모달 닫기
        handleClose();
      }
    } catch (err: any) {
      if (step === 1) {
        setError(err.response?.data?.message || '해당 이메일로 가입된 계정이 없습니다.');
      } else if (step === 2) {
        setError(err.response?.data?.message || '인증 코드 확인 실패');
      }
    }
  };

  // 스텝별 안내 문구/입력 요소
  const renderStepContent = () => {
    if (step === 1) {
      // 이메일 입력
      return (
        <>
          <DialogContentText>
            계정의 이메일 주소를 입력하면 인증 코드를 보내드립니다.
          </DialogContentText>
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="primary">{success}</Typography>}

          <OutlinedInput
            autoComplete="off"
            autoFocus
            required
            margin="dense"
            id="email"
            name="email"
            placeholder="이메일 주소"
            type="email"
            fullWidth
            value={email}
            onChange={handleEmailChange}
          />
        </>
      );
    } else if (step === 2) {
      // 인증 코드 입력
      return (
        <>
          <DialogContentText>이메일로 전송된 인증 코드를 입력해주세요.</DialogContentText>
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="primary">{success}</Typography>}

          <OutlinedInput
            autoComplete="off"
            autoFocus
            required
            margin="dense"
            id="verificationCode"
            name="verificationCode"
            placeholder="인증 코드"
            type="text"
            fullWidth
            value={verificationCode}
            onChange={handleCodeChange}
          />
        </>
      );
    } else if (step === 3) {
      // 아이디 결과
      return (
        <>
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="primary">{success}</Typography>}

          <DialogContentText>찾으신 아이디는 아래와 같습니다.</DialogContentText>
          <Typography variant="h6" sx={{mt: 1, mb: 2, fontWeight: 'bold'}}>
            {userId}
          </Typography>
          <Typography>로그인을 진행해주세요.</Typography>
        </>
      );
    }
    return null;
  };

  // 스텝별 버튼 텍스트
  const getSubmitButtonText = () => {
    if (step === 1) return '인증 코드 받기';
    if (step === 2) return '확인';
    if (step === 3) return '닫기';
    return '계속';
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
      <DialogTitle>아이디 찾기</DialogTitle>

      <DialogContent
        sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{pb: 3, px: 3}}>
        {/* 취소 버튼: Step 1,2에서만 표시 (Step 3에서는 닫기만) */}
        {step !== 3 && (
          <Button onClick={handleClose} color="inherit">
            취소
          </Button>
        )}
        <Button variant="contained" type="submit">
          {getSubmitButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
