// src/components/AdSlider.js
import React, {useState, useEffect, useCallback} from 'react';
import {IconButton} from '@mui/material';
import {ChevronLeft, ChevronRight} from '@mui/icons-material';

export default function AdSlider() {
  // 광고 이미지 목록 (public 폴더 기준 경로)
  // "banner.image" 형태로 맞추기 위해 객체 배열로 작성
  const adBanners = [
    {image: '/images/pkgad/1pkg.png'},
    {image: '/images/pkgad/2pkg.png'},
    {image: '/images/pkgad/3pkg.png'},
    {image: '/images/pkgad/4pkg.png'},
    {image: '/images/pkgad/5pkg.png'},
    {image: '/images/pkgad/6pkg.png'},
    {image: '/images/pkgad/7pkg.png'},
    {image: '/images/pkgad/8pkg.png'},
    {image: '/images/pkgad/9pkg.png'},
    {image: '/images/pkgad/10pkg.png'}
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 다음 배너로
  const handleNext = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % adBanners.length);
  }, [adBanners.length]);

  // 이전 배너로
  const handlePrev = useCallback(() => {
    setCurrentIndex(prevIndex =>
      prevIndex === 0 ? adBanners.length - 1 : prevIndex - 1
    );
  }, [adBanners.length]);

  // 5초마다 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
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
      {/* 슬라이드 컨테이너 */}
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
        {/* 가로로 배너를 늘어놓고, transform으로 이동 */}
        <div
          style={{
            display: 'flex',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.5s ease-in-out'
          }}>
          {adBanners.map((banner, index) => (
            <div key={index} style={{width: '100%', flexShrink: 0}}>
              <img
                src={banner.image}
                alt={`ad-${index}`}
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

      {/* 왼쪽 버튼 */}
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

      {/* 오른쪽 버튼 */}
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

      {/* 현재 배너 인덱스 / 총 개수 */}
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
        {currentIndex + 1}/{adBanners.length}
      </div>
    </div>
  );
}
