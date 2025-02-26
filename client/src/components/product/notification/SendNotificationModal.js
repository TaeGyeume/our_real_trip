import React, {useState} from 'react';
import {Modal, Box, Typography, TextField, Button} from '@mui/material';
import {useNotificationStore} from '../../../store/notificationStore';

const SendNotificationModal = ({open, handleClose}) => {
  const [message, setMessage] = useState('');
  const {sendNotificationToAll} = useNotificationStore();

  const handleSubmit = async () => {
    try {
      await sendNotificationToAll(message);
      alert('알림 전송 성공!');
      setMessage('');
      handleClose();
    } catch (error) {
      alert('알림 전송 실패');
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          width: 400,
          borderRadius: 2
        }}>
        <Typography variant="h6" gutterBottom>
          알림 보내기
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="메시지를 입력하세요"
          value={message}
          onChange={e => setMessage(e.target.value)}
          sx={{mt: 2}}
        />
        <Box sx={{mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
          <Button variant="outlined" onClick={handleClose}>
            취소
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            전송
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SendNotificationModal;
