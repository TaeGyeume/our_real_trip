// src/pages/accommodation/AccommodationDetail.js
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import {getReviews} from '../../api/review/reviewService';
import {useReviewContext} from '../../contexts/ReviewContext';
import {fetchAccommodationDetail} from '../../api/accommodation/accommodationService';
import RoomCard from '../../components/accommodations/RoomCard';
import MapComponent from '../../components/accommodations/GoogleMapComponent';
import ReviewList from '../../components/review/ReviewList';
import AccommodationAmenities from '../../components/accommodations/AccommodationAmenities';
import AccommodationImageGallery from '../../components/accommodations/AccommodationImageGallery';
import AccommodationSearch from '../../components/accommodations/AccommodationSearch';
import NearbyAccommodations from '../../components/accommodations/NearbyAccommodations';
import authAPI from '../../api/auth/auth';
import './styles/AccommodationDetail.css';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import {FaChevronRight, FaShareAlt} from 'react-icons/fa';

// 기본 날짜 설정 함수 (오늘 + n일)
const getFormattedDate = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
};

const AccommodationDetail = () => {
  const {accommodationId} = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accommodationData, setAccommodationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const {setReviewStatus} = useReviewContext();
  const [ratingInfo, setRatingInfo] = useState({avgRating: 0, reviewCount: 0});
  const [openAlert, setOpenAlert] = useState(false);
  const reviewSectionRef = useRef(null);
  const scrollToReviews = () => {
    if (reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  // `searchParams`에서 검색 조건 가져오되, 값이 없으면 기본값 사용
  const [startDate, setStartDate] = useState(
    new Date(searchParams.get('startDate') || getFormattedDate(1))
  );
  const [endDate, setEndDate] = useState(
    new Date(searchParams.get('endDate') || getFormattedDate(2))
  );
  const [adults, setAdults] = useState(Number(searchParams.get('adults')) || 1);
  const minPrice = searchParams.get('minPrice') || 0;
  const maxPrice = searchParams.get('maxPrice') || 500000;

  useEffect(() => {
    // 로그인된 사용자 정보 가져오기
    const fetchUserProfile = async () => {
      try {
        const userProfile = await authAPI.getUserProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      }
    };

    const loadAccommodationDetail = async () => {
      try {
        const params = {startDate, endDate, adults, minPrice, maxPrice};
        const data = await fetchAccommodationDetail(accommodationId, params);

        const updatedRooms = data.availableRooms.map(room => ({
          ...room,
          checkInTime: room.checkInTime || '15:00',
          checkOutTime: room.checkOutTime || '11:00'
        }));

        setAccommodationData({
          ...data,
          availableRooms: updatedRooms
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile().then(() => {
      loadAccommodationDetail();
    });
  }, [accommodationId, startDate, endDate, adults, minPrice, maxPrice, setReviewStatus]);

  // `fetchReviews`를 useCallback으로 감싸기
  const fetchReviews = useCallback(async () => {
    try {
      const data = await getReviews(accommodationId);

      if (!user || !user._id || !Array.isArray(data)) return; // user가 없거나 데이터가 배열이 아니면 실행하지 않음

      const updatedReviewStatus = {};
      data.forEach(review => {
        if (review.userId._id === user._id) {
          const key = `${review.productId}_${review.bookingId}`;
          updatedReviewStatus[key] = true;
        }
      });

      setReviewStatus(prev => ({...prev, ...updatedReviewStatus}));
    } catch (err) {
      console.error('리뷰 조회 오류:', err);
    }
  }, [accommodationId, user, setReviewStatus]);

  // user 값이 있을 때만 fetchReviews 실행
  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user, fetchReviews]);

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!accommodationData) return <Typography>데이터가 없습니다.</Typography>;

  const {accommodation, availableRooms} = accommodationData;
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  // 검색 조건 변경 시 URL 업데이트 및 다시 검색
  const handleSearchUpdate = () => {
    const newParams = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      adults,
      minPrice,
      maxPrice
    };
    setSearchParams(newParams);
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.href;

    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        setOpenAlert(true);
        setTimeout(() => setOpenAlert(false), 3000);
      })
      .catch(err => console.error('링크 복사 실패:', err));
  };

  return (
    <Box sx={{maxWidth: '1200px', mx: 'auto', p: 3}}>
      <Box sx={{maxWidth: '1200px', mx: 'auto', mt: 4, p: 2}}>
        {/* 숙소 이름 및 설명 */}
        <Card sx={{p: 3, mb: 3}}>
          <CardContent>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {accommodation.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
              {accommodation.description}
            </Typography>
          </CardContent>
          <div className="review-summary">
            <FaShareAlt
              style={{
                top: '10px',
                right: '10px',
                border: 'none',
                background: 'none',
                fontSize: '18px',
                color: 'dark gray'
              }}
              onClick={handleCopyLink}
            />{' '}
            &nbsp;&nbsp;
            <Snackbar
              open={openAlert}
              anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
              <Alert severity="success" variant="filled">
                링크 복사 완료 🎉
              </Alert>
            </Snackbar>
            <ReviewList
              productId={accommodationId}
              setRatingInfo={setRatingInfo}
              ratingInfo={ratingInfo[accommodationId] || {avgRating: 0, reviewCount: 0}}
              showOnlySummary={true}
            />
            <FaChevronRight className="more-icon" onClick={scrollToReviews} />
          </div>
        </Card>

        {/* 리뷰 요약 및 공유 아이콘 */}

        {/* 숙소 이미지 갤러리 */}
        <Card sx={{p: 3, mb: 3}}>
          <CardContent>
            <AccommodationImageGallery
              images={accommodation.images}
              accommodationName={accommodation.name}
              serverUrl={SERVER_URL}
            />
          </CardContent>
        </Card>

        <Divider sx={{my: 3}} />
      </Box>

      {/* 숙소 정보 (주소 & 지도) */}
      <Card sx={{my: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, boxShadow: 1}}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold">
            📍 주소
          </Typography>
          <Typography variant="body1">{accommodation.address}</Typography>

          {/* Google Maps 추가 */}
          {accommodation.coordinates?.coordinates ? (
            <Box sx={{mt: 2, borderRadius: 2, overflow: 'hidden'}}>
              <MapComponent
                lat={accommodation.coordinates.coordinates[1]}
                lng={accommodation.coordinates.coordinates[0]}
              />
            </Box>
          ) : (
            <Typography color="text.secondary" mt={2}>
              지도 정보를 불러올 수 없습니다.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 숙소 편의시설 */}
      <Box sx={{mb: 3}}>
        <AccommodationAmenities amenities={accommodation.amenities} />
      </Box>

      {/* 날짜 및 인원 검색 기능 */}
      <AccommodationSearch
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        adults={adults}
        setAdults={setAdults}
        onSearch={handleSearchUpdate}
      />

      {/* 예약 가능한 객실 목록 */}
      <Box sx={{mt: 4}}>
        <Typography variant="h5" fontWeight="bold" sx={{mb: 2}}>
          🏨 예약 가능한 객실
        </Typography>
        <Divider sx={{mb: 2}} />
        {availableRooms?.length > 0 ? (
          <Stack spacing={2}>
            {availableRooms.map(room => (
              <RoomCard key={room._id} room={room} />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">예약 가능한 객실이 없습니다.</Typography>
        )}
      </Box>

      {/* 리뷰 리스트  */}
      <Card sx={{p: 3, mt: 3}}>
        <div>
          <h2
            ref={reviewSectionRef}
            style={{
              fontSize: '24px',
              textAlign: 'left',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center', // 세로 정렬
              gap: '8px' // 간격 추가
            }}>
            여행자 리뷰
            <span style={{fontSize: '24px', color: 'dodgerblue', fontWeight: 'bold'}}>
              <ReviewList
                productId={accommodationId}
                setRatingInfo={setRatingInfo}
                ratingInfo={ratingInfo[accommodationId] || {avgRating: 0, reviewCount: 0}}
                showOnlySummary={true}
              />
            </span>
          </h2>
          <ReviewList
            productId={accommodationId}
            setRatingInfo={setRatingInfo}
            ratingInfo={ratingInfo}
            showOnlySummary={false}
          />
        </div>
      </Card>

      {/* 주변 숙소 컴포넌트 추가 */}
      {accommodation.coordinates?.coordinates && (
        <NearbyAccommodations
          lat={accommodation.coordinates.coordinates[1]}
          lng={accommodation.coordinates.coordinates[0]}
        />
      )}
    </Box>
  );
};

export default AccommodationDetail;
