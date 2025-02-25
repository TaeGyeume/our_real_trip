import React, {useEffect, useState} from 'react';
import {
  getTourTickets,
  deleteMultipleTourTickets
} from '../../../api/tourTicket/tourTicketService';
import {useLocation, useNavigate} from 'react-router-dom';
import {Box, Card, CardMedia, CardContent, Typography} from '@mui/material';

const TourTicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false); // 삭제 모드 여부
  const [selectedTickets, setSelectedTickets] = useState(new Set()); // 선택된 티켓 ID

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getTourTickets();

        const sortedTickets = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setTickets(data);
      } catch (error) {
        console.error('투어 티켓 목록을 가져오는 중 오류 발생:', error);
      }
    };

    fetchTickets();
  }, []);

  // 삭제 모드 토글
  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => !prev);
    setSelectedTickets(new Set()); // 선택 초기화
  };

  // 품 선택 / 해제
  const handleSelectTicket = ticketId => {
    setSelectedTickets(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(ticketId)) {
        newSelection.delete(ticketId);
      } else {
        newSelection.add(ticketId);
      }
      return newSelection;
    });
  };

  // 선택한 상품 삭제
  const handleDelete = async () => {
    if (selectedTickets.size === 0) {
      alert('삭제할 상품을 선택하세요.');
      return;
    }

    const confirmDelete = window.confirm(
      `${selectedTickets.size}개의 상품을 삭제하시겠습니까?`
    );

    if (!confirmDelete) return;

    try {
      await deleteMultipleTourTickets([...selectedTickets]);
      alert('삭제가 완료되었습니다.');

      // 삭제 후 목록 갱신
      setTickets(prev => prev.filter(ticket => !selectedTickets.has(ticket._id)));
      setSelectedTickets(new Set()); // 선택 초기화
      setIsDeleteMode(false); // 삭제 모드 해제
    } catch (error) {
      console.error('상품 삭제 중 오류 발생:', error);
      alert('상품 삭제 실패');
    }
  };

  return (
    <div className="tour-ticket-container">
      <h2>🎟 투어 & 티켓 상품</h2>

      {/* /product/tourTicket에서는 버튼을 숨김 */}
      {location.pathname !== '/product' && (
        <div className="button-group">
          <button onClick={() => navigate('/product/tourTicket/new')}>상품 등록</button>
          {!isDeleteMode ? (
            <button onClick={toggleDeleteMode} className="delete-mode-btn">
              삭제 모드
            </button>
          ) : (
            <>
              <button onClick={handleDelete} className="confirm-delete-btn">
                삭제하기
              </button>
              <button onClick={toggleDeleteMode} className="cancel-delete-btn">
                삭제 취소
              </button>
            </>
          )}
        </div>
      )}

      <Box display="flex" flexWrap="wrap" gap={3} mt={3}>
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <Card
              key={ticket._id}
              sx={{
                width: '300px',
                borderRadius: 3,
                boxShadow: 3,
                cursor: 'pointer',
                transition: '0.3s',
                position: 'relative',
                mb: 2,
                '&:hover': {boxShadow: 6}
              }}
              onClick={() =>
                isDeleteMode
                  ? handleSelectTicket(ticket._id)
                  : navigate(`/product/tourTicket/${ticket._id}`)
              }>
              {/* 체크박스, 이미지, 상품 정보 */}
              {isDeleteMode && (
                <input
                  type="checkbox"
                  checked={selectedTickets.has(ticket._id)}
                  onChange={() => handleSelectTicket(ticket._id)}
                  onClick={e => e.stopPropagation()} // 카드 클릭 방지
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 2,
                    backgroundColor: 'white'
                  }}
                />
              )}
              <CardMedia
                component="img"
                height="200"
                image={`http://localhost:5000${ticket.images[0]}`}
                alt={ticket.title}
              />
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{height: '2rem', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                  {ticket.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{height: '2rem', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                  ✏️| {ticket.description}
                </Typography>
                <Typography variant="body1" sx={{color: 'primary.main', mt: 1}}>
                  💰 {ticket.price.toLocaleString()}원
                </Typography>
                <Typography>재고: {ticket.stock}</Typography>
                <Typography variant="body2" sx={{mt: 1}}>
                  지역: {ticket.location}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>등록된 상품이 없습니다.</p>
        )}
      </Box>
    </div>
  );
};

export default TourTicketList;
