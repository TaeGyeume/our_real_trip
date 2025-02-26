import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getTourTicketById} from '../../api/tourTicket/tourTicketService';
import {createBooking, verifyPayment} from '../../api/booking/bookingService';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import {cancelBooking} from '../../api/booking/bookingService';
import {authAPI} from '../../api/auth/index';
import CouponSelector from './CouponSelector';
import QuantitySelector from './QuantitySelector';
import './styles/TourTicketBookingForm.css';
import {Alert, Snackbar, Button, TextField} from '@mui/material';

const TourTicketBookingForm = () => {
  const {id} = useParams();
  const [ticket, setTicket] = useState(null);
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [formData, setFormData] = useState({count: 0});
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

        // 초기 예약자 정보 설정
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
    const totalPrice = ticket.price * formData.count;
    const finalPrice = totalPrice - discountAmount;

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // 한국 시간
    const formattedDate = now
      .toISOString()
      .slice(2, 19) // YYMMDDTHHMMSS
      .replace(/[-T:]/g, ''); // YYMMDDHHMMSS

    const merchant_uid = `${user.username}_${formattedDate}`;

    try {
      const bookingResponse = await createBooking({
        types: ['tourTicket'],
        productIds: [ticket._id],
        counts: [formData.count],
        merchant_uid,
        totalPrice,
        discountAmount,
        finalPrice, // 최종 결제 금액 (할인 후) 추가
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
        merchant_uid: merchant_uid,
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
                navigate('/');
              }, 2000);
            } else {
              alert(` 결제 검증 실패: ${verifyResponse.message}`);
            }
          } catch (error) {
            alert(' 결제 검증 중 오류가 발생했습니다.');
          }
        } else {
          alert(` 결제 실패: ${rsp.error_msg}`);

          if (selectedCoupon) {
            console.log('[클라이언트] 결제 취소, 예약 취소 요청 보냄:', merchant_uid);
            await cancelBooking(merchant_uid);
          }
        }
      }
    );
  };

  if (!ticket || !user) {
    return <p> 상품 정보를 불러오는 중...</p>;
  }

  return (
    <>
      <div className="booking-container">
        <h2>예약하기</h2>
        <div className="booking-content">
          <div className="booking-details">
            <div className="ticket-info">
              <div className="ticket-header">
                {ticket.images && ticket.images.length > 0 && (
                  <img
                    src={`http://localhost:5000${ticket.images[0]}`}
                    alt="투어 티켓 썸네일"
                    className="ticket-thumbnail"
                  />
                )}

                <div className="ticket-text">{ticket.title}</div>
              </div>
            </div>

            {/* <p>가격: {ticket.price.toLocaleString()} 원</p> */}

            <QuantitySelector count={formData.count} setCount={handleQuantityChange} />

            <hr className="divider" />
            <div className="coupon-section">
              <h4>쿠폰 사용</h4>
              <CouponSelector
                userCoupons={userCoupons}
                itemPrice={ticket.price}
                count={formData.count}
                onCouponSelect={handleCouponSelect}
              />
              <br />
              <p>
                사용 가능한 쿠폰이 보이지 않나요?
                <br />내 프로필 &gt; 쿠폰 메뉴에서 쿠폰 상태를 확인해 주세요. 선착순
                쿠폰은 소진 완료되면 더 이상 노출되지 않아요!
              </p>
              <br />
              <br />
            </div>
            <hr className="divider" />
            <div className="point-section">
              <h4>마일리지 사용</h4>
              <p>내 포인트: 0원</p>
              <br />
              <br />
            </div>
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

          {/* 오른쪽: 결제 요약 및 버튼 */}
          <div className="payment-section">
            <div className="payment-summary">
              <h4>결제 정보</h4>
              <p>
                1인 기준 <span>{ticket.price.toLocaleString()}원</span>
              </p>
              <p>
                쿠폰 <span>{discountAmount.toLocaleString()}원</span>
              </p>
              <p>
                마일리지 <span>{discountAmount.toLocaleString()}원</span>
              </p>
              <div>
                <strong>
                  총 결제 금액:{' '}
                  {(ticket.price * formData.count - discountAmount).toLocaleString()}원
                </strong>
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
              {(ticket.price * formData.count - discountAmount).toLocaleString()}원
              결제하기
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
          투어 티켓 예약이 완료되었습니다.
        </Alert>
      </Snackbar>
    </>
  );
};

export default TourTicketBookingForm;
