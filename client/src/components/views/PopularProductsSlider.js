import React, {useEffect, useState} from 'react';
import {fetchPopularProducts} from '../../api/views/viewsService';
import Slider from 'react-slick';
import ProductCard from './PopularProductsCard';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const PopularProductsSlider = () => {
  const [products, setProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const data = await fetchPopularProducts(8);
        if (isMounted) setProducts(data);
      } catch (error) {
        console.error('인기 상품 불러오기 실패:', error);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSlides = Math.ceil(products.length / 4);

  const PrevArrow = ({onClick}) =>
    currentSlide > 0 && (
      <button className="custom-arrow custom-prev" onClick={onClick}>
        ⬅
      </button>
    );

  const NextArrow = ({onClick}) =>
    currentSlide < totalSlides - 1 && (
      <button className="custom-arrow custom-next" onClick={onClick}>
        ➡
      </button>
    );

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    autoplay: false,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
    responsive: [
      {breakpoint: 1024, settings: {slidesToShow: 3, slidesToScroll: 3}},
      {breakpoint: 768, settings: {slidesToShow: 2, slidesToScroll: 2}},
      {breakpoint: 480, settings: {slidesToShow: 1, slidesToScroll: 1}}
    ]
  };

  return (
    <div className="popular-products-container">
      <h2 className="section-title">다른 회원이 많이 본 상품</h2>
      <Slider {...settings} className="popular-products-slider">
        {products.map(product => (
          <div key={product._id} style={{margin: '0 10px'}}>
            <ProductCard product={product} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default PopularProductsSlider;
