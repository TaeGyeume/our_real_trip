import React, {useEffect, useState} from 'react';
import {getTourTickets} from '../../api/tourTicket/tourTicketService';
import {getUserFavorites} from '../../api/user/favoriteService'; //  즐겨찾기 목록 가져오기 추가
import {useNavigate} from 'react-router-dom';
import './styles/UserList.css';
import FavoriteButton from '../user/FavoriteButton';

const TourTicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [favorites, setFavorites] = useState([]); //  즐겨찾기 목록 상태 추가

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getTourTickets();
        setTickets(data);
      } catch (error) {
        console.error('투어 티켓 목록을 가져오는 중 오류 발생:', error);
      }
    };

    const fetchFavorites = async () => {
      try {
        const response = await getUserFavorites();
        setFavorites(response.favorites); //  사용자 즐겨찾기 목록 저장
      } catch (error) {
        // console.error('즐겨찾기 목록 가져오기 오류:', error);
      }
    };

    fetchTickets();
    fetchFavorites();
  }, []);

  //  특정 아이템이 즐겨찾기 목록에 있는지 확인하는 함수
  const isFavoriteItem = itemId => {
    return favorites.some(fav => fav.itemId === itemId);
  };

  //  필터링된 상품 (즐겨찾기 정보 반영)
  const filteredTickets = tickets.map(ticket => ({
    ...ticket,
    isFavorite: isFavoriteItem(ticket._id) //  즐겨찾기 상태 반영
  }));

  return (
    <div className="tour-ticket-container">
      <div className="tour-ticket-grid">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(ticket => (
            <div
              key={ticket._id}
              className="tour-ticket-card"
              onClick={e => {
                e.stopPropagation();
                navigate(`/tourTicket/list/${ticket._id}`);
              }}>
              <img
                src={`http://localhost:5000${ticket.images[0]}`}
                alt={ticket.title}
                className="ticket-image"
              />
              {/*  즐겨찾기 버튼 (즐겨찾기 상태 반영) */}
              <div className="favorite-list-icon">
                <FavoriteButton
                  itemId={ticket._id}
                  itemType="TourTicket"
                  initialFavoriteStatus={ticket.isFavorite}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="ticket-info">
                <h3 className="ticket-title">{ticket.title}</h3>
                <p className="ticket-price">{ticket.price.toLocaleString()}원</p>
              </div>
            </div>
          ))
        ) : (
          <p>등록된 상품이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default TourTicketList;
