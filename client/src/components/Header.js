import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuthStore} from '../store/authStore';
import NotificationMenu from './NotificationMenu';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FlightIcon from '@mui/icons-material/Flight';
import HomeIcon from '@mui/icons-material/Home';
import HotelIcon from '@mui/icons-material/Hotel';
import TourIcon from '@mui/icons-material/CardTravel';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Header = () => {
  const {user, isAuthenticated, fetchUserProfile, logout} = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 로그인된 경우에만 프로필 불러오기
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      setIsDropdownOpen(false); // 로그인 후 드롭다운 자동 열림 방지
    }
  }, [isAuthenticated, fetchUserProfile]);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error.message || '알 수 없는 오류 발생');
    }
  };

  // 사이드바 토글
  const toggleDrawer = open => () => {
    setDrawerOpen(open);
  };

  // 프로필 드롭다운 토글
  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // 드롭다운을 닫기 위한 핸들러
  const handleClickAway = event => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundImage:
            'linear-gradient(90deg, rgb(0, 181, 204) 0%, rgb(0, 51, 102) 100%)',
          boxShadow: 3
        }}>
        <Toolbar>
          {/* 모바일 햄버거 메뉴 버튼 */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer(true)}
            sx={{display: {md: 'none'}}}>
            <MenuIcon />
          </IconButton>

          {/* 로고 */}
          <Typography
            variant="h6"
            component={Link}
            to="/main"
            sx={{
              flexGrow: 0,
              textDecoration: 'none',
              color: 'white',
              fontWeight: 'bold',
              mr: 3
            }}>
            Our Real Trip
          </Typography>

          {/* 네비게이션 메뉴 */}
          <Box sx={{flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 0.5}}>
            <Button
              component={Link}
              to="/main"
              startIcon={<HomeIcon />}
              variant="contained"
              color="#74b9ff"
              sx={{whiteSpace: 'nowrap'}}>
              메인
            </Button>
            <Button
              component={Link}
              to="/flights"
              startIcon={<FlightIcon />}
              variant="contained"
              color="#74b9ff"
              sx={{whiteSpace: 'nowrap'}}>
              항공
            </Button>
            <Button
              component={Link}
              to="/accommodations/search"
              startIcon={<HotelIcon />}
              variant="contained"
              color="#74b9ff"
              sx={{whiteSpace: 'nowrap'}}>
              숙소 검색
            </Button>
            <Button
              component={Link}
              to="/tourTicket/list"
              startIcon={<TourIcon />}
              variant="contained"
              color="#74b9ff"
              sx={{whiteSpace: 'nowrap'}}>
              투어/티켓
            </Button>
            <Button
              component={Link}
              to="/travelItems"
              startIcon={<ShoppingBagIcon />}
              variant="contained"
              color="#74b9ff"
              sx={{whiteSpace: 'nowrap'}}>
              여행 용품
            </Button>
            <Button
              component={Link}
              to="/packages"
              startIcon={<TravelExploreIcon />}
              variant="contained"
              color="#74b9ff"
              sx={{whiteSpace: 'nowrap'}}>
              패키지
            </Button>
            <Button
              component={Link}
              to="/qna"
              startIcon={<QuestionAnswerIcon />}
              variant="contained"
              color="#74b9ff"
              sx={{whiteSpace: 'nowrap'}}>
              고객 문의
            </Button>
            {user?.roles.includes('admin') && (
              <Button
                component={Link}
                to="/product"
                startIcon={<AdminPanelSettingsIcon />}
                variant="contained"
                color="error"
                sx={{whiteSpace: 'nowrap'}}>
                관리자
              </Button>
            )}
          </Box>

          {/* 로그인 여부에 따른 UI 변경 */}
          {isAuthenticated && user ? (
            <>
              <NotificationMenu />
              {/* 알림 드롭다운 */}
              <IconButton color="inherit" onClick={toggleDropdown} ref={dropdownRef}>
                <AccountCircleIcon />
              </IconButton>

              {/* 프로필 드롭다운 */}
              {isDropdownOpen && (
                <ClickAwayListener onClickAway={handleClickAway}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 50,
                      right: 20,
                      zIndex: 10,
                      minWidth: 180
                    }}>
                    <Paper sx={{boxShadow: 3, borderRadius: 1}}>
                      <MenuList>
                        <MenuItem
                          component={Link}
                          to="/profile"
                          onClick={handleClickAway}>
                          내 프로필
                        </MenuItem>
                        <MenuItem
                          component={Link}
                          to="/booking/my?status=completed"
                          onClick={handleClickAway}>
                          내 예약 목록
                        </MenuItem>
                        <MenuItem
                          component={Link}
                          to="/coupons/my"
                          onClick={handleClickAway}>
                          내 쿠폰함
                        </MenuItem>
                        <MenuItem
                          component={Link}
                          to="/mileage"
                          onClick={handleClickAway}>
                          내 마일리지
                        </MenuItem>
                        <MenuItem
                          component={Link}
                          to="/favorite-list"
                          onClick={handleClickAway}>
                          즐겨찾기
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                          <LogoutIcon sx={{marginRight: 1}} />
                          로그아웃
                        </MenuItem>
                      </MenuList>
                    </Paper>
                  </Box>
                </ClickAwayListener>
              )}
            </>
          ) : (
            <>
              <Button
                component={Link}
                to="/login"
                startIcon={<LoginIcon />}
                color="inherit">
                로그인
              </Button>
              <Button
                component={Link}
                to="/register"
                startIcon={<PersonAddIcon />}
                color="inherit">
                회원가입
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* 모바일 사이드바 */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        ModalProps={{
          keepMounted: true, // 성능 최적화 (필요 시 유지)
          disableEnforceFocus: true // 강제 포커스 해제 (aria-hidden 문제 해결)
        }}>
        <Box sx={{width: 250}} role="presentation" onClick={toggleDrawer(false)}>
          <List>
            <ListItem
              component={Link}
              to="/main"
              sx={{textDecoration: 'none', color: 'inherit'}}>
              <HomeIcon sx={{marginRight: 1}} />
              <ListItemText primary="메인" />
            </ListItem>
            <ListItem
              component={Link}
              to="/flights"
              sx={{textDecoration: 'none', color: 'inherit'}}>
              <FlightIcon sx={{marginRight: 1}} />
              <ListItemText primary="항공" />
            </ListItem>
            <ListItem
              component={Link}
              to="/accommodations/search"
              sx={{textDecoration: 'none', color: 'inherit'}}>
              <HotelIcon sx={{marginRight: 1}} />
              <ListItemText primary="숙소 검색" />
            </ListItem>
            <ListItem
              component={Link}
              to="/tourTicket/list"
              sx={{textDecoration: 'none', color: 'inherit'}}>
              <TourIcon sx={{marginRight: 1}} />
              <ListItemText primary="투어/티켓" />
            </ListItem>
            <ListItem
              component={Link}
              to="/travelItems"
              sx={{textDecoration: 'none', color: 'inherit'}}>
              <ShoppingBagIcon sx={{marginRight: 1}} />
              <ListItemText primary="여행 용품" />
            </ListItem>
            <ListItem
              component={Link}
              to="/qna"
              sx={{textDecoration: 'none', color: 'inherit'}}>
              <QuestionAnswerIcon sx={{marginRight: 1}} />
              <ListItemText primary="고객 문의" />
            </ListItem>
            <ListItem
              component={Link}
              to="/product"
              sx={{textDecoration: 'none', color: 'inherit'}}>
              <AdminPanelSettingsIcon sx={{marginRight: 1}} />
              <ListItemText primary="관리자" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
