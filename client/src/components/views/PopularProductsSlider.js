import React, {useEffect, useState, useRef} from 'react';
import {fetchPopularProducts} from '../../api/views/viewsService';
import Slider from 'react-slick';
import ProductCard from './PopularProductsCard';
import {Box, Typography, CircularProgress, IconButton} from '@mui/material';
import {ArrowBackIos, ArrowForwardIos} from '@mui/icons-material';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './styles/PopularProductsSlider.css';

const PopularProductsSlider = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchPopularProducts(8);
        setProducts(data);
      } catch (error) {
        console.error('인기 상품 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4, // 항상 4개 표시 (변경)
    slidesToScroll: 2,
    arrows: false, // 기본 화살표 제거
    variableWidth: false,
    centerMode: false, // 중앙 정렬 비활성화
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
    <Box
      sx={{
        mt: 5,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
      <Typography variant="h5" fontWeight="bold" sx={{mb: 2}}>
        다른 회원님이 많이 본 상품
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : products.length > 0 ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            display: 'flex',
            justifyContent: 'center'
          }}>
          <Box sx={{position: 'relative', width: '100%'}}>
            {/* 좌측 네비게이션 버튼 */}
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                left: '-50px',
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
              onClick={() => sliderRef.current.slickPrev()}>
              <ArrowBackIos />
            </IconButton>

            {/* Slick Slider */}
            <Slider ref={sliderRef} {...settings} className="custom-slider">
              {products.map(product => (
                <Box key={product._id} sx={{px: 2}}>
                  {' '}
                  {/* 간격 추가 */}
                  <ProductCard product={product} />
                </Box>
              ))}
            </Slider>

            {/* 우측 네비게이션 버튼 */}
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                right: '-50px',
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
              onClick={() => sliderRef.current.slickNext()}>
              <ArrowForwardIos />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Typography color="text.secondary">인기 상품이 없습니다.</Typography>
      )}
    </Box>
  );
};

export default PopularProductsSlider;
