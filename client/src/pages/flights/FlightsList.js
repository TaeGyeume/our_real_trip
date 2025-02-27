import React, {useEffect, useState} from 'react';
import {getFlights, deleteFlight} from '../../api/flight/flights';
import {useNavigate} from 'react-router-dom';

const FlightsList = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      setLoading(true);
      const data = await getFlights();
      console.log('API 응답 데이터:', data);
      setFlights(data || []); // undefined일 경우 빈 배열로 설정
    } catch (error) {
      console.error('항공편 목록을 불러오는 중 오류 발생:', error);
      setError('항공편 데이터를 불러오는 데 실패했습니다.');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (window.confirm('이 항공편을 삭제하시겠습니까?')) {
      try {
        await deleteFlight(id);
        loadFlights(); // 삭제 후 목록 다시 불러오기
      } catch (error) {
        console.error('삭제 오류:', error);
      }
    }
  };

  if (loading) return <p>항공편 데이터를 불러오는 중...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>항공편 목록</h2>
      <button onClick={() => navigate('/flights/create')}>항공편 추가</button>
      {flights?.length === 0 ? ( // flights가 undefined일 때도 오류 방지
        <p>등록된 항공편이 없습니다.</p>
      ) : (
        <ul>
          {flights.map(flight => (
            <li key={flight._id}>
              {flight.airline} - {flight.flightNumber} ({flight.departure.city} →{' '}
              {flight.arrival.city})
              <button onClick={() => navigate(`/flights/edit/${flight._id}`)}>
                수정
              </button>
              <button onClick={() => handleDelete(flight._id)}>삭제</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FlightsList;
