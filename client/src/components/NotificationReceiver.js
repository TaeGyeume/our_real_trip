// 알림 스낵바
import React, {useState, useEffect, useRef} from 'react';
import {useNotificationStore} from '../store/notificationStore';
import {Snackbar, Alert} from '@mui/material';

const NotificationReceiver = () => {
  const {notifications} = useNotificationStore();
  const [latestNotification, setLatestNotification] = useState('');
  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    // 이전 알림 개수보다 많아졌을 때만 실행함
    if (notifications.length > prevCountRef.current) {
      setLatestNotification(notifications[0].message);
      setOpen(true);
    }
    prevCountRef.current = notifications.length;
  }, [notifications]);

  // 테스트용 새로고침 할 때마다 실행
  // useEffect(() => {
  //   if (notifications.length > 0) {
  //     setLatestNotification(notifications[0].message);
  //     setOpen(true);
  //   }
  // }, [notifications]);

  const handleClose = () => setOpen(false);

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <Alert severity="info" onClose={handleClose}>
        {latestNotification}
      </Alert>
    </Snackbar>
  );
};

export default NotificationReceiver;
