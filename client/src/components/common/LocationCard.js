import React from 'react';
import {Card, CardActionArea, CardMedia, Box, Typography, Button} from '@mui/material';

const LocationCard = ({title, image, onClick}) => {
  return (
    <Card
      sx={{
        width: 280, // 카드 너비 (원하는 크기로 조정)
        borderRadius: 2, // 모서리 둥글게
        overflow: 'hidden', // 둥근 모서리에 맞게 내용 잘림
        position: 'relative', // 오버레이(absolute) 배치를 위해 relative 설정
        cursor: 'pointer',
        marginBottom: 4,
        ml: 1
      }}
      onClick={onClick}>
      <CardActionArea
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          '&:hover .zoom-image': {
            transform: 'scale(1.1)'
          }
        }}>
        {/* 실제 배경 이미지 */}
        <CardMedia
          component="img"
          image={image}
          alt={title}
          sx={{
            width: '100%',
            height: 360,
            objectFit: 'cover',
            transition: 'transform 3s ease'
          }}
          // className을 통해 hover 시 transform 적용 대상 지정
          className="zoom-image"
        />
        {/* 오버레이(그라디언트) - 필요하다면 추가 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))'
          }}
        />

        {/* 텍스트와 버튼을 오버레이로 배치 */}
        <Box
          sx={{
            position: 'absolute',
            top: 45,
            left: 20,
            color: 'white'
          }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '2rem', // 예: 좀 더 크게
              fontWeight: 700, // 숫자로도 굵기 조절 가능 (700은 bold와 비슷함)
              letterSpacing: '1px', // 글자 간격 넓게
              lineHeight: 1.2
            }}>
            {title}
          </Typography>
        </Box>

        {/* 둘러보기 버튼: 카드 하단 왼쪽에 배치 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16
          }}>
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: 'white',
              color: 'black',
              '&:hover': {
                backgroundColor: '#f2f2f2'
              }
            }}>
            둘러보기
          </Button>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default LocationCard;
