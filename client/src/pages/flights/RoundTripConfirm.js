import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import FlightBookingForm from '../../components/booking/FlightBookingForm';

const RoundTripConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedDeparture,
    selectedReturn,
    selectedFlight,
    passengers = location.state?.passengers || 1
  } = location.state || {};

  // 선택된 항공편 배열 구성: 단일, 출발, 왕복 항공편 모두 포함
  const selectedFlights = [];
  if (selectedFlight) selectedFlights.push(selectedFlight);
  if (selectedDeparture) selectedFlights.push(selectedDeparture);
  if (selectedReturn) selectedFlights.push(selectedReturn);

  if (selectedFlights.length === 0) {
    return <p className="text-center text-danger">예약할 항공편이 없습니다.</p>;
  }

  return (
    <div className="tour-ticket-booking-container">
      <FlightBookingForm
        selectedFlights={selectedFlights}
        passengers={passengers}
        onBookingSuccess={() => navigate('/')}
      />
    </div>
  );
};

export default RoundTripConfirm;
