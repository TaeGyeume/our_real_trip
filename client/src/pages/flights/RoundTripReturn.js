import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import FlightList from '../../components/flights/FlightList';

const RoundTripReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {selectedDeparture, returnFlights, passengers} = location.state || {};

  if (!selectedDeparture) {
    return (
      <p className="text-center text-danger">🚫 출발 항공편이 선택되지 않았습니다.</p>
    );
  }

  const handleSelectReturn = flight => {
    navigate('/flights/roundtrip-confirm', {
      state: {selectedDeparture, selectedReturn: flight, passengers, isRoundTrip: true}
    });
  };

  return (
    <div className="container-md mt-4" style={{maxWidth: '900px'}}>
      <h2 className="fw-bold mb-4 text-center">🛬 돌아오는 항공편 선택</h2>
      <FlightList flights={returnFlights} onSelect={handleSelectReturn} />
    </div>
  );
};

export default RoundTripReturn;
