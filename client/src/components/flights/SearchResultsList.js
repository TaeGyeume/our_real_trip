import React from 'react';
import {useNavigate} from 'react-router-dom';
import FlightSearchCard from './FlightSearchCard';

const SearchResultsList = ({flights, passengers = 1}) => {
  const navigate = useNavigate();

  const handleSelectFlight = flight => {
    navigate('/flights/roundtrip-confirm', {
      state: {selectedFlight: flight, isRoundTrip: false, passengers}
    });
  };

  return (
    <div className="container-md mt-4" style={{maxWidth: '900px'}}>
      <div className="row justify-content-center">
        {flights.length === 0 ? (
          <p className="text-muted text-center">검색된 항공편이 없습니다.</p>
        ) : (
          flights.map(flight => (
            <FlightSearchCard
              key={flight._id}
              flight={flight}
              onSelect={handleSelectFlight}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SearchResultsList;
