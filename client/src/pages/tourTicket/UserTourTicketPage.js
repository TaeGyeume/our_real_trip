import React from 'react';
import {Routes, Route} from 'react-router-dom';
import TourTicketList from '../../components/tourTicket/TourTicketList';
import TourTicketDetail from '../../components/tourTicket/TourTicketDetail';
import AdBanner from '../../components/ad/AdBanner';

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
  }
];

const UserTourTicketPage = () => {
  return (
    <Routes>
      <Route
        path="/list"
        element={
          <div>
            <AdBanner banners={bannerData} />
            <TourTicketList />
          </div>
        }
      />
      <Route path="/list/:id" element={<TourTicketDetail />} />
    </Routes>
  );
};

export default UserTourTicketPage;
