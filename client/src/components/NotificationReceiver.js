import React, {useState, useEffect} from 'react';
import {useNotificationStore} from '../store/notificationStore';
import {Snackbar, Alert} from '@mui/material';

const NotificationReceiver = () => {
  const {notifications} = useNotificationStore();
  const [latestNotification, setLatestNotification] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (notifications.length > 0) {
      setLatestNotification(notifications[0].message);
      setOpen(true);
    }
  }, [notifications]);

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
