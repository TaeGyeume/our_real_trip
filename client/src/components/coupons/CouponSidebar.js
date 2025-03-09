import React, {useEffect, useState} from 'react';
import {
  fetchCouponsByMembership,
  claimCoupon,
  fetchUserCoupons
} from '../../api/coupon/couponService';
import {authAPI} from '../../api/auth';
import {useAuthStore} from '../../store/authStore';
import {
  Modal,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Stack,
  Badge
} from '@mui/material';
import {FaTimes, FaTicketAlt} from 'react-icons/fa';
import moment from 'moment-timezone';

const CouponModal = () => {
  const {isAuthenticated, checkAuth} = useAuthStore();
  const [user, setUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimedCoupons, setClaimedCoupons] = useState(new Set());
  const [unclaimedCouponsCount, setUnclaimedCouponsCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      if (!isAuthenticated) {
        setUser(null);
        return;
      }
      try {
        await checkAuth();
        const response = await authAPI.getUserProfile();
        setUser(response);

        if (response?._id) {
          const userCoupons = await fetchUserCoupons(response._id);
          if (Array.isArray(userCoupons)) {
            const claimedSet = new Set(
              userCoupons
                .filter(item => item?.coupon && item.coupon._id)
                .map(item => item.coupon._id)
            );
            setClaimedCoupons(claimedSet);
          }
        }
      } catch (error) {
        console.error('유저 정보 로드 오류:', error.message);
      }
    };

    getUserInfo();
  }, [isAuthenticated, checkAuth]);

  useEffect(() => {
    if (user && user.membershipLevel) {
      const getCoupons = async () => {
        try {
          const data = await fetchCouponsByMembership(user.membershipLevel);
          const now = moment().tz('Asia/Seoul'); // 현재 시간
          const validCoupons = data.filter(coupon =>
            moment(coupon.expiresAt).isAfter(now)
          ); // 만료되지 않은 쿠폰만 필터링
          setCoupons(validCoupons);
        } catch (error) {
          console.error('쿠폰 로드 오류:', error.message);
        } finally {
          setLoading(false);
        }
      };

      getCoupons();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (coupons.length > 0) {
      const unclaimedCount = coupons.filter(
        coupon => !claimedCoupons.has(coupon._id)
      ).length;
      setUnclaimedCouponsCount(unclaimedCount);
    }
  }, [coupons, claimedCoupons]);

  const handleClaimCoupon = async couponId => {
    if (!user?._id) {
      alert('사용자 정보가 없습니다. 로그인 후 다시 시도해주세요.');
      return;
    }
    try {
      const response = await claimCoupon(user._id, couponId);
      alert(response.message);
      setClaimedCoupons(prev => new Set(prev).add(couponId));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      {/* 모달 열기 버튼 */}
      <IconButton
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {backgroundColor: 'primary.dark'}
        }}>
        <Badge
          badgeContent={unclaimedCouponsCount} // 받지 않은 쿠폰 개수 표시
          color="error"
          invisible={unclaimedCouponsCount === 0} // 쿠폰이 없으면 뱃지 숨김
          sx={{
            position: 'absolute', // 아이콘 위에 배치
            top: 4, // 위쪽 여백 조정
            right: 4 // 오른쪽 여백 조정
          }}
          anchorOrigin={{
            vertical: 'top', // 뱃지를 상단에 위치
            horizontal: 'right' // 뱃지를 오른쪽에 위치
          }}></Badge>
        <FaTicketAlt />
      </IconButton>

      {/* 모달 창 */}
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        BackdropProps={{
          sx: {backgroundColor: 'transparent'} // 배경 어둡게 하지 않음
        }}>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            right: 20, // 화면 오른쪽에 위치
            transform: 'translateY(-50%)',
            width: 200, // 모달 크기 더 작게 조정
            maxHeight: '70vh', // 길이 제한
            overflowY: 'auto', // 스크롤 가능
            bgcolor: 'background.paper',
            boxShadow: 3,
            p: 2,
            borderRadius: 2
          }}>
          {/* 모달 헤더 */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              🎫 쿠폰
            </Typography>
            <IconButton onClick={() => setIsOpen(false)}>
              <FaTimes />
            </IconButton>
          </Stack>

          {/* 쿠폰 목록 */}
          <Box sx={{mt: 2}}>
            {!user ? (
              <Typography color="textSecondary" align="center">
                🔒 로그인 후 쿠폰을 확인할 수 있습니다.
              </Typography>
            ) : loading ? (
              <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress />
              </Box>
            ) : coupons.length > 0 ? (
              <Stack spacing={1}>
                {coupons.map(coupon => (
                  <Card
                    key={coupon._id}
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      width: '100%',
                      height: 100, // 카드 높이 고정
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                    <CardContent sx={{p: 1}}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis' // 긴 글씨 ... 처리
                        }}>
                        {coupon.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis' // 긴 설명 ... 처리
                        }}>
                        {coupon.description}
                      </Typography>
                    </CardContent>
                    <Button
                      fullWidth
                      variant={claimedCoupons.has(coupon._id) ? 'contained' : 'outlined'}
                      color={claimedCoupons.has(coupon._id) ? 'secondary' : 'primary'}
                      onClick={() => handleClaimCoupon(coupon._id)}
                      disabled={claimedCoupons.has(coupon._id)}
                      sx={{fontSize: '12px', py: 0.5, fontWeight: 'bold'}}>
                      {claimedCoupons.has(coupon._id) ? '✅ 받은 쿠폰' : '📥 쿠폰 받기'}
                    </Button>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography align="center" color="textSecondary">
                사용 가능한 쿠폰이 없습니다.
              </Typography>
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default CouponModal;
