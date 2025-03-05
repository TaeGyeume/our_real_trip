import React from 'react';
import {Routes, Route} from 'react-router-dom';
import UserList from '../../components/tourTicket/UserList';
import UserDetail from '../../components/tourTicket/UserDetail';
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
      <Route path="/list" element={<UserList />} />
      <Route path="/list/:id" element={<UserDetail />} />
    </Routes>
  );
};

export default UserTourTicketPage;
