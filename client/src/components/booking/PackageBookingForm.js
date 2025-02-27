import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getPackageById} from '../../api/package/packageService';
import {fetchFlights} from '../../api/flight/flights';
import {
  createBooking,
  verifyPayment,
  cancelBooking
} from '../../api/booking/bookingService';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import {authAPI} from '../../api/auth/index';

import CouponSelector from './CouponSelector';

import {
  Alert,
  Snackbar,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Box,
  TextField
} from '@mui/material';

const PackageBookingForm = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  // ───────── 패키지 및 항공 정보 ─────────
  const [packageData, setPackageData] = useState(null);
  const [flightsData, setFlightsData] = useState([]);

  // ───────── 로그인 사용자 & 쿠폰 ─────────
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // ───────── 가격 상태 (수량 제거) ─────────
  const [basePrice, setBasePrice] = useState(0); // 패키지 기본가격
  const [discountRate, setDiscountRate] = useState(0); // 패키지 자체 할인율
  const [packageDiscount, setPackageDiscount] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  // ───────── 예약자 정보 ─────────
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // ───────── 알림/결제 완료 ─────────
  const [openAlert, setOpenAlert] = useState(false);

  // ─────────────────────────────────────────────────────────
  // 패키지 & 항공 & 사용자 & 쿠폰 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) 패키지 조회
        const pkg = await getPackageById(id);
        setPackageData(pkg);

        // 2) 항공편 상세 (if flights exist)
        if (pkg.flights && pkg.flights.length > 0) {
          const flightIds = pkg.flights.map(f => f.flightId);
          const flightPromises = flightIds.map(fetchFlightById);
          const loadedFlights = await Promise.all(flightPromises);
          setFlightsData(loadedFlights);
        }

        // 3) 패키지 할인율 & basePrice (수량 제거 → 그냥 pkg.price)
        const base = pkg.price || 0;
        setBasePrice(base);

        const pkgDiscountRate = pkg.discountRate || 0;
        setDiscountRate(pkgDiscountRate);

        // 패키지 자체 할인 계산
        const pkgDiscount = Math.floor((base * pkgDiscountRate) / 100);
        setPackageDiscount(pkgDiscount);

        // 초기 최종금액 = basePrice - packageDiscount (쿠폰은 아직 선택 전)
        setFinalPrice(base - pkgDiscount);

        // 4) 사용자 / 쿠폰
        const userData = await authAPI.getUserProfile();
        setUser(userData);
        setReservationInfo({
          name: userData.username,
          email: userData.email,
          phone: userData.phone
        });

        const coupons = await fetchUserCoupons(userData._id);
        // 쿠폰 사용 가능 여부 (예: 패키지 가격 >= minPurchaseAmount)
        const validCoupons = coupons.filter(
          c => !c.isUsed && c.coupon.minPurchaseAmount <= base
        );
        setUserCoupons(validCoupons);
      } catch (error) {
        console.error('패키지 예약 데이터 로드 중 오류:', error);
      }
    };

    const fetchFlightById = async flightId => {
      try {
        const allFlights = await fetchFlights();
        return allFlights.find(f => f._id === flightId) || null;
      } catch (error) {
        console.error('항공편 조회 오류:', error);
        return null;
      }
    };

    fetchData();
  }, [id]);

  // ─────────────────────────────────────────────────────────
  // 쿠폰 선택 → 최종금액 재계산
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setCouponDiscount(discount);

    // 패키지 할인 후 금액
    const afterPkgDiscount = basePrice - packageDiscount;
    // 쿠폰 적용
    const newFinal = afterPkgDiscount - discount;
    setFinalPrice(newFinal < 0 ? 0 : newFinal);
  };

  // ─────────────────────────────────────────────────────────
  // 예약자 정보 변경
  const handleReservationChange = e => {
    const {name, value} = e.target;
    setReservationInfo(prev => ({...prev, [name]: value}));
  };

  // ─────────────────────────────────────────────────────────
  // 결제하기
  const handlePayment = async () => {
    if (!packageData || !user) return;

    // 예약정보 서버에 저장
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const merchant_uid = `package_${user.username}_${now
      .toISOString()
      .slice(2, 19)
      .replace(/[-T:]/g, '')}`;

    try {
      const bookingRes = await createBooking({
        types: ['package'],
        productIds: [packageData._id],
        counts: [1], // 수량은 고정 1개
        merchant_uid,
        totalPrice: basePrice,
        discountAmount: packageDiscount + couponDiscount,
        finalPrice,
        userId: user._id,
        couponId: selectedCoupon ? selectedCoupon._id : null,
        reservationInfo
      });

      if (!bookingRes || !bookingRes.booking) {
        throw new Error('예약 생성 실패');
      }
    } catch (error) {
      alert('예약 요청 중 오류가 발생했습니다.');
      return;
    }

    // 아임포트 결제
    const {IMP} = window;
    IMP.init('imp22685348');
    IMP.request_pay(
      {
        pg: 'html5_inicis.INIpayTest',
        pay_method: 'card',
        merchant_uid,
        name: packageData.name,
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
              setTimeout(() => navigate('/mypage/bookings'), 2000);
            } else {
              alert(`결제 검증 실패: ${verifyResponse.message}`);
            }
          } catch (err) {
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

  // 로딩 중
  if (!packageData || !user) {
    return <Typography>상품 정보를 불러오는 중...</Typography>;
  }

  // ─────────────────────────────────────────────────────────
  // 렌더링
  return (
    <Container maxWidth="md" sx={{mt: 5}}>
      <Typography variant="h4" gutterBottom>
        예약하기
      </Typography>

      {/* 상품명 / 설명 */}
      <Typography variant="h5" sx={{mb: 2}}>
        {packageData.name}
      </Typography>
      <Typography variant="body1" sx={{mb: 3}}>
        {packageData.description}
      </Typography>

      {/* 이미지들 */}
      {packageData.images && packageData.images.length > 0 && (
        <Grid container spacing={2} sx={{mb: 3}}>
          {packageData.images.map((img, idx) => (
            <Grid item xs={6} sm={4} key={idx}>
              <img
                src={`http://localhost:5000${img}`}
                alt={`패키지 이미지 ${idx}`}
                style={{width: '100%', objectFit: 'cover', height: '180px'}}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* 포함 사항 (숙소/투어/항공) */}
      <Card sx={{mb: 3}}>
        <CardContent>
          <Typography variant="h6">포함 사항</Typography>
          <Divider sx={{my: 1}} />
          <Box sx={{mt: 2}}>
            {/* 숙소 */}
            <Typography variant="body1" sx={{mb: 1}}>
              <strong>숙소</strong> :{' '}
              {packageData.accommodations && packageData.accommodations.length > 0
                ? packageData.accommodations.map(acc => {
                    const priceText = acc.minPrice
                      ? `${acc.minPrice.toLocaleString()}원`
                      : '가격 정보 없음';
                    return `\n- ${acc.name} (${priceText})`;
                  })
                : '없음'}
            </Typography>
            {/* 투어 */}
            <Typography variant="body1" sx={{mb: 1}}>
              <strong>투어</strong> :{' '}
              {packageData.tours && packageData.tours.length > 0
                ? packageData.tours.map(t => {
                    const priceText = t.price
                      ? `${t.price.toLocaleString()}원`
                      : '가격 정보 없음';
                    return `\n- ${t.title} (${priceText})`;
                  })
                : '없음'}
            </Typography>
            {/* 항공편 */}
            <Typography variant="body1" sx={{mb: 1}}>
              <strong>항공편</strong> :{' '}
              {flightsData && flightsData.length > 0
                ? flightsData.map(f => {
                    const priceText = f.price
                      ? `${f.price.toLocaleString()}원`
                      : '가격 정보 없음';

                    const seats = f.seatsAvailable
                      ? `잔여좌석 ${f.seatsAvailable}석`
                      : '잔여좌석 정보 없음';
                    return `\n- ${f.flightNumber} / ${f.airline} / ${priceText} / ${seats}`;
                  })
                : '없음'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 가격 정보 */}
      <Typography variant="h6" sx={{mb: 1}}>
        원래 가격 :{' '}
        <span style={{textDecoration: 'line-through'}}>
          {basePrice.toLocaleString()}원
        </span>
        {discountRate > 0 && (
          <span style={{color: 'red', marginLeft: '10px'}}>할인율 : {discountRate}%</span>
        )}
      </Typography>
      <Typography variant="h6" sx={{mb: 3}}>
        최종 가격 (할인 적용) : <strong>{finalPrice.toLocaleString()} 원</strong>
      </Typography>

      {/* 쿠폰 */}
      <Divider sx={{my: 2}} />
      <Typography variant="h6">쿠폰 사용</Typography>
      <CouponSelector
        userCoupons={userCoupons}
        itemPrice={basePrice} // 수량 고정 1이므로 basePrice
        count={1}
        onCouponSelect={handleCouponSelect}
      />

      {/* 예약자 정보 */}
      <Divider sx={{my: 2}} />
      <Typography variant="h6" sx={{mb: 1}}>
        예약자 정보
      </Typography>
      <Grid container spacing={2} sx={{mb: 3}}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="이름"
            fullWidth
            name="name"
            value={reservationInfo.name}
            onChange={handleReservationChange}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="이메일"
            fullWidth
            name="email"
            value={reservationInfo.email}
            onChange={handleReservationChange}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="전화번호"
            fullWidth
            name="phone"
            value={reservationInfo.phone}
            onChange={handleReservationChange}
          />
        </Grid>
      </Grid>

      {/* 결제하기 버튼 */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{mt: 3}}
        onClick={handlePayment}>
        결제하기
      </Button>

      {/* 결제 완료 알림 */}
      <Snackbar
        open={openAlert}
        autoHideDuration={2000}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
        <Alert onClose={() => setOpenAlert(false)} severity="success" variant="filled">
          패키지 예약이 완료되었습니다.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PackageBookingForm;
