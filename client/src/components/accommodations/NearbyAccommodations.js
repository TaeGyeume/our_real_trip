// src/components/accommodations/NearbyAccommodations.js
import React, {useState, useEffect, useRef} from 'react';
import {fetchNearbyAccommodations} from '../../api/accommodation/accommodationService';
import AccommodationCard from '../product/accommodations/AccommodationCard';
import {Box, Typography, CircularProgress, IconButton} from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {ArrowBackIos, ArrowForwardIos} from '@mui/icons-material';

const NearbyAccommodations = ({lat, lng, radius = 5000, limit = 6}) => {
  const [nearbyAccommodations, setNearbyAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng) return;

    const loadNearbyAccommodations = async () => {
      try {
        setLoading(true);
        const data = await fetchNearbyAccommodations(lat, lng, radius, limit);
        setNearbyAccommodations(data);
      } catch (error) {
        console.error('주변 숙소 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNearbyAccommodations();
  }, [lat, lng, radius, limit]);

  // Slick Slider 설정
  const settings = {
    dots: false, // 하단 네비게이션
    infinite: false, // 무한 루프
    speed: 500, // 슬라이드 전환 속도
    slidesToShow: 4, // 기본 4개 표시
    slidesToScroll: 2, // 두개씩 이동
    arrows: false, // 기본 화살표 제거 (커스텀 버튼 사용)
    responsive: [
      {
        breakpoint: 1024, // 태블릿
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 768, // 모바일
        settings: {
          slidesToShow: 1
        }
      }
    ]
  };

  return (
    <Box sx={{mt: 5, position: 'relative'}}>
      <Typography variant="h5" fontWeight="bold" sx={{mb: 2}}>
        주변 숙소 추천
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : nearbyAccommodations.length > 0 ? (
        <Box sx={{position: 'relative', width: '100%'}}>
          {/* Slick Slider 적용 (버튼이 내부에 위치하도록 Box 추가) */}
          <Box sx={{position: 'relative'}}>
            {/* 좌측 네비게이션 버튼 */}
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                left: '-30px', // 버튼이 너무 왼쪽으로 빠지지 않도록 수정
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
              onClick={() => sliderRef.current.slickPrev()}>
              <ArrowBackIos />
            </IconButton>

            {/* Slick Slider (슬라이드 컨테이너) */}
            <Slider ref={sliderRef} {...settings}>
              {nearbyAccommodations.map(acc => (
                <Box key={acc._id} sx={{px: 1}}>
                  <AccommodationCard accommodation={acc} />
                </Box>
              ))}
            </Slider>

            {/* 우측 네비게이션 버튼 */}
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                right: '-35px', // 버튼이 너무 오른쪽으로 빠지지 않도록 수정
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
              onClick={() => sliderRef.current.slickNext()}>
              <ArrowForwardIos />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Typography color="text.secondary">주변에 숙소가 없습니다.</Typography>
      )}
    </Box>
  );
};

export default NearbyAccommodations;
