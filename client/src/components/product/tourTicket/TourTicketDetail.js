import React, {useEffect, useState} from 'react';
import {
  getTourTicketById,
  deleteMultipleTourTickets
} from '../../../api/tourTicket/tourTicketService';
import {useParams, useNavigate} from 'react-router-dom';
import './styles/TourTicketDetail.css';
import {Typography, Button, IconButton} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosNewIcon from '@mui/icons-material/ArrowForwardIos';
import {FaMapMarkerAlt} from 'react-icons/fa';

const TourTicketDetail = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // 현재 이미지 인덱스
  const [selectedTickets, setSelectedTickets] = useState(new Set()); // 선택된 티켓 ID

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTourTicketById(id);
        setTicket(data);
      } catch (error) {
        console.error('상품 정보를 가져오는 중 오류 발생:', error);
      }
    };

    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (ticket) {
      setSelectedTickets(new Set([ticket._id])); // 항상 현재 상품이 선택된 상태 유지
    }

    if (!ticket || ticket.images.length <= 1) return; // 이미지가 하나면 슬라이드 X
  }, [ticket]);

  if (!ticket) {
    return <p>상품 정보를 불러오는 중...</p>;
  }

  const handleNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % ticket.images.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prevIndex =>
      prevIndex === 0 ? ticket.images.length - 1 : prevIndex - 1
    );
  };

  const handleDotClick = index => {
    setCurrentIndex(index);
  };

  // 선택한 상품 삭제
  const handleDelete = async () => {
    const confirmDelete = window.confirm(`상품을 삭제하시겠습니까?`);

    if (!confirmDelete) return;

    try {
      await deleteMultipleTourTickets([...selectedTickets]);
      alert('삭제가 완료되었습니다.');
      navigate('/product/tourTicket/list');
    } catch (error) {
      console.error('상품 삭제 중 오류 발생:', error);
      alert('상품 삭제 실패');
    }
  };

  return (
    <div className="user-detail-tour-ticket-container">
      {/* 왼쪽 상세 정보 영역 */}
      <div className="user-detail-tour-ticket-detail">
        <div className="user-detail-ticket-header">
          <div className="user-detail-ticket-location">
            <FaMapMarkerAlt />
            &nbsp;
            <span>{ticket.location}</span>
          </div>

          <h1 className="user-detail-ticket-title">{ticket.title}</h1>
        </div>

        <hr className="user-detail-sun" />

        <Typography variant="body1" className="user-detail-ticket-description">
          {ticket.description.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </Typography>
        <p className="user-detail-instant-confirmation"></p>

        <div className="image-slider">
          <img
            src={`${SERVER_URL}${ticket.images[currentIndex]}`}
            alt={ticket.title}
            className="slider-image"
          />

          {/* {ticket.images.length > 1 && (
            <>
              <button className="prev-btn" onClick={handlePrev}>
                &lt;
              </button>
              <button className="next-btn" onClick={handleNext}>
                &gt;
              </button>
            </>
          )} */}

          {ticket.images.length > 1 && (
            <>
              <IconButton
                className="prev-btn"
                onClick={handlePrev}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '15px',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {backgroundColor: 'rgba(0, 0, 0, 0.8)'},
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  zIndex: 2
                }}>
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>

              <IconButton
                className="next-btn"
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: '15px',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {backgroundColor: 'rgba(0, 0, 0, 0.8)'},
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  zIndex: 2
                }}>
                <ArrowForwardIosNewIcon fontSize="small" />
              </IconButton>
            </>
          )}

          <div className="dots-container">
            {ticket.images.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="user-detail-empty-space">
        <div className="user-detail-right-space">
          <div className="user-detail-price-info">
            <p className="user-detail-original-price">
              {ticket.price.toLocaleString()}원 / {ticket.stock}개
            </p>
          </div>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDelete}
            sx={{backgroundColor: 'rgb(216, 65, 27)', color: 'white'}}>
            삭제
          </Button>
          &nbsp;
          <Button
            variant="outlined"
            onClick={() => navigate(`/product/tourTicket/modify/${id}`)}
            sx={{backgroundColor: 'rgb(38, 136, 202)', color: 'white'}}>
            수정
          </Button>
          &nbsp;
          <Button
            variant="outlined"
            onClick={() => navigate('/product/tourTicket/list')}
            sx={{backgroundColor: 'rgb(24, 160, 90)', color: 'white'}}>
            목록 이동
          </Button>
          <p className="user-detail-instant-confirmation"></p>
        </div>
      </div>
    </div>
  );
};

export default TourTicketDetail;
