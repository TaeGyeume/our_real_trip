import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getTourTicketById} from '../../api/tourTicket/tourTicketService';
import {
  createBooking,
  verifyPayment,
  cancelBooking
} from '../../api/booking/bookingService';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import {authAPI} from '../../api/auth/index';
import CouponSelector from './CouponSelector';
import QuantitySelector from './QuantitySelector';
import {
  Alert,
  Snackbar,
  Button,
  TextField,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';

const TourTicketBookingForm = () => {
  const {id} = useParams();
  const [ticket, setTicket] = useState(null);
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0); // 🛠️ 추가된 상태
  const [formData, setFormData] = useState({count: 1});
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTourTicketById(id);
        setTicket(data);
        fetchUserData(data.price);
      } catch (error) {
        console.error('상품 정보를 가져오는 중 오류 발생:', error);
      }
    };

    const fetchUserData = async itemPrice => {
      try {
        const userData = await authAPI.getUserProfile();
        setUser(userData);

        setReservationInfo({
          name: userData.username,
          email: userData.email,
          phone: userData.phone
        });

        const coupons = await fetchUserCoupons(userData._id);
        const validCoupons = coupons.filter(
          coupon =>
            !coupon.isUsed &&
            coupon.coupon.minPurchaseAmount <= itemPrice * formData.count
        );

        setUserCoupons(validCoupons);
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      }
    };

    fetchTicket();
  }, [id, formData.count]);

  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setDiscountAmount(discount);
  };

  const handleQuantityChange = newCount => {
    setFormData({...formData, count: newCount});
  };

  const handleReservationChange = e => {
    const {name, value} = e.target;
    setReservationInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    if (!ticket || !user) return;

    const totalPrice = ticket.price * formData.count;
    const finalPrice = totalPrice - discountAmount;

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, '');

    const merchant_uid = `tour_${user.username}_${formattedDate}`;

    try {
      const bookingResponse = await createBooking({
        types: ['tourTicket'],
        productIds: [ticket._id],
        counts: [formData.count],
        merchant_uid,
        totalPrice,
        discountAmount,
        finalPrice,
        userId: user._id,
        couponId: selectedCoupon ? selectedCoupon._id : null,
        reservationInfo
      });

      if (!bookingResponse || !bookingResponse.booking) {
        throw new Error('예약 생성 실패');
      }
    } catch (error) {
      alert('예약 요청 중 오류가 발생했습니다.');
      return;
    }

    const {IMP} = window;
    IMP.init('imp22685348');

    IMP.request_pay(
      {
        pg: 'html5_inicis.INIpayTest',
        pay_method: 'card',
        merchant_uid,
        name: ticket.title,
        amount: finalPrice,
        buyer_email: user.email,
        buyer_name: user.username,
        buyer_tel: user.phone
      },
      async rsp => {
        if (rsp.success) {
          try {
            const verifyResponse = await verifyPayment({
              imp_uid: rsp.imp_uid,
              merchant_uid,
              couponId: selectedCoupon ? selectedCoupon._id : null,
              userId: user._id
            });

            if (verifyResponse.message === '결제 검증 성공') {
              setOpenAlert(true);
              setTimeout(() => {
                navigate('/mypage/bookings');
              }, 2000);
            } else {
              alert(`결제 검증 실패: ${verifyResponse.message}`);
            }
          } catch (error) {
            alert('결제 검증 중 오류가 발생했습니다.');
          }
        } else {
          alert(`결제 실패: ${rsp.error_msg}`);

          if (selectedCoupon) {
            await cancelBooking(merchant_uid);
          }
        }
      }
    );
  };

  if (!ticket || !user) {
    return <Typography>상품 정보를 불러오는 중...</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{mt: 5}}>
      <Typography variant="h4" gutterBottom>
        예약하기
      </Typography>
      <Card sx={{p: 3}}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {ticket.images && ticket.images.length > 0 && (
              <img
                src={`http://localhost:5000${ticket.images[0]}`}
                alt="투어 티켓 썸네일"
                style={{width: '100%', borderRadius: '10px'}}
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5">{ticket.title}</Typography>
            <QuantitySelector count={formData.count} setCount={handleQuantityChange} />
            <Divider sx={{my: 2}} />
            <Typography variant="h6">쿠폰 사용</Typography>
            <CouponSelector
              userCoupons={userCoupons}
              itemPrice={ticket.price}
              count={formData.count}
              onCouponSelect={handleCouponSelect}
            />
          </Grid>
        </Grid>
        <Divider sx={{my: 3}} />
        <Typography variant="h6">
          총 결제 금액: {finalPrice.toLocaleString()} 원
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{mt: 3}}
          onClick={handlePayment}>
          결제하기
        </Button>
      </Card>

      <Snackbar
        open={openAlert}
        autoHideDuration={2000}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
        <Alert onClose={() => setOpenAlert(false)} severity="success" variant="filled">
          투어 티켓 예약이 완료되었습니다.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TourTicketBookingForm;
