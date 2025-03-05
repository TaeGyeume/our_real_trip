import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {getBookingDetails} from '../../api/booking/bookingService';
import PaymentInfo from '../../components/booking/PaymentInfo';
import AccommodationInfo from '../../components/booking/AccommodationInfo';
import TourTicketInfo from '../../components/booking/TourTicketInfo';
import TravelItemInfo from '../../components/booking/TravelItemInfo';
import ReservationInfo from '../../components/booking/ReservationInfo';
import PackageInfo from '../../components/booking/PackageInfo';
import Flightinfo from '../../components/booking/Flightinfo';

// 상품 유형 한글 변환 함수
const translateType = type => {
  const translations = {
    accommodation: '숙소',
    flight: '항공권',
    tourTicket: '투어/티켓',
    travelItem: '여행 용품'
  };
  return translations[type] || type;
};

// 결제 상태 한글 변환 함수
const translatePaymentStatus = status => {
  const translations = {
    PENDING: '결제 대기',
    COMPLETED: '결제 완료',
    CANCELED: '결제 취소',
    CONFIRMED: '예약 확정'
  };
  return translations[status] || status;
};

const BookingDetail = () => {
  const {bookingId} = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await getBookingDetails(bookingId);
        setBooking(response);
      } catch {
        setError('예약 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container mt-3">
      {/* translateType, translatePaymentStatus을 props로 전달 */}
      <PaymentInfo
        booking={booking}
        translateType={translateType}
        translatePaymentStatus={translatePaymentStatus}
      />
      <AccommodationInfo booking={booking} />
      <TourTicketInfo booking={booking} />
      <TravelItemInfo booking={booking} />
      <PackageInfo booking={booking} />
      <Flightinfo booking={booking} />
      <ReservationInfo booking={booking} />
    </div>
  );
};

export default BookingDetail;
