import React, {useEffect, useState} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import {getRoomById} from '../../api/room/roomService';
import {createBooking, verifyPayment} from '../../api/booking/bookingService';
import {authAPI} from '../../api/auth/index';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import {cancelBooking} from '../../api/booking/bookingService';
import CouponSelector from './CouponSelector';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Stack
} from '@mui/material';

const BookingForm = () => {
  const {roomId} = useParams();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const defaultStartDate = searchParams.get('startDate') || '';
  const defaultEndDate = searchParams.get('endDate') || '';

  const [formData, setFormData] = useState({
    rooms: [{startDate: defaultStartDate, endDate: defaultEndDate, count: 1}]
  });

  const [useUserInfo, setUseUserInfo] = useState(false); // 체크박스 상태 추가
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomData = await getRoomById(roomId);
        setRoom(roomData);
        await fetchUserData(roomData); // roomData를 fetchUserData에 전달
      } catch (error) {
        console.error('객실 정보를 불러오는 중 오류 발생:', error);
      }
    };

    const fetchUserData = async roomData => {
      // roomData 파라미터 추가
      try {
        const userData = await authAPI.getUserProfile();
        setUser(userData);
        const coupons = await fetchUserCoupons(userData._id);

        // 최소 예약 금액 충족하는 쿠폰만 필터링
        const validCoupons = coupons.filter(
          coupon =>
            !coupon.isUsed && coupon.coupon.minPurchaseAmount <= roomData.pricePerNight
        );

        setUserCoupons(validCoupons);
      } catch (error) {
        console.error('사용자 정보를 불러오는 중 오류 발생:', error);
      }
    };

    fetchRoom();
  }, [roomId]);

  // 체크박스 클릭 시 로그인한 사용자 정보 입력
  const handleUseUserInfo = () => {
    if (!useUserInfo) {
      setReservationInfo({
        name: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || ''
      });
    } else {
      setReservationInfo({
        name: '',
        email: '',
        phone: ''
      });
    }
    setUseUserInfo(!useUserInfo);
  };

  // 입력 필드 변경 핸들러
  const handleInputChange = e => {
    const {name, value} = e.target;
    setReservationInfo({...reservationInfo, [name]: value});
  };

  if (!room || !user) {
    return <p>객실 정보를 불러오는 중...</p>;
  }

  // 입력값 변경 핸들러 (객실 개별 데이터 변경)
  const handleRoomChange = (index, key, value) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[index][key] = value;
    setFormData({...formData, rooms: updatedRooms});
  };

  // 쿠폰 선택 핸들러
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setDiscountAmount(discount);
  };

  const handlePayment = async () => {
    if (!reservationInfo.name || !reservationInfo.email || !reservationInfo.phone) {
      alert('예약자 정보를 모두 입력해주세요.');
      return;
    }

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // 한국 시간
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, ''); // YYMMDDHHMMSS
    const merchant_uid = `${user.username}_${formattedDate}`;

    const startDates = formData.rooms.map(room => room.startDate);
    const endDates = formData.rooms.map(room => room.endDate);
    const counts = formData.rooms.map(room => room.count);

    const nights = formData.rooms.map(room =>
      Math.ceil(
        (new Date(room.endDate) - new Date(room.startDate)) / (1000 * 60 * 60 * 24)
      )
    );
    const checkInTimes = formData.rooms.map(() => room.checkInTime || '15:00');
    const checkOutTimes = formData.rooms.map(() => room.checkOutTime || '11:00');

    const totalPrice = nights.reduce(
      (sum, night, i) => sum + night * room.pricePerNight * counts[i],
      0
    );

    const finalPrice = totalPrice - discountAmount;

    try {
      const bookingResponse = await createBooking({
        types: Array(formData.rooms.length).fill('accommodation'),
        productIds: Array(formData.rooms.length).fill(room.accommodation),
        roomIds: Array(formData.rooms.length).fill(room._id),
        counts,
        merchant_uid,
        startDates,
        endDates,
        totalPrice, // 총 결제 금액 (할인 전) 추가
        discountAmount, // 할인 금액 추가
        finalPrice, // 최종 결제 금액 (할인 후) 추가
        userId: user._id,
        couponId: selectedCoupon ? selectedCoupon._id : null,
        reservationInfo,
        checkInTimes,
        checkOutTimes
      });

      console.log('예약 생성 응답:', bookingResponse);

      if (!bookingResponse || !bookingResponse.booking) {
        throw new Error('예약 생성 실패');
      }

      const {IMP} = window;
      IMP.init('imp22685348');

      IMP.request_pay(
        {
          pg: 'html5_inicis.INIpayTest',
          pay_method: 'card',
          merchant_uid,
          name: room.name,
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
                alert('예약 및 결제가 완료되었습니다.');
              } else {
                alert(`결제 검증 실패: ${verifyResponse.message}`);
              }
            } catch (error) {
              console.error('결제 검증 중 오류 발생:', error);
              alert('결제 검증 중 오류가 발생했습니다.');
            }
          } else {
            alert(`결제 실패: ${rsp.error_msg}`);
            if (selectedCoupon) {
              console.log('[클라이언트] 결제 취소, 예약 취소 요청 보냄:', merchant_uid);
              await cancelBooking(merchant_uid);
            }
          }
        }
      );
    } catch (error) {
      console.error('예약 요청 오류:', error);
      alert('예약 요청 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box sx={{maxWidth: 600, mx: 'auto', mt: 4}}>
      <Typography variant="h4" sx={{mb: 3, fontWeight: 'bold', textAlign: 'center'}}>
        숙소 예약
      </Typography>

      <Card sx={{mb: 3, p: 2}}>
        <CardContent>
          <Typography variant="h5" sx={{fontWeight: 'bold'}}>
            {room.name}
          </Typography>
          <Typography variant="subtitle1" sx={{color: 'text.secondary'}}>
            💰 1박 가격: {room.pricePerNight.toLocaleString()} 원
          </Typography>
        </CardContent>
      </Card>

      {formData.rooms.map((roomData, index) => (
        <Card key={index} sx={{mb: 2, p: 2, boxShadow: 3}}>
          <CardContent>
            <Typography variant="h6" sx={{fontWeight: 'bold'}}>
              🏨 객실 {index + 1}
            </Typography>
            <Stack spacing={2} sx={{mt: 1}}>
              <TextField
                label="📅 체크인 날짜"
                type="date"
                fullWidth
                value={roomData.startDate}
                onChange={e => handleRoomChange(index, 'startDate', e.target.value)}
                InputLabelProps={{shrink: true}}
              />
              <TextField
                label="📅 체크아웃 날짜"
                type="date"
                fullWidth
                value={roomData.endDate}
                onChange={e => handleRoomChange(index, 'endDate', e.target.value)}
                InputLabelProps={{shrink: true}}
              />
            </Stack>
          </CardContent>
        </Card>
      ))}

      <FormControlLabel
        control={<Checkbox checked={useUserInfo} onChange={handleUseUserInfo} />}
        label="로그인한 사용자 정보 사용"
      />

      <Stack spacing={2} sx={{mt: 2}}>
        <TextField
          label="예약자 이름"
          fullWidth
          value={reservationInfo.name}
          onChange={handleInputChange}
          name="name"
        />
        <TextField
          label="이메일"
          fullWidth
          value={reservationInfo.email}
          onChange={handleInputChange}
          name="email"
        />
        <TextField
          label="연락처"
          fullWidth
          value={reservationInfo.phone}
          onChange={handleInputChange}
          name="phone"
        />
      </Stack>

      <CouponSelector
        userCoupons={userCoupons}
        itemPrice={room.pricePerNight}
        count={formData.rooms[0].count}
        onCouponSelect={handleCouponSelect}
      />

      <Typography sx={{mt: 2, fontWeight: 'bold'}}>
        최종 결제 금액:{' '}
        {(room.pricePerNight * formData.rooms[0].count - discountAmount).toLocaleString()}{' '}
        원
      </Typography>

      <Button
        variant="contained"
        fullWidth
        sx={{mt: 3}}
        color="primary"
        onClick={handlePayment}>
        💳 결제하기
      </Button>
    </Box>
  );
};

export default BookingForm;
