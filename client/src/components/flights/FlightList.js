import React from 'react';
import FlightSearchCard from './FlightSearchCard';

const FlightList = ({flights, onSelect}) => {
  return (
    <div className="row justify-content-center">
      {flights.length === 0 ? (
        <p className="text-muted text-center">항공편이 없습니다.</p>
      ) : (
        flights.map(flight => (
          <FlightSearchCard key={flight._id} flight={flight} onSelect={onSelect} />
        ))
      )}
    </div>
  );
};

export default FlightList;
