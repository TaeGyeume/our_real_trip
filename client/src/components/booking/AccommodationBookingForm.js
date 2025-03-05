import React, {useEffect, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {getRoomById} from '../../api/room/roomService';
import {createBooking, verifyPayment} from '../../api/booking/bookingService';
import {authAPI} from '../../api/auth/index';
import {fetchUserCoupons} from '../../api/coupon/couponService';
import {cancelBooking} from '../../api/booking/bookingService';
import CouponSelector from './CouponSelector';
import MileageInput from '../mileage/MileageInput';
import './styles/TourTicketBookingForm.css';
import {Alert, Snackbar, Button, TextField, Typography, Stack} from '@mui/material';

const BookingForm = () => {
  const navigate = useNavigate();
  const {roomId} = useParams();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [usedMileage, setUsedMileage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  const defaultStartDate = searchParams.get('startDate') || '';
  const defaultEndDate = searchParams.get('endDate') || '';

  const formData = {
    rooms: [{startDate: defaultStartDate, endDate: defaultEndDate, count: 1}]
  };

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
        setReservationInfo({
          name: userData.username,
          email: userData.email,
          phone: userData.phone
        });
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

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  // room이 null이면 빈 배열을 반환하여 안전하게 처리
  let imageUrl = room?.images?.[0] || '/default-image.jpg';

  if (!imageError && imageUrl?.startsWith('/uploads/')) {
    imageUrl = `${SERVER_URL}${imageUrl}`;
  }

  if (!room || !user) {
    return <p>객실 정보를 불러오는 중...</p>;
  }

  // 입력값 변경 핸들러 (객실 개별 데이터 변경)
  // const handleRoomChange = (index, key, value) => {
  //   const updatedRooms = [...formData.rooms];
  //   updatedRooms[index][key] = value;
  //   setFormData({...formData, rooms: updatedRooms});
  // };

  // 쿠폰 선택 핸들러
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setDiscountAmount(discount);
  };

  const handleReservationChange = e => {
    const {name, value} = e.target;
    setReservationInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const totalPrice = formData.rooms.reduce((sum, roomData) => {
    const nights = Math.ceil(
      (new Date(roomData.endDate) - new Date(roomData.startDate)) / (1000 * 60 * 60 * 24)
    );
    return sum + nights * room.pricePerNight * roomData.count;
  }, 0);

  /* 예약 생성 및 결제 요청 */
  const handlePayment = async () => {
    if (formData.rooms.some(room => !room.startDate || !room.endDate)) {
      alert('모든 객실의 체크인 및 체크아웃 날짜를 선택하세요.');
      return;
    }

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // 한국 시간
    const formattedDate = now.toISOString().slice(2, 19).replace(/[-T:]/g, ''); // YYMMDDHHMMSS
    const merchant_uid = `${user.username}_${formattedDate}`;

    const startDates = formData.rooms.map(room => room.startDate);
    const endDates = formData.rooms.map(room => room.endDate);
    const counts = formData.rooms.map(room => room.count);

    const finalPrice = totalPrice - discountAmount - usedMileage;

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
        usedMileage,
        userId: user._id,
        couponId: selectedCoupon ? selectedCoupon._id : null,
        reservationInfo
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
                usedMileage,
                userId: user._id
              });

              if (verifyResponse.message === '결제 검증 성공') {
                setOpenAlert(true);

                setTimeout(() => {
                  navigate('/');
                }, 2000);
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
    <>
      <div className="booking-container">
        <h2>예약하기</h2>
        <div className="booking-content">
          <div className="booking-details">
            <div className="ticket-info">
              <Stack direction="row" alignItems="center" spacing={2}>
                {/* 객실 이미지 */}
                <img
                  src={imageUrl}
                  alt="객실 이미지"
                  onError={e => {
                    if (!imageError) {
                      setImageError(true);
                      e.target.src = '/default-image.jpg';
                    }
                  }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    objectFit: 'cover'
                  }}
                />

                {/* 객실 정보 */}
                <Stack spacing={0.5}>
                  <Typography variant="h6" fontWeight="bold">
                    {room.name}
                  </Typography>
                </Stack>
              </Stack>

              {/* 체크인 / 체크아웃 정보 */}
              <Stack direction="row" justifyContent="space-between" sx={{mt: 2}}>
                <Typography variant="body1" fontWeight="bold">
                  체크인
                </Typography>
                <Typography variant="body1">
                  {new Date(defaultStartDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    weekday: 'short'
                  })}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight="bold">
                  체크아웃
                </Typography>
                <Typography variant="body1">
                  {new Date(defaultEndDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    weekday: 'short'
                  })}
                </Typography>
              </Stack>
            </div>

            <hr className="divider" />
            <div className="coupon-section">
              <h4>쿠폰 사용</h4>
              <CouponSelector
                userCoupons={userCoupons}
                itemPrice={room.pricePerNight}
                count={formData.rooms[0].count}
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
              <MileageInput
                userMileage={user.mileage}
                totalPrice={totalPrice}
                discountAmount={discountAmount}
                onMileageChange={setUsedMileage}
              />
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
                1박 기준 <span>{room.pricePerNight.toLocaleString()}원</span>
              </p>
              <p>
                쿠폰 <span>{discountAmount.toLocaleString()}원</span>
              </p>
              <p>
                마일리지 <span>{usedMileage.toLocaleString()}원</span>
              </p>
              <div>
                <strong>
                  총 결제 금액:{' '}
                  {Math.max(
                    totalPrice - discountAmount - usedMileage,
                    0
                  ).toLocaleString()}
                  원
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
              {(
                room.pricePerNight * formData.rooms[0].count -
                discountAmount -
                usedMileage
              ).toLocaleString()}
              원 결제하기
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
          숙박 예약이 완료되었습니다.
        </Alert>
      </Snackbar>
    </>
  );
};

export default BookingForm;
