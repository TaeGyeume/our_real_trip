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
import MileageInput from '../mileage/MileageInput';
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

  // ───────── 가격 상태 ─────────
  const [basePrice, setBasePrice] = useState(0); // 패키지 기본가격 (수량은 1로 고정)
  const [discountRate, setDiscountRate] = useState(0); // 패키지 자체 할인율
  const [packageDiscount, setPackageDiscount] = useState(0); // 패키지 자체 할인액
  const [couponDiscount, setCouponDiscount] = useState(0); // 쿠폰 할인액
  const [finalPrice, setFinalPrice] = useState(0); // 최종 결제 금액

  // ───────── 예약자 정보 ─────────
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // ───────── 마일리지 사용 ─────────
  const [usedMileage, setUsedMileage] = useState(0);

  // ───────── 알림/결제 완료 ─────────
  const [openAlert, setOpenAlert] = useState(false);

  // ─────────────────────────────────────────────────────────
  // 데이터 불러오기: 패키지, 항공, 사용자, 쿠폰
  useEffect(() => {
    const fetchData = async () => {
      try {
        const pkg = await getPackageById(id);
        setPackageData(pkg);

        // 숙소 최고가 계산
        const maxAccommodationPrice =
          pkg.accommodations && pkg.accommodations.length > 0
            ? Math.max(...pkg.accommodations.map(acc => acc.minPrice || 0))
            : 0;

        // 객실(Room) 가격 합산
        const totalRoomPrice =
          pkg.accommodations && pkg.accommodations.length > 0
            ? pkg.accommodations.reduce((sum, acc) => {
                const roomTotal = acc.rooms
                  ? acc.rooms.reduce(
                      (roomSum, room) => roomSum + (room.pricePerNight || 0),
                      0
                    )
                  : 0;
                return sum + roomTotal;
              }, 0)
            : 0;

        // 투어/티켓 가격 합산
        const totalTourPrice =
          pkg.tours && pkg.tours.length > 0
            ? pkg.tours.reduce((sum, tour) => sum + (tour.price || 0), 0)
            : 0;

        // 항공편 가격 합산
        const flightIds = pkg.flights ? pkg.flights.map(f => f.flightId) : [];
        const flightPromises = flightIds.map(fetchFlightById);
        const loadedFlights = await Promise.all(flightPromises);
        setFlightsData(loadedFlights);

        const totalFlightPrice =
          loadedFlights.length > 0
            ? loadedFlights.reduce((sum, flight) => sum + (flight.price || 0), 0)
            : 0;

        // 기본 가격 설정 (객실 + 투어 + 항공)
        const base = totalRoomPrice + totalTourPrice + totalFlightPrice;
        setBasePrice(base);

        // 패키지 할인율 적용
        const pkgDiscountRate = pkg.discountRate || 0;
        setDiscountRate(pkgDiscountRate);
        const pkgDiscount = Math.floor((base * pkgDiscountRate) / 100);
        setPackageDiscount(pkgDiscount);

        // 최종 가격 계산
        setFinalPrice(base - pkgDiscount);
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
  // 쿠폰 선택 시 최종 가격 재계산
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setCouponDiscount(discount);
    const afterPkgDiscount = basePrice - packageDiscount;
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
  // 결제 처리
  const handlePayment = async () => {
    if (!packageData || !user) return;

    // 결제 금액은 최종 가격(finalPrice) 사용
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // 한국 시간
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, '');
    const merchant_uid = `package_${user.username}_${formattedDate}`;

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
              usedMileage,
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

  // ─────────────────────────────────────────────────────────
  // 로딩 중
  if (!packageData || !user) {
    return <Typography>상품 정보를 불러오는 중...</Typography>;
  }

  // ─────────────────────────────────────────────────────────
  // 렌더링: 상품 상세정보, 가격, 포함사항, 예약자 정보, 쿠폰, 마일리지, 결제하기
  return (
    <Container maxWidth="md" sx={{mt: 5}}>
      <Typography variant="h4" gutterBottom>
        예약하기
      </Typography>

      {/* 상품명 및 설명 */}
      <Typography variant="h5" sx={{mb: 2}}>
        {packageData.name}
      </Typography>
      <Typography variant="body1" sx={{mb: 3}}>
        {packageData.description}
      </Typography>

      {/* 이미지 목록 */}
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

      {/* 포함 사항 */}
      <Card sx={{mb: 3}}>
        <CardContent>
          <Typography variant="h6">포함 사항</Typography>
          <Divider sx={{my: 1}} />
          <Box sx={{mt: 2}}>
            {/* 숙소 */}
            <Typography variant="body1" sx={{mb: 1}}>
              <strong>숙소</strong> :{' '}
              {packageData.accommodations && packageData.accommodations.length > 0
                ? packageData.accommodations
                    .map(acc => {
                      const priceText = acc.minPrice
                        ? `${acc.minPrice.toLocaleString()}원`
                        : '가격 정보 없음';
                      const desc = acc.description || '설명 없음';
                      return `- ${acc.name} (${priceText})\n  ${desc}`;
                    })
                    .join('\n')
                : '없음'}
            </Typography>
            {/* 투어 */}
            <Typography variant="body1" sx={{mb: 1}}>
              <strong>투어</strong> :{' '}
              {packageData.tours && packageData.tours.length > 0
                ? packageData.tours
                    .map(t => {
                      const priceText = t.price
                        ? `${t.price.toLocaleString()}원`
                        : '가격 정보 없음';
                      const desc = t.description || '설명 없음';
                      return `- ${t.title} (${priceText})\n  ${desc}`;
                    })
                    .join('\n')
                : '없음'}
            </Typography>
            {/* 항공편 */}
            <Typography variant="body1" sx={{mb: 1}}>
              <strong>항공편</strong> :{' '}
              {flightsData && flightsData.length > 0
                ? flightsData
                    .map(f => {
                      const priceText = f.price
                        ? `${f.price.toLocaleString()}원`
                        : '가격 정보 없음';
                      const seats = f.seatsAvailable
                        ? `잔여좌석 ${f.seatsAvailable}석`
                        : '잔여좌석 정보 없음';
                      return `- ${f.flightNumber} / ${f.airline} / ${priceText} / ${seats}`;
                    })
                    .join('\n')
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

      {/* 쿠폰 선택 */}
      <Divider sx={{my: 2}} />
      <Typography variant="h6">쿠폰 사용</Typography>
      <CouponSelector
        userCoupons={userCoupons}
        itemPrice={basePrice}
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

      {/* 마일리지 사용 입력 */}
      <Divider sx={{my: 2}} />
      <Typography variant="h6" sx={{mb: 1}}>
        마일리지 사용
      </Typography>
      {/* MileageInput 컴포넌트는 사용자로부터 사용 마일리지를 입력받아 onMileageChange로 전달 */}
      <MileageInput
        userMileage={user.mileage}
        totalPrice={basePrice}
        discountAmount={packageDiscount + couponDiscount}
        onMileageChange={setUsedMileage}
      />

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
