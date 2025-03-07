// src/components/common/CustomArrows.jsx
import React from 'react';
import {IconButton} from '@mui/material';
import {ChevronLeft, ChevronRight} from '@mui/icons-material';

/**
 * @param {object} props
 * @param {boolean} props.isHovered - 슬라이더에 마우스가 올라왔는지 여부
 * @param {function} props.onClick  - 클릭 시 동작(react-slick가 넘겨줌)
 */
export function PrevArrow(props) {
  const {onClick, isHovered, style} = props;

  return (
    <IconButton
      onClick={onClick}
      style={{
        ...style,
        position: 'absolute',
        top: '50%',
        left: '-14px',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex', // 아이콘 중앙 정렬
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0, // 기본 패딩 제거
        boxShadow: '0px 4px 10px',
        transition: 'opacity 0.3s ease-in-out',
        zIndex: 20,
        cursor: 'pointer',
        opacity: isHovered ? 1 : 0 // 호버 시 나타나도록
      }}>
      <ChevronLeft sx={{fontSize: '1.5rem'}} />
    </IconButton>
  );
}

export function NextArrow(props) {
  const {onClick, isHovered, style} = props;

  return (
    <IconButton
      onClick={onClick}
      style={{
        ...style,
        position: 'absolute',
        top: '50%',
        right: '5px',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        boxShadow: '0px 4px 10px',
        transition: 'opacity 0.3s ease-in-out',
        zIndex: 20,
        cursor: 'pointer',
        opacity: isHovered ? 1 : 0
      }}>
      <ChevronRight sx={{fontSize: '1.5rem'}} />
    </IconButton>
  );
}
