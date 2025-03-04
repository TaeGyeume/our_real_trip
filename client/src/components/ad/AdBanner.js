import React, {useState, useEffect} from 'react';
import {IconButton} from '@mui/material';
import {ChevronLeft, ChevronRight} from '@mui/icons-material';

const AdBanner = ({banners}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 다음 배너로 넘기기
  const handleNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
  };

  // 이전 배너로 넘기기
  const handlePrev = () => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
  };

  // 2초마다 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        margin: '20px auto 0',
        overflow: 'visible' //  부모 컨테이너는 visible 유지
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/*  배너를 감싸는 컨테이너 (배너만 hidden) */}
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden' //  배너만 hidden
        }}>
        {/* 배너 슬라이드 컨테이너 */}
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

      {/*  버튼을 배너 밖에서도 보이게 배치 */}
      <IconButton
        onClick={handlePrev}
        style={{
          position: 'absolute',
          top: '50%',
          left: '-24px', //  배너 밖으로 이동
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          boxShadow: '0px 4px 10px',
          zIndex: 20 //  버튼이 배너 위에 나타나도록 설정
        }}>
        <ChevronLeft />
      </IconButton>

      <IconButton
        onClick={handleNext}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-24px', //  배너 밖으로 이동
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          boxShadow: '0px 4px 10px',
          zIndex: 20 //  버튼이 배너 위에 나타나도록 설정
        }}>
        <ChevronRight />
      </IconButton>

      {/* 페이지 표시 */}
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
          zIndex: 20 //  페이지 표시도 배너 위로
        }}>
        {currentIndex + 1}/{banners.length}
      </div>
    </div>
  );
};

export default AdBanner;
