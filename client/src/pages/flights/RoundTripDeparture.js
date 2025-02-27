import React, {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {searchFlights} from '../../api/flight/flights';
import FlightList from '../../components/flights/FlightList';
import LoadingScreen from '../../components/flights/LoadingScreen';

const RoundTripDeparture = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {departureFlights, passengers} = location.state || {
    departureFlights: [],
    passengers: 1
  };

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectDeparture = async flight => {
    setLoading(true);

    try {
      const returnFlights = await searchFlights(
        flight.arrival.airport,
        flight.departure.airport,
        location.state?.returnDate,
        passengers
      );
      setTimeout(() => {
        setLoading(false);
        navigate('/flights/roundtrip-return', {
          state: {selectedDeparture: flight, returnFlights, passengers}
        });
      }, 500);
    } catch (error) {
      setErrorMessage('도착 항공편 검색 중 오류가 발생했습니다.');
      navigate('/flights/roundtrip-return', {
        state: {selectedDeparture: flight, returnFlights: [], passengers}
      });
    }
  };

  return (
    <div className="container-md mt-4" style={{maxWidth: '900px'}}>
      <h2 className="fw-bold mb-4 text-center">🛫 출발 항공편 선택</h2>
      {errorMessage && <p className="text-danger text-center">{errorMessage}</p>}
      {loading && <LoadingScreen />}
      {!loading && (
        <FlightList flights={departureFlights} onSelect={handleSelectDeparture} />
      )}
    </div>
  );
};

export default RoundTripDeparture;
