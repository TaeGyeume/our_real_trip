import React from 'react';
import UserList from '../components/tourTicket/UserList';
import PopularProductsSlider from '../components/views/PopularProductsSlider';
import ConsoleLogo from '../components/common/ConsoleLogo';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdBanner from '../components/ad/AdBanner';

const bannerData = [
  {
    image: '/images/ad/tourticket1.png'
  },
  {
    image: '/images/ad/tourticket2.png'
  },
  {
    image: '/images/ad/tourticket3.png'
  },
  {
    image: '/images/ad/tourticket4.png'
  },
  {
    image: '/images/ad/main1.png'
  },
  {
    image: '/images/ad/main2.png'
  },
  {
    image: '/images/ad/accommodation1.jpg'
  },
  {
    image: '/images/ad/accommodation2.png'
  },
  {
    image: '/images/ad/accommodation3.png'
  },
  {
    image: '/images/ad/accommodation4.jpg'
  },
  {
    image: '/images/ad/air1.png'
  },
  {
    image: '/images/ad/air2.png'
  },
  {
    image: '/images/ad/air3.png'
  },
  {
    image: '/images/ad/air4.png'
  }
];

const Main = () => {
  return (
    <div className="container mt-5">
      <ConsoleLogo />
      <h2 className="text-center mb-4">메인페이지입니다</h2>

      <AdBanner banners={bannerData} />

      {/* Flexbox 기반 레이아웃 적용 */}
      <div className="main-layout">
        {/* 메인 컨텐츠 */}

        <div>
          <UserList showFilter={false} showAdBanner={false} />
        </div>
        <div>
          <PopularProductsSlider />
        </div>
      </div>
    </div>
  );
};

export default Main;
