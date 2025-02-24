import React, {useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Box,
  IconButton,
  Badge,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  Typography,
  Divider,
  ListItemText
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {useNotificationStore} from '../store/notificationStore';

const NotificationMenu = () => {
  const {notifications, markAllAsRead} = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const notiRef = useRef(null);
  const navigate = useNavigate();

  const toggleNotiDropdown = async () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      await markAllAsRead(); // 열릴 때 읽음처리
    }
  };

  const handleClickAway = event => {
    if (notiRef.current && !notiRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  const handleNotificationClick = noti => {
    if (noti.bookingId) {
      navigate(`/booking/detail/${noti.bookingId}`);
      setIsOpen(false);
    }
  };

  return (
    <>
      <IconButton color="inherit" ref={notiRef} onClick={toggleNotiDropdown}>
        <Badge
          badgeContent={notifications.filter(noti => !noti.read).length}
          color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {isOpen && (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            sx={{
              position: 'absolute',
              top: 50,
              right: 50,
              zIndex: 10,
              width: 300,
              maxHeight: 400,
              overflowY: 'auto'
            }}>
            <Paper sx={{boxShadow: 3, borderRadius: 1}}>
              <MenuList>
                <Typography variant="subtitle1" sx={{p: 1}}>
                  알림
                </Typography>
                <Divider />
                {notifications.length > 0 ? (
                  notifications
                    .slice()
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(noti => (
                      <MenuItem
                        key={noti._id}
                        sx={{whiteSpace: 'normal'}}
                        onClick={() => handleNotificationClick(noti)}>
                        <ListItemText
                          primary={noti.message}
                          secondary={new Date(noti.createdAt).toLocaleString('ko-KR', {
                            timeZone: 'Asia/Seoul',
                            hour12: false
                          })}
                          onClick={() => handleNotificationClick(noti)}
                          sx={{opacity: noti.read ? 0.6 : 1}}
                        />
                      </MenuItem>
                    ))
                ) : (
                  <Typography sx={{p: 2, color: 'gray'}}>알림이 없습니다.</Typography>
                )}
              </MenuList>
            </Paper>
          </Box>
        </ClickAwayListener>
      )}
    </>
  );
};

export default NotificationMenu;
