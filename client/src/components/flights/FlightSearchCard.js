import React from 'react';
import {AIRLINE_LOGOS} from '../../data/airline';

const formatTime = timeString => {
  if (!timeString || typeof timeString !== 'string' || timeString.length !== 4) {
    return '시간 미정';
  }
  return `${timeString.substr(0, 2)}:${timeString.substr(2, 2)}`;
};

const FlightSearchCard = ({flight, onSelect}) => {
  const logoFile = AIRLINE_LOGOS[flight.airline] || 'default.png';

  return (
    <div className="col-12 mb-3">
      <div
        className="card p-3 shadow-sm d-flex flex-row align-items-center"
        style={{minHeight: '80px'}}>
        {/* 항공사 로고 및 정보 */}
        <div className="d-flex align-items-center me-3" style={{flexBasis: '200px'}}>
          <img
            src={`/images/logos/${logoFile}`}
            alt={flight.airline}
            className="img-fluid"
            style={{width: '40px', height: '40px'}}
          />
          <div className="ms-2">
            <h6 className="mb-1">{flight.airline}</h6>
            <small className="text-muted">{flight.flightNumber}</small>
          </div>
        </div>

        {/* 출발 시간 */}
        <div className="text-center" style={{flexBasis: '150px'}}>
          <p className="fs-5 fw-bold mb-0">{formatTime(flight.departure.time)}</p>
          <small className="text-muted">{flight.departure.airport}</small>
        </div>

        {/* 방향 아이콘 */}
        <div className="fs-5 text-muted mx-2">→</div>

        {/* 도착 시간 */}
        <div className="text-center" style={{flexBasis: '150px'}}>
          <p className="fs-5 fw-bold mb-0">{formatTime(flight.arrival.time)}</p>
          <small className="text-muted">{flight.arrival.airport}</small>
        </div>

        {/* 좌석 등급 */}
        <div className="text-center" style={{flexBasis: '120px'}}>
          <p className="fw-semibold text-success mb-0">
            {flight.seatClass || '등급 미정'}
          </p>
          <small className="text-muted">{flight.seatsAvailable || '정보 없음'}석</small>
        </div>

        {/* 가격 */}
        <div
          className="text-end ms-auto"
          style={{flexBasis: '130px', whiteSpace: 'nowrap'}}>
          <p className="fs-5 fw-bold text-primary mb-0">
            {flight.price ? flight.price.toLocaleString() : '0'}원
          </p>
        </div>

        {/* 선택 버튼 */}
        <button
          className="btn btn-primary btn-sm ms-3"
          style={{
            minWidth: '70px',
            height: '50px',
            whiteSpace: 'nowrap',
            fontSize: '14px',
            padding: '5px 10px'
          }}
          onClick={() => onSelect(flight)}>
          선택
        </button>
      </div>
    </div>
  );
};

export default FlightSearchCard;
