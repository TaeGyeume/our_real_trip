import React from 'react';

const AIRLINE_LOGOS = {
  대한항공: 'korean.png',
  아시아나항공: 'asiana.png',
  에어서울: 'airseoul.png',
  이스타항공: 'eastar.png',
  진에어: 'jinair.png',
  티웨이항공: 'twayair.png',
  제주항공: 'jejuair.png',
  에어부산: 'airbusan.png',
  피치항공: 'peach.png',
  '집에어 도쿄': 'zipair_tokyo.png',
  에어재팬화물항공: 'airjapan.png',
  전일본공수: 'ana.jpg',
  일본항공: 'japanair.png',
  에어로케이항공: 'airok.png',
  프랑스항공: 'airfrance.png',
  중국국제항공: 'airchina.png',
  중국남방항공: 'chinaair.png',
  중국동방항공: 'china.png',
  중화항공: 'cchina.jpg',
  '젯스타 에어웨이즈': 'jetstar_logo.png',
  '호주항공(콴타스항공)': 'QF.png',
  에어프레미아: 'YP.png',
  타이항공: 'TG.png',
  에바항공: 'BR.png',
  '에바항공(장영항공)': 'BR.png',
  춘추항공: 'chunchu.png'
};

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
