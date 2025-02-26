import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import FlightBookingForm from '../../components/booking/FlightBookingForm';
import FlightCard from '../../components/flights/FlightCard';

const RoundTripConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedDeparture,
    selectedReturn,
    selectedFlight,
    passengers = location.state?.passengers || 1
  } = location.state || {};

  if (!selectedDeparture && !selectedReturn && !selectedFlight) {
    return <p className="text-center text-danger">예약할 항공편이 없습니다.</p>;
  }

  const selectedFlights = [];
  if (selectedFlight) selectedFlights.push(selectedFlight);
  if (selectedDeparture) selectedFlights.push(selectedDeparture);
  if (selectedReturn) selectedFlights.push(selectedReturn);

  return (
    <div className="container-md mt-4" style={{maxWidth: '900px'}}>
      <h2 className="fw-bold mb-4 text-center">📋 왕복 항공편 예약 확인</h2>
      <div className="text-center mb-4">
        <h4 className="fw-bold">👥 인원수: {passengers}명</h4>
      </div>
      <div className="row justify-content-center">
        {selectedFlights.map(flight => (
          <FlightCard key={flight._id} flight={flight} />
        ))}
      </div>

      {/* 예약 및 결제 폼 */}
      <FlightBookingForm
        selectedFlights={selectedFlights}
        passengers={passengers}
        onBookingSuccess={() => navigate('/')}
      />
    </div>
  );
};

export default RoundTripConfirm;
