import axios from '../axios';

const BASE_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000/booking'
    : 'https://ourrealtrip.shop/api/booking';

export const createBooking = async bookingData => {
  try {
    const response = await axios.post(`${BASE_URL}/create`, {
      types: bookingData.types,
      productIds: bookingData.productIds,
      roomIds: bookingData.roomIds,
      counts: bookingData.counts,
      startDates: bookingData.startDates,
      endDates: bookingData.endDates,
      totalPrice: bookingData.totalPrice, // 총 가격
      discountAmount: bookingData.discountAmount || 0, // 할인 금액 (없으면 0)
      finalPrice:
        bookingData.finalPrice ||
        bookingData.totalPrice - (bookingData.discountAmount || 0), // 최종 결제 금액
      usedMileage: bookingData.usedMileage || 0, // 사용한 마일리지 추가
      userId: bookingData.userId,
      couponId: bookingData.couponId || null, // 쿠폰 ID (선택 사항)
      reservationInfo: bookingData.reservationInfo,
      merchant_uid: bookingData.merchant_uid
    });

    return response.data;
  } catch (error) {
    console.error('예약 생성 실패:', error.response?.data || error);
    throw error;
  }
};

export const cancelBooking = async bookingIds => {
  try {
    const response = await axios.post(`${BASE_URL}/cancel/:bookingId`, {bookingIds}); // 배열 기반 취소
    return response.data;
  } catch (error) {
    console.error('예약 취소 중 오류:', error.response?.data || error);
    return {status: 500, message: '예약 취소 중 오류 발생'};
  }
};

export const verifyPayment = async paymentData => {
  try {
    const response = await axios.post(`${BASE_URL}/verify-payment`, {
      imp_uid: paymentData.imp_uid,
      merchant_uid: paymentData.merchant_uid,
      couponId: paymentData.couponId || null, // 쿠폰 ID 추가
      userId: paymentData.userId || null, // 유저 ID 추가
      usedMileage: paymentData.usedMileage || 0 // 사용한 마일리지 추가
    });

    // console.log('결제 검증 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('결제 검증 오류:', error.response?.data || error);
    return {status: 500, message: '결제 검증 중 오류 발생'};
  }
};

export const getMyBookings = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/my`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // console.warn('예약 이력이 없습니다.');

      return [];
    }

    console.error('예약 내역 불러오기 실패:', error);
    throw error;
  }
};

export const confirmBooking = async bookingId => {
  try {
    const response = await axios.post(`${BASE_URL}/confirm/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('구매 확정 실패:', error.response?.data || error);
    return {status: 500, message: '구매 확정 중 오류 발생'};
  }
};

export const getBookingDetails = async bookingId => {
  try {
    const response = await axios.get(`${BASE_URL}/detail/${bookingId}`);
    return response.data.data; // `data` 객체만 반환
  } catch (error) {
    console.error('예약 상세 조회 오류:', error.response?.data || error);
    throw error;
  }
};
