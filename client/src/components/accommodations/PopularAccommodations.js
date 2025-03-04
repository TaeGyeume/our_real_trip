import React, {useEffect, useState} from 'react';
import {fetchPopularAccommodations} from '../../api/accommodation/accommodationService';
import AccommodationCard from '../product/accommodations/AccommodationCard';
import {Box, Typography, CircularProgress, IconButton} from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {ArrowBackIos, ArrowForwardIos} from '@mui/icons-material';

const PopularAccommodations = () => {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = React.useRef(null); // 슬라이더 참조

  useEffect(() => {
    const loadPopularAccommodations = async () => {
      try {
        const data = await fetchPopularAccommodations();
        setAccommodations(data.slice(0, 8)); // 최대 8개만 가져오기
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPopularAccommodations();
  }, []);

  const isSliderActive = accommodations.length > 3;

  // lick Slider 설정
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: isSliderActive ? 4 : accommodations.length, // 데이터 개수만큼만 표시
    slidesToScroll: isSliderActive ? 4 : 1,
    arrows: false, // 기본 화살표 버튼 숨김
    responsive: [
      {
        breakpoint: 1024,
        settings: {slidesToShow: 3, slidesToScroll: 3}
      },
      {
        breakpoint: 768,
        settings: {slidesToShow: 2, slidesToScroll: 2}
      },
      {
        breakpoint: 480,
        settings: {slidesToShow: 1, slidesToScroll: 1}
      }
    ]
  };

  return (
    <Box sx={{maxWidth: 1200, mx: 'auto', mt: 3, px: 2, position: 'relative'}}>
      {/* 제목 */}
      <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center">
        다른 회원님들이 많이 본 숙소
      </Typography>

      {/* 로딩 중이면 로딩 표시 */}
      {loading ? (
        <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
          <CircularProgress />
        </Box>
      ) : accommodations.length > 0 ? (
        isSliderActive ? (
          // 숙소 개수가 충분하면 슬라이더 활성화
          <Box sx={{position: 'relative'}}>
            {/* 왼쪽 버튼 */}
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                left: '-50px',
                transform: 'translateY(-50%)',
                zIndex: 2
              }}
              onClick={() => sliderRef.current.slickPrev()}>
              <ArrowBackIos />
            </IconButton>

            {/* 슬라이더 */}
            <Slider ref={sliderRef} {...settings}>
              {accommodations.map(acc => (
                <Box key={acc._id} sx={{px: 1}}>
                  <AccommodationCard accommodation={acc} />
                </Box>
              ))}
            </Slider>

            {/* 오른쪽 버튼 */}
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                right: '-50px',
                transform: 'translateY(-50%)',
                zIndex: 2
              }}
              onClick={() => sliderRef.current.slickNext()}>
              <ArrowForwardIos />
            </IconButton>
          </Box>
        ) : (
          // 숙소 개수가 적으면 일반 리스트로 표시
          <Box sx={{display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap'}}>
            {accommodations.map(acc => (
              <Box key={acc._id} sx={{width: '300px'}}>
                <AccommodationCard accommodation={acc} />
              </Box>
            ))}
          </Box>
        )
      ) : (
        <Typography variant="body1" textAlign="center" sx={{mt: 4}}>
          조회수가 높은 숙소가 없습니다.
        </Typography>
      )}
    </Box>
  );
};

export default PopularAccommodations;
