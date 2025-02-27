// src/components/CouponSidebar.js
import React, {useEffect, useState} from 'react';
import {
  fetchCouponsByMembership,
  claimCoupon,
  fetchUserCoupons
} from '../../api/coupon/couponService';
import {authAPI} from '../../api/auth';
import {useAuthStore} from '../../store/authStore';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Stack
} from '@mui/material';
import {FaChevronDown, FaTicketAlt} from 'react-icons/fa';

const CouponSidebar = () => {
  const {isAuthenticated, checkAuth} = useAuthStore();
  const [user, setUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimedCoupons, setClaimedCoupons] = useState(new Set());
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
          } else {
            console.error('fetchUserCoupons 응답이 배열이 아닙니다:', userCoupons);
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
          setCoupons(data);
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
      {/* 토글 버튼 */}
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
        <FaTicketAlt />
      </IconButton>

      {/* 사이드바 (Drawer) */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {width: 320, p: 2, backgroundColor: '#f9f9f9'}
        }}>
        {/* 헤더 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            🎫 쿠폰 목록
          </Typography>
          <IconButton onClick={() => setIsOpen(false)}>
            <FaChevronDown />
          </IconButton>
        </Stack>

        {/* 쿠폰 내용 */}
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
            <Stack spacing={2}>
              {coupons.map(coupon => (
                <Card key={coupon._id} sx={{borderRadius: 2, boxShadow: 2}}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {coupon.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {coupon.description}
                    </Typography>
                    <Button
                      fullWidth
                      variant={claimedCoupons.has(coupon._id) ? 'contained' : 'outlined'}
                      color={claimedCoupons.has(coupon._id) ? 'secondary' : 'primary'}
                      onClick={() => handleClaimCoupon(coupon._id)}
                      disabled={claimedCoupons.has(coupon._id)}
                      sx={{mt: 1, fontWeight: 'bold'}}>
                      {claimedCoupons.has(coupon._id) ? '✅ 받은 쿠폰' : '📥 쿠폰 받기'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Typography align="center" color="textSecondary">
              사용 가능한 쿠폰이 없습니다.
            </Typography>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default CouponSidebar;
