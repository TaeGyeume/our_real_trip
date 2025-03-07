import React, {useEffect, useState, useRef, useMemo} from 'react';
import {getTourTickets} from '../../api/tourTicket/tourTicketService';
import {getUserFavorites} from '../../api/user/favoriteService';
import {useNavigate} from 'react-router-dom';
import './styles/UserList.css';
import FavoriteButton from '../user/FavoriteButton';
import ReviewList from '../review/ReviewList';
import {IconButton} from '@mui/material';
import {ArrowBackIosNew, ArrowForwardIos} from '@mui/icons-material';
import AdBanner from '../ad/AdBanner';
import TourFilter from './TourFilter';

const UserList = ({showFilter = true, showAdBanner = true}) => {
  const [tickets, setTickets] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [visibleIndex, setVisibleIndex] = useState({});
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [regionType, setRegionType] = useState('domestic');
  const [selectedCities, setSelectedCities] = useState([]);

  const [ratingInfo, setRatingInfo] = useState({});

  const navigate = useNavigate();
  const initialRender = useRef(true);

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  const domesticLocations = [
    '서울',
    '경기도',
    '강원도',
    '충청북도',
    '충청남도',
    '전라북도',
    '전라남도',
    '경상북도',
    '경상남도',
    '제주도'
  ];
  const internationalLocations = [
    '도쿄',
    '베이징',
    '타이베이',
    '런던',
    '파리',
    '시드니',
    '뉴욕',
    '방콕'
  ];

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
        setFavorites(response.favorites);
      } catch (error) {}
    };

    fetchTickets();
    fetchFavorites();
  }, []);

  const isFavoriteItem = itemId => {
    return favorites.some(fav => fav.itemId === itemId);
  };

  const getImageUrl = ticket => {
    if (!ticket || !Array.isArray(ticket.images) || ticket.images.length === 0) {
      return '/default-image.jpg';
    }

    const firstImage = ticket.images[0];
    return firstImage.startsWith('/uploads/') ? `${SERVER_URL}${firstImage}` : firstImage;
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const ticketRating = ratingInfo[ticket._id]?.avgRating || 0;

      if (regionType === 'domestic' && !domesticLocations.includes(ticket.location))
        return false;

      if (
        regionType === 'international' &&
        !internationalLocations.includes(ticket.location)
      )
        return false;

      if (ticket.price < priceRange[0] || ticket.price > priceRange[1]) return false;

      if (ratingFilter === '4' && ticketRating < 4) {
        return false;
      } else if (ratingFilter === '1' && ticketRating >= 1) {
        return false;
      }

      if (selectedCities.length > 0 && !selectedCities.includes(ticket.location))
        return false;

      return true;
    });
  }, [tickets, priceRange, ratingFilter, selectedCities, regionType, ratingInfo]);

  const groupedTickets = useMemo(() => {
    if (!filteredTickets.length) return {};

    const grouped = filteredTickets.reduce((acc, ticket) => {
      const location = ticket.location || '기타';

      if (!acc[location]) acc[location] = [];

      acc[location].push(ticket);

      return acc;
    }, {});

    return grouped;
  }, [filteredTickets]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (Object.keys(groupedTickets).length === 0) return;

    setVisibleIndex(prev => {
      const newIndex = {};

      Object.keys(groupedTickets).forEach(location => {
        newIndex[location] = prev[location] || 0;
      });

      return newIndex;
    });
  }, [groupedTickets]);

  const itemsPerPage = 4;

  const handleScrollLeft = location => {
    setVisibleIndex(prev => ({
      ...prev,
      [location]: Math.max(0, (prev[location] || 0) - 2)
    }));
  };

  const handleScrollRight = location => {
    setVisibleIndex(prev => {
      const maxIndex = Math.ceil(groupedTickets[location].length / itemsPerPage) - 1;
      return {
        ...prev,
        [location]: Math.min(maxIndex, (prev[location] || 0) + 2)
      };
    });
  };

  return (
    <>
      {showAdBanner && <AdBanner banners={[{image: '/images/ad/tourticket1.png'}]} />}
      <br />
      <div className="user-list-container">
        {showFilter && (
          <TourFilter
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            regionType={regionType}
            setRegionType={type => {
              setRegionType(type);
              setSelectedCities([]);
            }}
            selectedCities={selectedCities}
            setSelectedCities={setSelectedCities}
            domesticLocations={domesticLocations}
            internationalLocations={internationalLocations}
            handleResetFilters={() => {
              setPriceRange([0, 100000]);
              setRatingFilter('all');
              setSelectedCities([]);
              setRegionType('domestic');
            }}
          />
        )}

        <div className="user-list-tour-ticket-container">
          {Object.keys(groupedTickets).map(location => (
            <div key={location} className="user-list-location-section">
              <h2 className="user-list-location-title">{location}</h2>

              <div className="user-list-tour-ticket-wrapper">
                {groupedTickets[location].length > itemsPerPage &&
                  visibleIndex[location] > 0 && (
                    <IconButton
                      className="user-list-scroll-button user-list-scroll-button-left"
                      onClick={() => handleScrollLeft(location)}
                      sx={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {backgroundColor: 'rgba(0, 0, 0, 0.8)'}
                      }}>
                      <ArrowBackIosNew fontSize="large" />
                    </IconButton>
                  )}

                <div
                  className="user-list-tour-ticket-grid"
                  style={{
                    display: 'flex',
                    transition: 'transform 0.3s ease-in-out',
                    transform: `translateX(-${(visibleIndex[location] || 0) * 320}px)`
                  }}>
                  {groupedTickets[location].map(ticket => (
                    <div
                      key={ticket._id}
                      className="user-list-tour-ticket-card"
                      onClick={() => navigate(`/tourTicket/list/${ticket._id}`)}>
                      <div className="user-list-favorite-list-icon">
                        <FavoriteButton
                          itemId={ticket._id}
                          itemType="TourTicket"
                          initialFavoriteStatus={isFavoriteItem(ticket._id)}
                        />
                      </div>

                      <img
                        src={getImageUrl(ticket)}
                        alt={ticket.title}
                        className="user-list-ticket-image"
                      />

                      <div className="user-list-ticket-info">
                        <h3 className="user-list-ticket-title">{ticket.title}</h3>
                        <div className="user-list-review-summary">
                          <ReviewList
                            productId={ticket._id}
                            setRatingInfo={setRatingInfo}
                            ratingInfo={
                              ratingInfo[ticket._id] || {avgRating: 0, reviewCount: 0}
                            }
                            showOnlySummary={true}
                          />
                        </div>
                        <div className="user-list-ticket-price">
                          {ticket.price.toLocaleString()}원 / 1인
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {groupedTickets[location].length > itemsPerPage &&
                  visibleIndex[location] + itemsPerPage <
                    groupedTickets[location].length && (
                    <IconButton
                      className="user-list-scroll-button user-list-scroll-button-right"
                      onClick={() => handleScrollRight(location)}
                      sx={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {backgroundColor: 'rgba(0, 0, 0, 0.8)'}
                      }}>
                      <ArrowForwardIos fontSize="large" />
                    </IconButton>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default UserList;
