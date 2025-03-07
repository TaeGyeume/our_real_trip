import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Box} from '@mui/material';
// import UserList from '../components/tourTicket/UserList';
import PopularProductsSlider from '../components/views/PopularProductsSlider';
import ConsoleLogo from '../components/common/ConsoleLogo';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdBanner from '../components/ad/AdBanner';
import LocationCardSlider from '../components/common/LocationCardSlider';

const bannerData = [
  {image: '/images/ad/tourticket1.png'},
  {image: '/images/ad/tourticket2.png'},
  {image: '/images/ad/tourticket3.png'},
  {image: '/images/ad/tourticket4.png'},
  {image: '/images/ad/main1.png'},
  {image: '/images/ad/main2.png'},
  {image: '/images/ad/accommodation1.jpg'},
  {image: '/images/ad/accommodation2.png'},
  {image: '/images/ad/accommodation3.png'},
  {image: '/images/ad/accommodation4.jpg'},
  {image: '/images/ad/air1.png'},
  {image: '/images/ad/air2.png'},
  {image: '/images/ad/air3.png'},
  {image: '/images/ad/air4.png'}
];

// 예시 카드 데이터
const locationData = [
  {
    id: 'seoul',
    title: '서울',
    image: '/images/locationcard/seoul.jpg',
    description: '도시의 화려함을 즐겨보세요!'
  },
  {
    id: 'tokyo',
    title: '도쿄',
    image: '/images/locationcard/tokyo2.jpg',
    description: '휴양지의 여유를 느껴보세요!'
  },
  {
    id: 'newyork',
    title: '뉴욕',
    image: '/images/locationcard/newyork.jpg',
    description: '휴양지의 여유를 느껴보세요!'
  },
  {
    id: 'paris',
    title: '파리',
    image: '/images/locationcard/paris.jpg',
    description: '빅벤과 함께 영국의 역사와 문화를'
  },
  {
    id: 'jeju',
    title: '제주',
    image: '/images/locationcard/jeju.jpg',
    description: '휴양지의 여유를 느껴보세요!'
  },
  {
    id: 'london',
    title: '런던',
    image: '/images/locationcard/london.jpg',
    description: '바다와 산이 함께 있는 힐링 여행지'
  },
  {
    id: 'bangkok',
    title: '방콕',
    image: '/images/locationcard/bangkok.jpg',
    description: '휴양지의 여유를 느껴보세요!'
  },
  {
    id: 'beijing',
    title: '베이징',
    image: '/images/locationcard/beijing.jpg',
    description: '휴양지의 여유를 느껴보세요!'
  }
];

const Main = () => {
  const navigate = useNavigate();

  // 카드 클릭 시 이동할 라우팅 예시
  const handleCardClick = id => {
    // 예: /products/seoul 로 이동
    navigate(`/products/${id}`);
  };

  return (
    <Box sx={{padding: 3}}>
      <ConsoleLogo />
      {/* <Typography variant="h4" align="center" gutterBottom>
        메인페이지입니다
      </Typography> */}

      <LocationCardSlider locations={locationData} onCardClick={handleCardClick} />

      <AdBanner banners={bannerData} />

      {/* Flexbox 기반 레이아웃 적용 */}
      {/* <div className="main-layout"> */}
      {/* 메인 컨텐츠 */}
      {/* <div className="main-content">
          <h3>지역 필수 티켓</h3>
          <UserList />
        </div> */}
      <Box sx={{mt: 5}}>
        <PopularProductsSlider />
      </Box>
    </Box>
  );
};

export default Main;
