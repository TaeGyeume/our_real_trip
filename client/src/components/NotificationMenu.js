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
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              top: 9, // 뱃지의 상단 위치 조정 (원하는 값으로 조절)
              right: 9, // 뱃지의 오른쪽 위치 조정 (원하는 값으로 조절)
              fontSize: '0.75rem', // 숫자가 너무 크면 조절
              height: 18, // 뱃지 크기 조절
              minWidth: 18 // 뱃지 크기 조절
            }
          }}>
          <img
            src="/images/category/notification.png" // 원하는 경로의 PNG 파일
            alt="알림"
            style={{
              width: 30,
              height: 30,
              display: 'block', // 이미지가 가운데 정렬되도록 설정
              position: 'relative'
            }} // 기존 아이콘 크기 유지
          />
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
            <Paper
              sx={{
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: 3,
                borderRadius: 1
              }}>
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
