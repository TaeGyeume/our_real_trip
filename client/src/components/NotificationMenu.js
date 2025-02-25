import React, {useRef, useState, useEffect} from 'react';
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
  ListItemText,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {useNotificationStore} from '../store/notificationStore';

const NotificationMenu = () => {
  const {
    notifications,
    fetchNotifications,
    fetchMoreNotifications,
    currentPage,
    hasMore,
    markAllAsRead
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const notiRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // 메뉴가 열릴 때마다 항상 1페이지부터 로딩
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchNotifications(1).finally(() => setLoading(false));
    }
  }, [isOpen, fetchNotifications]);

  // 스크롤 이벤트는 정확히 연결
  useEffect(() => {
    const listNode = listRef.current;
    if (!listNode) return;

    const handleScroll = () => {
      const {scrollTop, scrollHeight, clientHeight} = listNode;
      if (!loading && hasMore && scrollHeight - scrollTop <= clientHeight + 50) {
        setLoading(true);
        fetchMoreNotifications(currentPage + 1).finally(() => setLoading(false));
      }
    };

    listNode.addEventListener('scroll', handleScroll);
    return () => listNode.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, currentPage, fetchMoreNotifications]);

  const toggleNotiDropdown = async () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      await markAllAsRead();
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
            }}
            ref={listRef}>
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
                          sx={{opacity: noti.read ? 0.6 : 1}}
                        />
                      </MenuItem>
                    ))
                ) : (
                  <Typography sx={{p: 2, color: 'gray'}}>알림이 없습니다.</Typography>
                )}
                {loading && (
                  <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}>
                    <CircularProgress size={20} />
                  </Box>
                )}
                {!hasMore && notifications.length > 0 && (
                  <Typography
                    sx={{textAlign: 'center', p: 1, color: 'gray', fontSize: 12}}>
                    더 이상 알림이 없습니다.
                  </Typography>
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
