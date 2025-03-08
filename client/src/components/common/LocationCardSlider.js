// src/components/common/LocationCardSlider.jsx
import React, {useState} from 'react';
import Slider from 'react-slick';
import {Box} from '@mui/material';
import LocationCard from './LocationCard';
import {PrevArrow, NextArrow} from './CustomArrows';

const LocationCardSlider = ({locations, onCardClick}) => {
  const [isHovered, setIsHovered] = useState(false);

  // react-slick slider 설정
  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 2,
    // 커스텀 화살표에 isHovered
    prevArrow: <PrevArrow isHovered={isHovered} />,
    nextArrow: <NextArrow isHovered={isHovered} />,
    responsive: [
      {breakpoint: 1200, settings: {slidesToShow: 3}},
      {breakpoint: 800, settings: {slidesToShow: 2}},
      {breakpoint: 480, settings: {slidesToShow: 1}}
    ]
  };

  return (
    <Box
      sx={{mt: -1, position: 'relative', gap: 0.5}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <Slider {...settings}>
        {locations.map(loc => (
          <Box key={loc.id} sx={{p: 1}}>
            <LocationCard
              title={loc.title}
              image={loc.image}
              onClick={() => onCardClick(loc.id)}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default LocationCardSlider;
