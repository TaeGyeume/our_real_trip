import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  createBooking,
  verifyPayment,
  cancelBooking
} from '../../api/booking/bookingService';
import {getPackageById} from '../../api/package/packageService';
import {fetchFlights} from '../../api/flight/flights';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import {authAPI} from '../../api/auth/index';

import CouponSelector from './CouponSelector';
import MileageInput from '../mileage/MileageInput';

import './styles/TourTicketBookingForm.css'; // TourTicketBookingForm의 CSS 재사용
import {Typography, TextField, Snackbar, Alert, Button} from '@mui/material';

const PackageBookingForm = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  // ───────── 패키지 & 항공 정보 ─────────
  const [packageData, setPackageData] = useState(null);
  const [flightsData, setFlightsData] = useState([]);

  // ───────── 유저 & 쿠폰 & 예약 정보 ─────────
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // ───────── 가격 상태 ─────────
  const [basePrice, setBasePrice] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [packageDiscount, setPackageDiscount] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [usedMileage, setUsedMileage] = useState(0);

  // ───────── UI 상태 ─────────
  const [openAlert, setOpenAlert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ─────────────────────────────────────────────────────────
  // 1) 패키지 데이터 불러오기 + 가격 계산
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 패키지 정보
        const pkg = await getPackageById(id);
        setPackageData(pkg);

        // 항공편 정보 로드
        const flightIds = pkg.flights ? pkg.flights.map(f => f.flightId) : [];
        const flightPromises = flightIds.map(fetchFlightById);
        const loadedFlights = await Promise.all(flightPromises);
        const validFlights = loadedFlights.filter(f => f != null);
        setFlightsData(validFlights);

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
        const totalFlightPrice = validFlights.reduce((sum, f) => sum + (f.price || 0), 0);

        // 기본 가격(객실+투어+항공)
        const base = totalRoomPrice + totalTourPrice + totalFlightPrice;
        setBasePrice(base);

        // 패키지 자체 할인
        const pkgDiscountRate = pkg.discountRate || 0;
        setDiscountRate(pkgDiscountRate);

        const pkgDiscountValue = Math.floor((base * pkgDiscountRate) / 100);
        setPackageDiscount(pkgDiscountValue);

        // 쿠폰 할인 적용 전의 최종 금액
        setFinalPrice(base - pkgDiscountValue);
      } catch (error) {
        console.error('패키지 예약 데이터 로드 중 오류:', error);
      }
    };

    // 항공편 하나 불러오기
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
  // 2) 사용자 정보 + 쿠폰 목록
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getUserProfile();
        setUser(userData);

        // 예약자 기본 정보
        setReservationInfo({
          name: userData.username,
          email: userData.email,
          phone: userData.phone
        });

        // 사용자 쿠폰
        const coupons = await fetchUserCoupons(userData._id);
        setUserCoupons(coupons);
      } catch (error) {
        console.error('사용자 정보 로드 중 오류:', error);
      }
    };
    fetchUser();
  }, []);

  // ─────────────────────────────────────────────────────────
  // 3) 쿠폰 선택 시 할인액 반영
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setCouponDiscount(discount);
    const afterPkgDiscount = basePrice - packageDiscount;
    const newFinal = afterPkgDiscount - discount;
    setFinalPrice(newFinal < 0 ? 0 : newFinal);
  };

  // ─────────────────────────────────────────────────────────
  // 4) 예약자 정보 변경
  const handleReservationChange = e => {
    const {name, value} = e.target;
    setReservationInfo(prev => ({...prev, [name]: value}));
  };

  // ─────────────────────────────────────────────────────────
  // 5) 결제 처리
  const handlePayment = async () => {
    if (!packageData || !user) return;

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, '');
    const merchant_uid = `package_${user.username}_${formattedDate}`;

    try {
      // 예약 생성
      const bookingRes = await createBooking({
        types: ['package'],
        productIds: [packageData._id],
        counts: [1],
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
        amount: finalPrice - usedMileage < 0 ? 0 : finalPrice - usedMileage,
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

  // 로딩 중 처리
  if (!packageData || !user) {
    return <Typography>상품 정보를 불러오는 중...</Typography>;
  }

  // ─────────────────────────────────────────────────────────
  // UI: TourTicketBookingForm 스타일을 이용
  const payAmount = finalPrice - usedMileage < 0 ? 0 : finalPrice - usedMileage;

  return (
    <>
      <div className="booking-container">
        <h2>예약하기</h2>
        <div className="booking-content">
          {/* 왼쪽 영역 */}
          <div className="booking-details">
            <div className="ticket-info">
              <div className="ticket-header">
                {packageData.images && packageData.images.length > 0 && (
                  <img
                    src={`http://localhost:5000${packageData.images[0]}`}
                    alt="패키지 썸네일"
                    className="ticket-thumbnail"
                  />
                )}
                <div className="ticket-text">{packageData.name}</div>
              </div>
            </div>

            {/* ★ 패키지에 포함된 항공/숙소/투어 등을 간단히 표시하고 싶다면 아래처럼 추가 ★ */}
            <hr className="divider" />
            <div className="package-info">
              <h4>패키지 요약 정보</h4>

              {/* 포함 사항 */}
              {packageData.includedItems && packageData.includedItems.length > 0 && (
                <p>
                  <strong>포함사항: </strong>
                  {packageData.includedItems.join(', ')}
                </p>
              )}
              {/* 불포함 사항 */}
              {packageData.excludedItems && packageData.excludedItems.length > 0 && (
                <p>
                  <strong>불포함: </strong>
                  {packageData.excludedItems.join(', ')}
                </p>
              )}
              {/* 항공 정보 */}
              {packageData.flights && packageData.flights.length > 0 && (
                <div>
                  <strong>항공편 정보</strong>
                  <ul style={{marginTop: '5px'}}>
                    {packageData.flights.map((fObj, i) => {
                      if (!fObj.flightId) return null;
                      return (
                        <li key={i}>
                          {fObj.flightId.airline} / {fObj.flightId.flightNumber} /{' '}
                          {fObj.flightId.price?.toLocaleString()}원
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {/* 숙소 정보 */}
              {packageData.accommodations && packageData.accommodations.length > 0 && (
                <div>
                  <strong>숙소 정보</strong>
                  <ul style={{marginTop: '5px'}}>
                    {packageData.accommodations.map(acc => (
                      <li key={acc._id}>
                        {acc.name} (
                        {acc.rooms && acc.rooms.length
                          ? acc.rooms
                              .map(room => `${room.pricePerNight?.toLocaleString()}원/박`)
                              .join(', ')
                          : '객실 정보 없음'}
                        )
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* 투어 정보 */}
              {packageData.tours && packageData.tours.length > 0 && (
                <div>
                  <strong>투어 정보</strong>
                  <ul style={{marginTop: '5px'}}>
                    {packageData.tours.map((tour, idx) => (
                      <li key={idx}>
                        {tour.title} ({tour.price?.toLocaleString()}원)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <hr className="divider" />

            {/* 쿠폰 선택 */}
            <div className="coupon-section">
              <h4>쿠폰 사용</h4>
              <CouponSelector
                userCoupons={userCoupons}
                itemPrice={basePrice}
                count={1}
                onCouponSelect={handleCouponSelect}
              />
              <br />
              <p className="coupon-info">
                사용 가능한 쿠폰이 보이지 않나요? <br />
                내 프로필 &gt; 쿠폰 메뉴에서 쿠폰 상태를 확인해 주세요.
                <br />
                선착순 쿠폰은 소진 완료되면 더 이상 노출되지 않아요!
              </p>
            </div>

            {/* 마일리지 사용 */}
            <hr className="divider" />
            <div className="point-section">
              <MileageInput
                userMileage={user.mileage}
                totalPrice={basePrice}
                discountAmount={couponDiscount + packageDiscount}
                onMileageChange={setUsedMileage}
              />
            </div>

            {/* 예약자 정보 */}
            <hr className="divider" />
            <div className="user-info">
              <h4>예약자 정보</h4>
              <TextField
                label="이름"
                variant="outlined"
                name="name"
                value={reservationInfo.name}
                onChange={handleReservationChange}
                disabled={!isEditing}
                fullWidth
                margin="normal"
              />

              <TextField
                label="이메일"
                variant="outlined"
                name="email"
                value={reservationInfo.email}
                onChange={handleReservationChange}
                disabled={!isEditing}
                fullWidth
                margin="normal"
              />

              <TextField
                label="전화번호"
                variant="outlined"
                name="phone"
                value={reservationInfo.phone}
                onChange={handleReservationChange}
                disabled={!isEditing}
                fullWidth
                margin="normal"
              />

              {!isEditing ? (
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  style={{backgroundColor: 'rgb(213, 58, 35)', marginRight: '10px'}}>
                  수정
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(false)}
                  style={{backgroundColor: 'rgb(28, 103, 189)'}}>
                  저장
                </Button>
              )}
            </div>
          </div>

          {/* 오른쪽 영역: 결제 요약 + 결제하기 */}
          <div className="payment-section">
            <div className="payment-summary">
              <h4>결제 정보</h4>
              <p>
                기본 금액 <span>{basePrice.toLocaleString()}원</span>
              </p>
              <p>
                쿠폰 <span>{couponDiscount.toLocaleString()}원</span>
              </p>
              <p>
                마일리지 <span>{usedMileage.toLocaleString()}원</span>
              </p>
              <div>
                <strong>총 결제 금액: {payAmount.toLocaleString()}원</strong>
              </div>
            </div>

            {/* 약관 안내 */}
            <div className="terms-section">
              <h4>약관 안내</h4>
              <p>
                개인정보 수집 및 이용 동의 (필수)
                <br />
                개인정보 제공 동의 (필수)
              </p>
              <p>위 약관을 확인하였으며, 본인은 약관 및 결제에 동의합니다.</p>
            </div>

            {/* 예약 취소 규정 */}
            <div className="cancel-policy">
              <h5>예약 취소 규정</h5>
              <ul>
                <li>부분환불 가능</li>
                <li>유효기간 내 미사용 티켓 100% 환불 가능</li>
                <li>유효기간 후 미사용 티켓 100% 환불 가능</li>
                <li>사용한 티켓은 환불 불가능합니다.</li>
              </ul>
            </div>

            <button onClick={handlePayment} className="payment-btn">
              {payAmount.toLocaleString()}원 결제하기
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
};

export default PackageBookingForm;
