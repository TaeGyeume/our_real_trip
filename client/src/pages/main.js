import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Box} from '@mui/material';
import UserList from '../components/tourTicket/UserList';
import PopularProductsSlider from '../components/views/PopularProductsSlider';
import ConsoleLogo from '../components/common/ConsoleLogo';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdBanner from '../components/ad/AdBanner';
import LocationCardSlider from '../components/common/LocationCardSlider';
import {locationData} from '../data/locationData';
import {mainBannerData} from '../data/bannerData';

const Main = () => {
  const navigate = useNavigate();

  // 카드 클릭 시 이동할 라우팅 예시
  const handleCardClick = id => {
    // 예: /products/seoul 로 이동
    navigate(`/location/${id}`);
  };

  return (
    <Box sx={{padding: 3}}>
      <ConsoleLogo />

      <LocationCardSlider locations={locationData} onCardClick={handleCardClick} />

      <AdBanner banners={mainBannerData} />

      {/* Flexbox 기반 레이아웃 적용 */}
      <div>
        <UserList showFilter={false} showAdBanner={false} />
      </div>

      <Box sx={{mt: 5}}>
        <PopularProductsSlider />
      </Box>
    </Box>
  );
};

export default Main;
