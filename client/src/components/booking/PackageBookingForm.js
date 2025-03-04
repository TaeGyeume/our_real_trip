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

import './styles/TourTicketBookingForm.css';
import {Typography, TextField, Snackbar, Alert, Button} from '@mui/material';

// 서버 URL
const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PackageBookingForm = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  // 패키지 및 항공 데이터
  const [packageData, setPackageData] = useState(null);
  const [flightsData, setFlightsData] = useState([]);

  // 사용자 & 쿠폰
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // 가격 상태
  const [basePrice, setBasePrice] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [packageDiscount, setPackageDiscount] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [usedMileage, setUsedMileage] = useState(0);

  // 예약자 정보
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // UI 상태
  const [openAlert, setOpenAlert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * 패키지 데이터 로드
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) 특정 패키지 조회
        const pkg = await getPackageById(id);
        setPackageData(pkg);

        // 2) 항공편 상세(전체 항공 중에서 pkg.flights[].flightId) 불러오기
        const flightIds = pkg.flights ? pkg.flights.map(f => f.flightId) : [];
        const loadedFlightDocs = await Promise.all(
          flightIds.map(async fid => {
            const all = await fetchFlights();
            return all.find(one => one._id === fid) || null;
          })
        );
        const validFlights = loadedFlightDocs.filter(f => f !== null);
        setFlightsData(validFlights);

        // 3) 객실(Room) 총합
        const totalRoomPrice =
          pkg.accommodations?.length > 0
            ? pkg.accommodations.reduce((sum, acc) => {
                if (!acc.rooms) return sum;
                const rsum = acc.rooms.reduce((roomSum, room) => {
                  return roomSum + (room.pricePerNight || 0);
                }, 0);
                return sum + rsum;
              }, 0)
            : 0;

        // 4) 투어/티켓 총합
        const totalTourPrice =
          pkg.tours?.length > 0
            ? pkg.tours.reduce((sum, t) => sum + (t.price || 0), 0)
            : 0;

        // 5) 항공편 총합
        const totalFlightPrice = validFlights.reduce((acc, f) => acc + (f.price || 0), 0);

        // 6) basePrice
        const base = totalRoomPrice + totalTourPrice + totalFlightPrice;
        setBasePrice(base);

        // 7) 패키지 자체 할인
        const pDiscountRate = pkg.discountRate || 0;
        setDiscountRate(pDiscountRate);
        const pDiscountValue = Math.floor((base * pDiscountRate) / 100);
        setPackageDiscount(pDiscountValue);

        // 8) (쿠폰 전) 최종 금액
        setFinalPrice(base - pDiscountValue);
      } catch (error) {
        console.error('패키지 예약 데이터 로드 오류:', error);
      }
    };
    fetchData();
  }, [id]);

  /**
   * 사용자 정보 + 쿠폰 목록
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authAPI.getUserProfile();
        setUser(userData);

        // 예약자 기본 정보
        setReservationInfo({
          name: userData.username,
          email: userData.email,
          phone: userData.phone
        });

        // 쿠폰 목록
        const coupons = await fetchUserCoupons(userData._id);
        setUserCoupons(coupons);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };
    loadUser();
  }, []);

  /**
   * 쿠폰 선택
   */
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setCouponDiscount(discount);

    const afterPkgDiscount = basePrice - packageDiscount;
    const newFinal = afterPkgDiscount - discount;
    setFinalPrice(newFinal < 0 ? 0 : newFinal);
  };

  /**
   * 예약자 정보 수정
   */
  const handleReservationChange = e => {
    const {name, value} = e.target;
    setReservationInfo(prev => ({...prev, [name]: value}));
  };

  /**
   * 결제 처리
   */
  const handlePayment = async () => {
    if (!packageData || !user) return;

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const merchant_uid = `package_${user.username}_${now
      .toISOString()
      .slice(2, 19)
      .replace(/[-T:]/g, '')}`;

    try {
      // 1) 예약 생성
      const bookingRes = await createBooking({
        types: ['package'],
        productIds: [packageData._id],
        counts: [1],
        merchant_uid,
        totalPrice: basePrice,
        discountAmount: packageDiscount + couponDiscount,
        finalPrice,
        usedMileage,
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

    // 2) 아임포트 결제
    const payAmount = Math.max(finalPrice - usedMileage, 0);
    const {IMP} = window;
    IMP.init('imp22685348');
    IMP.request_pay(
      {
        pg: 'html5_inicis.INIpayTest',
        pay_method: 'card',
        merchant_uid,
        name: packageData.name,
        amount: payAmount,
        buyer_email: user.email,
        buyer_name: user.username,
        buyer_tel: user.phone
      },
      async rsp => {
        if (rsp.success) {
          try {
            // 결제 검증
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
          } catch (err) {
            alert('결제 검증 중 오류 발생했습니다.');
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

  // 썸네일
  const thumbnail =
    packageData.images?.length > 0
      ? SERVER_URL + packageData.images[0]
      : '/default-image.jpg';

  // 최종 결제 금액
  const payAmount = Math.max(finalPrice - usedMileage, 0);
  // 총 할인
  const totalDiscount = packageDiscount + couponDiscount + usedMileage;

  return (
    <>
      <div className="booking-container">
        <h2>예약하기</h2>
        <div className="booking-content">
          {/* 왼쪽 영역 */}
          <div className="booking-details">
            <div className="ticket-info">
              <div className="ticket-header">
                <img src={thumbnail} alt="패키지 썸네일" className="ticket-thumbnail" />
                <div className="ticket-text">{packageData.name}</div>
              </div>
            </div>

            <hr className="divider" />
            <div className="package-info">
              <h4>패키지 포함</h4>

              {/* 포함/불포함 */}
              {packageData.includedItems?.length > 0 && (
                <p>
                  <strong>포함사항: </strong>
                  {packageData.includedItems.join(', ')}
                </p>
              )}
              {packageData.excludedItems?.length > 0 && (
                <p>
                  <strong>불포함: </strong>
                  {packageData.excludedItems.join(', ')}
                </p>
              )}

              {/* 항공 정보 */}
              {packageData.flights?.length > 0 && (
                <div style={{marginTop: '10px'}}>
                  <strong>항공편 정보</strong>
                  <ul style={{marginTop: '5px'}}>
                    {packageData.flights.map((flightObj, idx) => {
                      if (!flightObj.flightId) return null;

                      const flight = flightObj.flightId;
                      const airline = flight.airline || '항공사명 없음';
                      const flightNumber = flight.flightNumber || '편명 없음';
                      const priceText = flight.price
                        ? flight.price.toLocaleString() + '원'
                        : '가격 정보 없음';

                      return (
                        <li key={idx}>
                          {airline} / {flightNumber} / {priceText}
                          {flightObj.seatsToUse
                            ? ` / 사용 좌석: ${flightObj.seatsToUse}석`
                            : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 숙소 정보 */}
              {packageData.accommodations?.length > 0 && (
                <div style={{marginTop: '10px'}}>
                  <strong>숙소 정보</strong>
                  <ul style={{marginTop: '5px'}}>
                    {packageData.accommodations.map(acc => (
                      <li key={acc._id}>
                        <strong>{acc.name}</strong>
                        {acc.rooms && acc.rooms.length > 0 ? (
                          <ul
                            style={{
                              marginLeft: '20px',
                              marginTop: '5px'
                            }}>
                            {acc.rooms.map((room, rIdx) => {
                              // ★ 변경점: room.name 우선 표시
                              const roomDisplayName = room.name || '객실 이름 없음';
                              const priceText = room.pricePerNight
                                ? `${room.pricePerNight.toLocaleString()}원/1박`
                                : '가격 정보 없음';
                              return (
                                <li key={rIdx}>
                                  - {roomDisplayName}: {priceText}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p style={{marginLeft: '20px'}}>객실 정보 없음</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 투어 정보 */}
              {packageData.tours?.length > 0 && (
                <div style={{marginTop: '10px'}}>
                  <strong>투어 정보</strong>
                  <ul style={{marginTop: '5px'}}>
                    {packageData.tours.map((tour, idx) => {
                      const titleText = tour.title || '투어 제목 없음';
                      const tourPrice = tour.price
                        ? `${tour.price.toLocaleString()}원`
                        : '가격 정보 없음';
                      return (
                        <li key={idx}>
                          {titleText} ({tourPrice})
                        </li>
                      );
                    })}
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
                내 프로필 &gt; 쿠폰 메뉴에서 쿠폰 상태를 확인해 주세요. <br />
                선착순 쿠폰은 소진 완료되면 더 이상 노출되지 않아요!
              </p>
            </div>

            <hr className="divider" />
            {/* 마일리지 사용 */}
            <div className="point-section">
              <MileageInput
                userMileage={user.mileage}
                totalPrice={basePrice}
                discountAmount={packageDiscount + couponDiscount}
                onMileageChange={setUsedMileage}
              />
            </div>

            <hr className="divider" />
            {/* 예약자 정보 */}
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

          {/* 오른쪽 결제 영역 */}
          <div className="payment-section">
            <div className="payment-summary">
              <h4>결제 정보</h4>
              <p>기본 금액: {basePrice.toLocaleString()}원</p>
              {packageDiscount > 0 && (
                <p>
                  패키지 할인
                  {discountRate > 0 && ` (${discountRate}%)`}: -
                  {packageDiscount.toLocaleString()}원
                </p>
              )}
              {couponDiscount > 0 && (
                <p>쿠폰 할인: -{couponDiscount.toLocaleString()}원</p>
              )}
              {usedMileage > 0 && <p>마일리지 사용: -{usedMileage.toLocaleString()}원</p>}

              {/* 총 할인 */}
              {totalDiscount > 0 && (
                <p>
                  총 할인:{' '}
                  <span style={{color: 'red'}}>-{totalDiscount.toLocaleString()}원</span>
                </p>
              )}
              <strong>총 결제 금액: {payAmount.toLocaleString()}원</strong>
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
