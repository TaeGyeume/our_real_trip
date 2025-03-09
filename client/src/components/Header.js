import React, {useState, useEffect, useRef} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
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
import FlightIcon from '@mui/icons-material/Flight';
import HomeIcon from '@mui/icons-material/Home';
import HotelIcon from '@mui/icons-material/Hotel';
import TourIcon from '@mui/icons-material/CardTravel';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Header = () => {
  const location = useLocation();
  const {user, isAuthenticated, fetchUserProfile, logout} = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navItems = [
    {label: '메인', path: '/main', imgSrc: '/images/category/main.png'},
    {label: '항공권', path: '/flights', imgSrc: '/images/category/flight.png'},
    {
      label: '숙소',
      path: '/accommodations',
      imgSrc: '/images/category/accommodation.png'
    },
    {
      label: '투어·티켓',
      path: '/tourTicket/list',
      imgSrc: '/images/category/tourticket.png'
    },
    {label: '여행 용품', path: '/travelItems', imgSrc: '/images/category/travelitem.png'},
    {label: '패키지', path: '/packages', imgSrc: '/images/category/package.png'},
    {label: '고객 문의', path: '/qna', imgSrc: '/images/category/qna.png'}
  ];

  const membershipImages = {
    길초보: '/images/category/beginner.png',
    길잡이: '/images/category/guide.png',
    모험왕: '/images/category/adventure.png'
  };

  // 사용자의 멤버십 이미지 결정
  const membershipImage =
    membershipImages[user?.membershipLevel] || '/images/membership/default.png';

  if (user?.roles.includes('admin')) {
    navItems.push({
      label: '관리자',
      path: '/product',
      imgSrc: '/images/category/admin.png'
    });
  }

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
          backgroundColor: '#FFFFFF', // 흰색 배경 적용
          boxShadow: 1, // 살짝 떠있는 효과
          color: 'black'
        }}>
        <Toolbar sx={{justifyContent: 'space-between'}}>
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
              textDecoration: 'none',
              color: 'black',
              fontWeight: 'bold',
              fontFamily: '"Pacifico", cursive',
              fontSize: '24px'
            }}>
            Our Real Trip
          </Typography>

          {/* 네비게이션 메뉴 */}
          <Box sx={{display: 'flex', gap: 4}}>
            {navItems.map(({label, path, icon, imgSrc}) => {
              const isActive = location.pathname.startsWith(path); // 현재 URL과 비교

              return (
                <Button
                  key={path}
                  component={Link}
                  to={path}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center', // 중앙 정렬 추가
                    color: isActive ? 'primary.main' : 'black',
                    fontWeight: isActive ? 'bold' : 'normal',
                    borderBottom: isActive ? '3px solid' : 'none', // 활성 메뉴 밑줄 표시
                    borderBottomColor: isActive ? 'primary.main' : 'transparent',
                    borderRadius: 0,
                    py: 1,
                    minWidth: '80px' // 버튼 크기 조정 (아이콘과 텍스트 정렬 개선)
                  }}>
                  {/* 아이콘 대신 이미지 사용 가능하도록 조건 추가 */}
                  <Box
                    sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={label}
                        style={{width: '30px', height: '30px'}}
                      />
                    ) : (
                      icon
                    )}
                    <Typography variant="body2" sx={{mt: 0.5}}>
                      {label}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Box>

          {/* 로그인 여부에 따른 UI 변경 */}
          <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
            {isAuthenticated && user ? (
              <>
                <NotificationMenu />
                <IconButton color="inherit" onClick={toggleDropdown} ref={dropdownRef}>
                  <img
                    src={membershipImage} // 멤버십 레벨에 따른 이미지 표시
                    alt="멤버십 등급"
                    style={{
                      width: 32, // 아이콘 크기 맞춤
                      height: 32,
                      borderRadius: '50%', // 원형 유지
                      objectFit: 'cover'
                    }}
                  />
                </IconButton>
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
          </Box>
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
              to="/accommodations"
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
