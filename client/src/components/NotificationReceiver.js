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
    if (notifications.length > prevCountRef.current) {
      // 기존 읽지 않은 알림이 아닌, 새로 추가된 "읽지 않은 알림"만 확인
      const newUnread = notifications.find(noti => !noti.read);

      if (newUnread) {
        setLatestNotification(newUnread.message);
        setOpen(true);
      }
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
