// client/src/pages/user/Profile.js

import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {authAPI} from '../../api/auth';
import {useAuthStore} from '../../store/authStore';

// MUI
import {ThemeProvider} from '@mui/material/styles';
import {
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Avatar,
  Stack,
  Grid,
  Chip
} from '@mui/material';

// 아이콘
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';

// (선택) 커스텀 테마
import profileTheme from './styles/ProfileTheme';

const Profile = () => {
  const [userData, setUserData] = useState({
    userid: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    membershipLevel: '',
    mileage: 0
  });
  const [originalData, setOriginalData] = useState({});

  // 로딩/에러/성공 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 아이디/이메일/전화번호 중복 검사 메시지
  const [checkMessage, setCheckMessage] = useState({
    userid: '',
    email: '',
    phone: ''
  });

  // 전체 편집 모드 여부
  const [isEditing, setIsEditing] = useState(false);

  const {checkAuth} = useAuthStore();
  const navigate = useNavigate();

  // --------------------
  // 1) 사용자 프로필 불러오기
  // --------------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await checkAuth();
        const response = await authAPI.getUserProfile();

        // 필요한 데이터만 추려서 저장
        const filteredData = {
          userid: response.userid,
          username: response.username,
          email: response.email,
          phone: response.phone,
          address: response.address,
          membershipLevel: response.membershipLevel,
          mileage: response.mileage
        };
        setUserData(filteredData);
        setOriginalData(filteredData);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile. Please log in again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [checkAuth]);

  // --------------------
  // 2) 입력값 변경
  // --------------------
  const handleChange = e => {
    const {name, value} = e.target;
    setUserData(prev => ({...prev, [name]: value}));

    // 아이디/이메일/전화번호 변경 시 중복 메시지 초기화
    if (['userid', 'email', 'phone'].includes(name)) {
      setCheckMessage(prev => ({...prev, [name]: ''}));
    }
  };

  // --------------------
  // 3) onBlur 시 자동 중복 검사
  // --------------------
  const handleBlur = async e => {
    const {name, value} = e.target;

    // 아이디/이메일/전화번호만 검사
    if (!['userid', 'email', 'phone'].includes(name)) return;

    // 원본 값과 동일하면 검사 불필요
    if (value === originalData[name]) {
      setCheckMessage(prev => ({...prev, [name]: ''}));
      return;
    }

    // 비어 있으면 검사 불필요
    if (!value.trim()) {
      setCheckMessage(prev => ({...prev, [name]: ''}));
      return;
    }

    try {
      const response = await authAPI.checkDuplicate({[name]: value});
      setCheckMessage(prev => ({...prev, [name]: response.message || ''}));
    } catch (err) {
      setCheckMessage(prev => ({
        ...prev,
        [name]:
          err.response?.data?.message || err.message || 'Failed to check duplication.'
      }));
    }
  };

  // --------------------
  // 4) 수정/취소/저장 로직
  // --------------------
  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setUserData(originalData);
    setCheckMessage({userid: '', email: '', phone: ''});
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // 변경된 값만 추려서 전송
    const updatedData = {};
    Object.keys(userData).forEach(key => {
      if (userData[key] !== originalData[key]) {
        updatedData[key] = userData[key];
      }
    });

    // 변경이 전혀 없다면 종료
    if (Object.keys(updatedData).length === 0) {
      setError('수정할 정보를 다시 확인해주세요');
      return;
    }

    // 변경된 필드별로 중복 검사 메시지 확인
    // 1) 아이디
    if (updatedData.userid !== undefined) {
      // userid가 바뀌었다면, checkMessage.userid 확인
      const msg = checkMessage.userid || '';
      // "available"이거나, ''이면 중복 문제 없는 것으로 처리 (서버 메시지에 맞춰 수정)
      if (
        msg.includes('already in use') ||
        msg.includes('이미 존재') ||
        msg.includes('오류')
      ) {
        setError('수정할 아이디를 다시 확인해주세요.');
        return;
      }
    }
    // 2) 이메일
    if (updatedData.email !== undefined) {
      const msg = checkMessage.email || '';
      if (
        msg.includes('already in use') ||
        msg.includes('이미 존재') ||
        msg.includes('오류')
      ) {
        setError('수정할 이메일을 다시 확인해주세요.');
        return;
      }
    }
    // 3) 전화번호
    if (updatedData.phone !== undefined) {
      const msg = checkMessage.phone || '';
      if (
        msg.includes('already in use') ||
        msg.includes('이미 존재') ||
        msg.includes('오류')
      ) {
        setError('수정할 전화번호를 다시 확인해주세요.');
        return;
      }
    }

    try {
      await authAPI.updateProfile(updatedData);
      setSuccess('수정이 완료되었습니다.');
      setOriginalData(userData);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || '수정할 정보를 다시확인해주세요');
    }
  };

  // --------------------
  // 5) 이동 함수들
  // --------------------
  // const goToMileagePage = () => navigate('/mileage');
  const goToFavorites = () => navigate('/favorite-list');
  const goToCoupons = () => navigate('/coupons/my');
  const goToMileageHistory = () => navigate('/mileage');

  // 로딩 표시
  if (loading) {
    return (
      <ThemeProvider theme={profileTheme}>
        <Box sx={{textAlign: 'center', mt: 5}}>
          <CircularProgress />
          <Typography sx={{mt: 2}}>Loading profile...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // --------------------
  // 실제 렌더링
  // --------------------
  return (
    <ThemeProvider theme={profileTheme}>
      <Container maxWidth="md" sx={{py: 4}}>
        {/* 메인 타이틀 */}
        <Typography variant="h4" sx={{mb: 3, fontWeight: 'bold'}}>
          내 정보
        </Typography>

        {/* 에러/성공 메시지 */}
        {error && (
          <Alert severity="error" sx={{mb: 2}}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{mb: 2}}>
            {success}
          </Alert>
        )}

        {/* 2컬럼 레이아웃 */}
        <Box sx={{display: 'flex', flexDirection: {xs: 'column', md: 'row'}, gap: 4}}>
          {/* 왼쪽 컬럼: Personal Information + Membership Details */}
          <Card sx={{flex: 1, boxShadow: 3}}>
            <CardContent sx={{p: 3}}>
              {/* Personal Information 헤더 */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}>
                <Typography variant="h5" sx={{fontWeight: 'bold'}}>
                  Personal Information
                </Typography>
                {isEditing ? (
                  <Box sx={{display: 'flex', gap: 1}}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      startIcon={<EditIcon />}>
                      CANCEL
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      startIcon={<SaveIcon />}>
                      SAVE
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={handleEdit}
                    startIcon={<EditIcon />}>
                    내정보 수정하기
                  </Button>
                )}
              </Box>

              {/* Personal Info Fields */}
              {isEditing ? (
                // 편집 모드: TextField + Grid 2열 배치
                <Grid container spacing={2}>
                  {/* User ID */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="아이디"
                      name="userid"
                      size="small"
                      value={userData.userid}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                    />
                    {checkMessage.userid && (
                      <Typography variant="body2" color="error" sx={{mt: 0.5}}>
                        {checkMessage.userid}
                      </Typography>
                    )}
                  </Grid>

                  {/* Full Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="이름름"
                      name="username"
                      size="small"
                      value={userData.username}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>

                  {/* Email Address */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="이메일일"
                      name="email"
                      size="small"
                      value={userData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                    />
                    {checkMessage.email && (
                      <Typography variant="body2" color="error" sx={{mt: 0.5}}>
                        {checkMessage.email}
                      </Typography>
                    )}
                  </Grid>

                  {/* Phone Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="전화번호"
                      name="phone"
                      size="small"
                      value={userData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                    />
                    {checkMessage.phone && (
                      <Typography variant="body2" color="error" sx={{mt: 0.5}}>
                        {checkMessage.phone}
                      </Typography>
                    )}
                  </Grid>

                  {/* Address (1열 전체 폭) */}
                  <Grid item xs={12}>
                    <TextField
                      label="주소"
                      name="address"
                      size="small"
                      value={userData.address}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ) : (
                // 읽기 모드: 2열 배치
                <Grid container spacing={2}>
                  {/* User ID */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      아이디
                    </Typography>
                    <Typography variant="body1" sx={{fontWeight: 500}}>
                      {userData.userid}
                    </Typography>
                  </Grid>
                  {/* Full Name */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      이름
                    </Typography>
                    <Typography variant="body1" sx={{fontWeight: 500}}>
                      {userData.username}
                    </Typography>
                  </Grid>
                  {/* Email Address */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      이메일
                    </Typography>
                    <Typography variant="body1" sx={{fontWeight: 500}}>
                      {userData.email}
                    </Typography>
                  </Grid>
                  {/* Phone Number */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      전화번호
                    </Typography>
                    <Typography variant="body1" sx={{fontWeight: 500}}>
                      {userData.phone}
                    </Typography>
                  </Grid>
                  {/* Address */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      주소
                    </Typography>
                    <Typography variant="body1" sx={{fontWeight: 500}}>
                      {userData.address}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              {/* 사이에 가로선 추가 */}
              <Divider
                sx={{
                  mt: 4,
                  mb: 2,
                  borderBottomWidth: '2px',
                  borderColor: '#E0E0E0'
                }}
              />

              {/* Membership Details */}
              <Typography variant="h6" sx={{fontWeight: 'bold', mb: 2}}>
                Membership
              </Typography>
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center'}}>
                {/* 회원 등급 */}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    등급
                  </Typography>
                  <Chip
                    label={userData.membershipLevel || 'Basic'}
                    sx={{
                      mt: 0.5,
                      bgcolor:
                        userData.membershipLevel?.toLowerCase() === 'gold'
                          ? 'gold'
                          : 'grey.300',
                      color: 'black',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                {/* 마일리지 */}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    마일리지
                  </Typography>
                  <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                    {userData.mileage.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 오른쪽 컬럼: 아바타 + My Account */}
          <Stack spacing={3} sx={{width: {xs: '100%', md: 320}}}>
            {/* 아바타 카드 */}
            <Paper sx={{p: 3, textAlign: 'center', boxShadow: 2}}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 2,
                    bgcolor: 'grey.400'
                  }}>
                  {userData.username ? userData.username[0] : 'N'}
                </Avatar>
                <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                  {userData.username || 'No Name'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userData.membershipLevel || 'Member'}
                </Typography>
              </Box>
            </Paper>

            {/* My Account 메뉴 */}
            <Paper sx={{p: 3, boxShadow: 2}}>
              <Typography variant="h6" sx={{fontWeight: 'bold', mb: 2}}>
                My Account
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<ConfirmationNumberIcon />}
                  fullWidth
                  sx={{justifyContent: 'flex-start', textTransform: 'none'}}
                  onClick={goToCoupons}>
                  나의 쿠폰함
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<BookmarkIcon />}
                  fullWidth
                  sx={{justifyContent: 'flex-start', textTransform: 'none'}}
                  onClick={goToFavorites}>
                  나의 즐겨찾기
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  fullWidth
                  sx={{justifyContent: 'flex-start', textTransform: 'none'}}
                  onClick={goToMileageHistory}>
                  마일리지 내역
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Profile;
