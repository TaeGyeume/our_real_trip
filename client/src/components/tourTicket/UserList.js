import React, {useEffect, useState, useRef, useMemo} from 'react';
import {getTourTickets} from '../../api/tourTicket/tourTicketService';
import {getUserFavorites} from '../../api/user/favoriteService';
import {useNavigate} from 'react-router-dom';
import './styles/UserList.css';
import FavoriteButton from '../user/FavoriteButton';
import {
  Slider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Button,
  Typography,
  FormGroup,
  IconButton
} from '@mui/material';
import {ArrowBackIosNew, ArrowForwardIos} from '@mui/icons-material';
import ReviewList from '../review/ReviewList';
import AdBanner from '../ad/AdBanner';

const UserList = () => {
  const [tickets, setTickets] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [visibleIndex, setVisibleIndex] = useState({});

  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedCities, setSelectedCities] = useState([]);

  const [ratingInfo, setRatingInfo] = useState({avgRating: 0, reviewCount: 0});

  const navigate = useNavigate();
  const initialRender = useRef(true);

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

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
    let imageUrl = '/default-image.jpg';

    if (ticket && Array.isArray(ticket.images) && ticket.images.length > 0) {
      imageUrl = ticket.images[0];

      if (imageUrl.startsWith('/uploads/')) {
        imageUrl = `${SERVER_URL}${imageUrl}`;
      }
    }
    return imageUrl;
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // 가격 필터 적용
      if (ticket.price < priceRange[0] || ticket.price > priceRange[1]) {
        return false;
      }

      // 평점 필터 적용 (4점 이상, 5점만)
      if (ratingFilter !== 'all') {
        const minRating = parseFloat(ratingFilter);
        if (ticket.rating < minRating) {
          return false;
        }
      }

      // 여행지 필터 적용
      if (selectedCities.length > 0 && !selectedCities.includes(ticket.location)) {
        return false;
      }

      return true;
    });
  }, [tickets, priceRange, ratingFilter, selectedCities]);

  // 필터된 티켓을 location(지역)별로 그룹화
  const groupedTickets = useMemo(() => {
    if (!filteredTickets.length) return {};

    const grouped = filteredTickets.reduce((acc, ticket) => {
      const location = ticket.location || '기타';

      if (!acc[location]) acc[location] = [];

      acc[location].push({
        ...ticket,
        imageUrl: getImageUrl(ticket),
        isFavorite: isFavoriteItem(ticket._id)
      });

      return acc;
    }, {});

    return grouped;
  }, [filteredTickets, favorites]); // tickets, favorites 변경될 때만 업데이트

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return; // 첫 렌더링에서는 실행하지 않음
    }

    if (Object.keys(groupedTickets).length === 0) return;

    setVisibleIndex(prev => {
      const newIndex = {};

      Object.keys(groupedTickets).forEach(location => {
        newIndex[location] = prev[location] || 0;
      });

      return newIndex;
    });
  }, [groupedTickets]); // `groupedTickets`가 변경될 때만 실행

  const itemsPerPage = 4; // 한 줄에 출력되는 카드의 수

  const handleScrollLeft = location => {
    setVisibleIndex(prev => ({
      ...prev,
      [location]: Math.max(0, (prev[location] || 0) - 2) // 한 칸씩 이동
    }));
  };

  const handleScrollRight = location => {
    setVisibleIndex(prev => {
      const maxIndex = Math.ceil(groupedTickets[location].length / itemsPerPage) - 1;
      return {
        ...prev,
        [location]: Math.min(maxIndex, (prev[location] || 0) + 2) // 마지막 카드 고려해서 이동
      };
    });
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleRatingChange = event => {
    setRatingFilter(event.target.value);
  };

  const handleCityChange = event => {
    const city = event.target.name;

    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const handleResetFilters = () => {
    setPriceRange([0, 100000]);
    setRatingFilter('all');
    setSelectedCities([]);
  };

  const bannerData = [
    {
      image: '/images/ad/tourticket1.png'
    },
    {
      image: '/images/ad/tourticket2.png'
    },
    {
      image: '/images/ad/tourticket3.png'
    },
    {
      image: '/images/ad/tourticket4.png'
    }
  ];

  return (
    <>
      <AdBanner banners={bannerData} />
      <br />
      <div className="user-list-container">
        <div className="user-list-filter">
          <Typography variant="h6" fontWeight="bold">
            필터
          </Typography>
          <Button onClick={handleResetFilters} sx={{float: 'right', color: 'gray'}}>
            초기화
          </Button>

          <Typography variant="subtitle1" fontWeight="bold" mt={2}>
            가격대
          </Typography>

          <Typography
            variant="subtitle1"
            fontWeight="bold"
            mt={1}
            sx={{color: 'dodgerblue'}}>
            {priceRange[0].toLocaleString()}원 ~ {priceRange[1].toLocaleString()}원
          </Typography>

          <Slider
            value={priceRange}
            onChange={handlePriceChange}
            min={0}
            max={100000}
            step={500} // 1만원 단위 조절
            valueLabelDisplay="off"
            sx={{color: 'dodgerblue'}}
          />
          <hr className="sun" />
          <Typography variant="subtitle1" fontWeight="bold" mt={2}>
            평점
          </Typography>

          <FormControl component="fieldset">
            <RadioGroup value={ratingFilter} onChange={handleRatingChange}>
              <FormControlLabel value="all" control={<Radio />} label="전체" />
              <FormControlLabel value="4" control={<Radio />} label="4점 이상" />
              <FormControlLabel value="5" control={<Radio />} label="5점만" />
            </RadioGroup>
          </FormControl>
          <hr className="sun" />
          <Typography variant="subtitle1" fontWeight="bold" mt={2}>
            여행지
          </Typography>
          <FormGroup>
            {[
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
            ].map(city => (
              <FormControlLabel
                key={city}
                control={
                  <Checkbox
                    checked={selectedCities.includes(city)}
                    onChange={handleCityChange}
                    name={city}
                  />
                }
                label={city}
              />
            ))}
          </FormGroup>
        </div>

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
                    transform: `translateX(-${(visibleIndex[location] || 0) * 320}px)`,
                    minWidth: '100%',
                    justifyContent:
                      groupedTickets[location].length < itemsPerPage
                        ? 'flex-start'
                        : 'unset'
                  }}>
                  {groupedTickets[location].map(ticket => (
                    <div
                      key={ticket._id}
                      className="user-list-tour-ticket-card"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/tourTicket/list/${ticket._id}`);
                      }}>
                      <div className="user-list-favorite-list-icon">
                        <FavoriteButton
                          itemId={ticket._id}
                          itemType="TourTicket"
                          initialFavoriteStatus={ticket.isFavorite}
                        />
                      </div>

                      <img
                        src={`${ticket.imageUrl}`}
                        alt={ticket.title}
                        className="user-list-ticket-image"
                      />

                      <div className="user-list-ticket-info">
                        <h3 className="user-list-ticket-title">{ticket.title}</h3>

                        <div className="user-list-review-summary">
                          {/* <ReviewList
                            productId={ticket._id}
                            setRatingInfo={setRatingInfo}
                            ratingInfo={ratingInfo}
                            showOnlySummary={true}
                          /> */}
                          <ReviewList
                            productId={ticket._id}
                            setRatingInfo={setRatingInfo}
                            ratingInfo={
                              ratingInfo[ticket._id] || {avgRating: 0, reviewCount: 0}
                            } // ✅ 해당 상품의 리뷰 정보만 전달
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
