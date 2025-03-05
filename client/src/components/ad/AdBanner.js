import React, {useState, useEffect, useCallback} from 'react';
import {IconButton} from '@mui/material';
import {ChevronLeft, ChevronRight} from '@mui/icons-material';

const AdBanner = ({banners}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // handleNext를 useCallback으로 감싸서 의존성을 안정화
  const handleNext = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
  }, [banners.length]);

  // 5초마다 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
    // handleNext를 의존성에 넣어줌
  }, [handleNext]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        margin: '20px auto 0',
        overflow: 'visible'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
        <div
          style={{
            display: 'flex',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.5s ease-in-out'
          }}>
          {banners.map((banner, index) => (
            <div key={index} style={{width: '100%', flexShrink: 0}}>
              <img
                src={banner.image}
                alt="광고 배너"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <IconButton
        onClick={handlePrev}
        style={{
          position: 'absolute',
          top: '50%',
          left: '-24px',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          boxShadow: '0px 4px 10px',
          zIndex: 20
        }}>
        <ChevronLeft />
      </IconButton>

      <IconButton
        onClick={handleNext}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-24px',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          boxShadow: '0px 4px 10px',
          zIndex: 20
        }}>
        <ChevronRight />
      </IconButton>

      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '15px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '12px',
          padding: '4px 8px',
          fontSize: '14px',
          zIndex: 20
        }}>
        {currentIndex + 1}/{banners.length}
      </div>
    </div>
  );
};

export default AdBanner;
