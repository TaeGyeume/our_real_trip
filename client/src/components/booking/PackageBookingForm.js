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

// 서버 URL (이미지 경로)
const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000/'
    : 'https://ourrealtrip.shop/api';

export default function PackageBookingForm() {
  const {id} = useParams();
  const navigate = useNavigate();

  // 패키지 및 항공 데이터
  const [packageData, setPackageData] = useState(null);
  const [, setFlightsData] = useState([]); // 실제 항공편 문서들

  // 사용자 & 쿠폰
  const [user, setUser] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // 가격 상태
  const [basePrice, setBasePrice] = useState(0); // 숙소+투어+항공 합계
  const [discountRate, setDiscountRate] = useState(0); // 패키지 할인율
  const [packageDiscount, setPackageDiscount] = useState(0); // 패키지 할인액
  const [couponDiscount, setCouponDiscount] = useState(0); // 쿠폰 할인액
  const [finalPrice, setFinalPrice] = useState(0); // 최종 결제 금액
  const [usedMileage, setUsedMileage] = useState(0); // 마일리지 사용

  // 예약자 정보
  const [reservationInfo, setReservationInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // 알림/수정 상태
  const [openAlert, setOpenAlert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // (옵션) 방 예약 날짜 정보: { roomId: { start, end } }
  const [roomDates, setRoomDates] = useState({});

  /**
   * 1) 패키지/항공 데이터 로드 + 가격 계산
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) 특정 패키지 조회
        const pkg = await getPackageById(id);

        // 2) 전체 항공편 조회
        const allFlights = await fetchFlights();

        // 3) pkg.flights를 순회 → flightId를 실제 Flight 객체로 교체
        const validFlights =
          pkg.flights?.map(fObj => {
            let flightIdStr = '';
            if (typeof fObj.flightId === 'string') {
              flightIdStr = fObj.flightId;
            } else if (typeof fObj.flightId === 'object') {
              flightIdStr = fObj.flightId._id;
            }
            const foundDoc = allFlights.find(doc => doc._id === flightIdStr);
            return foundDoc ? {...fObj, flightId: {...foundDoc}} : fObj;
          }) || [];
        pkg.flights = validFlights;

        setPackageData(pkg);
        setFlightsData(validFlights);

        // 4) 숙소 체크인/체크아웃 날짜 파싱 (roomIds, startDates, endDates)
        if (
          pkg.roomIds &&
          pkg.startDates &&
          pkg.endDates &&
          pkg.roomIds.length === pkg.startDates.length &&
          pkg.roomIds.length === pkg.endDates.length
        ) {
          const rDates = {};
          pkg.roomIds.forEach((roomVal, idx) => {
            let rid =
              typeof roomVal === 'object' && roomVal.$oid
                ? roomVal.$oid
                : roomVal.toString();

            const startObj = pkg.startDates[idx];
            const endObj = pkg.endDates[idx];

            const startDateStr = parseDateValue(startObj);
            const endDateStr = parseDateValue(endObj);

            rDates[rid] = {
              start: startDateStr,
              end: endDateStr
            };
          });
          setRoomDates(rDates);
        }

        // 5) 가격 계산
        //   숙소(방) 가격(체크인~체크아웃 일수) + 투어 + 항공(좌석 수) + 패키지 할인
        const startDate = new Date(pkg.startDates?.[0]);
        const endDate = new Date(pkg.endDates?.[0]);
        const numberOfNights = Math.max((endDate - startDate) / (1000 * 60 * 60 * 24), 1);

        // (A) 숙소(방) 가격
        const totalRoomPrice =
          pkg.accommodations?.reduce((sum, acc) => {
            if (!acc.rooms) return sum;
            return (
              sum +
              acc.rooms.reduce((rSum, room) => {
                return rSum + (room.pricePerNight || 0) * numberOfNights;
              }, 0)
            );
          }, 0) || 0;

        // (B) 투어 가격
        const totalTourPrice =
          pkg.tours?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;

        // (C) 항공편 가격
        const totalFlightPrice =
          pkg.flights?.reduce((acc, fObj) => {
            if (!fObj.flightId) return acc;
            const seatsUsed = fObj.seatsToUse || 1;
            const flightPrice = fObj.flightId.price || 0;
            return acc + flightPrice * seatsUsed;
          }, 0) || 0;

        // basePrice
        const base = totalRoomPrice + totalTourPrice + totalFlightPrice;
        setBasePrice(base);

        // 패키지 할인
        const pDiscountRate = pkg.discountRate || 0;
        setDiscountRate(pDiscountRate);
        const pDiscountValue = Math.floor((base * pDiscountRate) / 100);
        setPackageDiscount(pDiscountValue);

        // (쿠폰 전) final
        setFinalPrice(base - pDiscountValue);

        // 디버그
        console.log('[DEBUG] totalRoomPrice:', totalRoomPrice);
        console.log('[DEBUG] totalTourPrice:', totalTourPrice);
        console.log('[DEBUG] totalFlightPrice:', totalFlightPrice);
        console.log('[DEBUG] basePrice:', base);
        console.log('[DEBUG] packageDiscount:', pDiscountValue);
      } catch (err) {
        console.error('패키지 로드 실패:', err);
      }
    };
    fetchData();
  }, [id]);

  // 날짜 파싱 함수
  const parseDateValue = val => {
    if (typeof val === 'string') {
      return new Date(val).toISOString().slice(0, 10);
    } else if (val && val.$date) {
      return new Date(val.$date).toISOString().slice(0, 10);
    }
    return '';
  };

  /**
   * 2) 사용자 + 쿠폰
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
      } catch (err) {
        console.error('사용자 정보 로드 실패:', err);
      }
    };
    loadUser();
  }, []);

  /**
   * 3) 쿠폰 선택
   */
  const handleCouponSelect = (coupon, discount) => {
    setSelectedCoupon(coupon);
    setCouponDiscount(discount);

    // 패키지 할인 후 → 쿠폰 할인
    const afterPkgDiscount = basePrice - packageDiscount;
    const newFinal = afterPkgDiscount - discount;
    setFinalPrice(newFinal < 0 ? 0 : newFinal);
  };

  /**
   * 4) 예약자 정보 수정
   */
  const handleReservationChange = e => {
    const {name, value} = e.target;
    setReservationInfo(prev => ({...prev, [name]: value}));
  };

  /**
   * 5) 결제 처리
   */
  const handlePayment = async () => {
    if (!packageData || !user) return;
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const merchant_uid = `package_${user.username}_${now
      .toISOString()
      .slice(2, 19)
      .replace(/[-T:]/g, '')}`;

    try {
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
    } catch (err) {
      alert('예약 요청 중 오류가 발생했습니다.');
      return;
    }

    // 아임포트 결제
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
                navigate('/main');
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

  if (!packageData || !user) {
    return <Typography>상품 정보를 불러오는 중...</Typography>;
  }

  // 첫 번째 이미지
  const thumbnail =
    packageData.images?.length > 0
      ? SERVER_URL + packageData.images[0]
      : '/default-image.jpg';

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

            {/* 패키지 상세 정보 */}
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

                      let airline = '항공사명 없음';
                      let flightNumber = '편명 없음';
                      let flightPrice = 0;
                      let seatsUsed = flightObj.seatsToUse || 1;

                      let departureCity = '';
                      let departureAirport = '';
                      let departureDate = '';
                      let departureTime = '';
                      let arrivalCity = '';
                      let arrivalAirport = '';
                      let arrivalDate = '';
                      let arrivalTime = '';

                      if (typeof flightObj.flightId === 'object') {
                        airline = flightObj.flightId.airline || airline;
                        flightNumber = flightObj.flightId.flightNumber || flightNumber;
                        flightPrice = flightObj.flightId.price || 0;

                        if (flightObj.flightId.departure) {
                          departureCity = flightObj.flightId.departure.city || '';
                          departureAirport = flightObj.flightId.departure.airport || '';
                          departureDate = flightObj.flightId.departure.date || '';
                          departureTime = flightObj.flightId.departure.time || '';
                        }
                        if (flightObj.flightId.arrival) {
                          arrivalCity = flightObj.flightId.arrival.city || '';
                          arrivalAirport = flightObj.flightId.arrival.airport || '';
                          arrivalDate = flightObj.flightId.arrival.date || '';
                          arrivalTime = flightObj.flightId.arrival.time || '';
                        }
                      }

                      const totalFlightCost = flightPrice * seatsUsed;

                      return (
                        <li key={idx}>
                          <div>
                            {airline} / {flightNumber} / {seatsUsed}석 /{' '}
                            {totalFlightCost.toLocaleString()}원
                          </div>
                          {/* 출발 정보 */}
                          {departureCity && (
                            <div style={{fontSize: '0.9em', color: '#555'}}>
                              출발: {departureCity}/{departureAirport} ({departureDate}{' '}
                              {departureTime})
                            </div>
                          )}
                          {/* 도착 정보 */}
                          {arrivalCity && (
                            <div style={{fontSize: '0.9em', color: '#555'}}>
                              도착: {arrivalCity}/{arrivalAirport} ({arrivalDate}{' '}
                              {arrivalTime})
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 숙소 정보 (체크인~체크아웃 기간) */}
              {packageData.accommodations?.length > 0 && (
                <div style={{marginTop: '10px'}}>
                  <strong>숙소 정보</strong>
                  <ul style={{marginTop: '5px'}}>
                    {packageData.accommodations.map(acc => (
                      <li key={acc._id}>
                        <strong>{acc.name}</strong>
                        {acc.rooms && acc.rooms.length > 0 ? (
                          <ul style={{marginLeft: '20px', marginTop: '5px'}}>
                            {acc.rooms.map((room, rIdx) => {
                              const roomDisplayName = room.name || '객실 이름 없음';
                              const priceText = room.pricePerNight
                                ? `${room.pricePerNight.toLocaleString()}원/1박`
                                : '가격 정보 없음';

                              // roomDates에서 체크인/체크아웃
                              const roomIdKey = room._id.toString();
                              let checkIn = '';
                              let checkOut = '';
                              if (roomDates[roomIdKey]) {
                                checkIn = roomDates[roomIdKey].start;
                                checkOut = roomDates[roomIdKey].end;
                              }

                              return (
                                <li key={rIdx}>
                                  - {roomDisplayName}: {priceText}{' '}
                                  {checkIn && checkOut ? (
                                    <span style={{marginLeft: '8px', color: 'blue'}}>
                                      (예약 날짜: {checkIn} ~ {checkOut})
                                    </span>
                                  ) : (
                                    <span style={{marginLeft: '8px', color: 'gray'}}>
                                      (예약 날짜: 없음)
                                    </span>
                                  )}
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
              {packageDiscount + couponDiscount + usedMileage > 0 && (
                <p>
                  총 할인:{' '}
                  <span style={{color: 'red'}}>
                    -{(packageDiscount + couponDiscount + usedMileage).toLocaleString()}원
                  </span>
                </p>
              )}
              <strong>
                총 결제 금액: {Math.max(finalPrice - usedMileage, 0).toLocaleString()}원
              </strong>
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
              {Math.max(finalPrice - usedMileage, 0).toLocaleString()}원 결제하기
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
}
