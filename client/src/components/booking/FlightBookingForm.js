import React, {useEffect, useState} from 'react';
import {createBooking, verifyPayment} from '../../api/booking/bookingService';
import {authAPI} from '../../api/auth/index';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import MileageInput from '../mileage/MileageInput';
import CouponSelector from './CouponSelector';
import {Button, TextField, Alert, Snackbar} from '@mui/material';
import './styles/TourTicketBookingForm.css'; // 스타일링 (TourTicketBookingForm과 유사한 클래스 사용)
import FlightCard from '../../components/flights/FlightCard';
import FlightBookingCard from '../flights/FlightBookingCard';

const FlightBookingForm = ({selectedFlights, passengers, onBookingSuccess}) => {
  const [user, setUser] = useState(null);
  const [usedMileage, setUsedMileage] = useState(0);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  // 사용자 프로필 및 예약자 정보 로딩
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getUserProfile();
        setUser(userData);
        setReservationInfo({
          name: userData.username,
          email: userData.email,
          phone: userData.phone
        });
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      }
    };
    fetchUser();
  }, []);

  // 선택된 항공편의 총 예약 비용 계산 (승객 수 반영)
  const totalPrice =
    selectedFlights.reduce((sum, flight) => sum + flight.price, 0) * passengers;
  // 쿠폰 할인과 마일리지 차감을 반영한 최종 결제 금액
  const finalPrice = totalPrice - discountAmount - usedMileage;

  // 사용자 쿠폰 조회 (총 예약 금액 기준 사용 가능한 쿠폰 필터링)
  useEffect(() => {
    const fetchCoupons = async () => {
      if (user) {
        try {
          const coupons = await fetchUserCoupons(user._id);
          const validCoupons = coupons.filter(
            coupon => !coupon.isUsed && coupon.coupon.minPurchaseAmount <= totalPrice
          );
          setUserCoupons(validCoupons);
        } catch (error) {
          console.error('쿠폰 정보를 가져오는 중 오류 발생:', error);
        }
      }
    };
    fetchCoupons();
  }, [user, totalPrice]);

  // CouponSelector 에서 쿠폰 선택 시 호출되는 핸들러
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setDiscountAmount(discount);
  };

  // 예약자 정보 입력값 변경 핸들러
  const handleReservationChange = e => {
    const {name, value} = e.target;
    setReservationInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 결제 및 예약 진행 함수
  const handlePayment = async () => {
    // 한국 시간 기준 고유 결제 ID 생성 (YYMMDDHHMMSS)
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, '');
    const merchant_uid = `flight_${user.username}_${formattedDate}`;

    const bookingData = {
      types: selectedFlights.map(() => 'flight'),
      productIds: selectedFlights.map(flight => flight._id),
      counts: Array(selectedFlights.length).fill(passengers),
      totalPrice,
      discountAmount,
      usedMileage,
      userId: user._id,
      reservationInfo,
      merchant_uid,
      startDates: selectedFlights[0].departure.date,
      endDates: selectedFlights[selectedFlights.length - 1].arrival.date,
      couponId: selectedCoupon ? selectedCoupon._id : null
    };

    try {
      const bookingResponse = await createBooking(bookingData);
      console.log('예약 생성 성공:', bookingResponse);
    } catch (error) {
      alert('예약 요청 중 오류가 발생했습니다.');
      return;
    }

    // 아임포트 결제 요청
    const {IMP} = window;
    IMP.init('imp22685348');

    IMP.request_pay(
      {
        pg: 'html5_inicis.INIpayTest',
        pay_method: 'card',
        merchant_uid,
        name: '항공권 예약',
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
              userId: user._id,
              usedMileage,
              couponId: selectedCoupon ? selectedCoupon._id : null
            });
            if (verifyResponse.message === '결제 검증 성공') {
              setOpenAlert(true);
              setTimeout(() => {
                onBookingSuccess();
              }, 2000);
            } else {
              alert(`결제 검증 실패: ${verifyResponse.message}`);
            }
          } catch (error) {
            alert('결제 검증 중 오류가 발생했습니다.');
          }
        } else {
          alert(`결제 실패: ${rsp.error_msg}`);
        }
      }
    );
  };

  if (!user) return <p>사용자 정보를 불러오는 중...</p>;

  return (
    <>
      <div className="booking-container">
        <h2>예약하기</h2>
        <div className="booking-content">
          {/* 좌측: 예약 상세 정보 */}
          <div className="booking-details">
            <div className="ticket-info">
              <div className="ticket-header">
                {selectedFlights.map(flight => (
                  <FlightBookingCard key={flight._id} flight={flight} />
                ))}
              </div>
            </div>
            <p>👥 승객 수: {passengers}명</p>
            <p>💰 총 예약 비용: {totalPrice.toLocaleString()} 원</p>
            <br />
            <br />

            <hr className="divider" />

            {/* 마일리지 입력 섹션 */}
            <div className="point-section">
              <MileageInput
                userMileage={user.mileage}
                totalPrice={totalPrice}
                discountAmount={discountAmount}
                onMileageChange={setUsedMileage}
              />
            </div>
            <br />
            <br />

            <hr className="divider" />

            {/* 예약자 정보 입력 섹션 */}
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
                  style={{backgroundColor: 'rgb(213, 58, 35)'}}>
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

          {/* 우측: 결제 요약 및 결제 진행 */}
          <div className="payment-section">
            <div className="payment-summary">
              <h4>결제 정보</h4>
              <p>
                1인 기준
                <span>
                  {selectedFlights
                    .map(flight => flight.price)
                    .join(' + ')
                    .toLocaleString()}
                  원
                </span>
              </p>
              {/* <p>쿠폰 할인: {discountAmount.toLocaleString()} 원</p> */}
              <p>
                마일리지 <span>{usedMileage.toLocaleString()}원</span>
              </p>
              <div>
                <strong>총 결제 금액: {finalPrice.toLocaleString()} 원</strong>
              </div>
            </div>

            <div className="terms-section">
              <h4>약관 안내</h4>
              <p>
                개인정보 수집 및 이용 동의 (필수)
                <br />
                개인정보 제공 동의 (필수)
              </p>
              <p>위 약관을 확인하였으며, 본인은 약관 및 결제에 동의합니다.</p>
            </div>

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
              💳 {finalPrice.toLocaleString()} 원 결제하기
            </button>
          </div>
        </div>
      </div>

      <Snackbar
        open={openAlert}
        autoHideDuration={2000}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
        <Alert onClose={() => setOpenAlert(false)} severity="success" variant="filled">
          항공권 예약이 완료되었습니다.
        </Alert>
      </Snackbar>
    </>
  );
};

export default FlightBookingForm;
