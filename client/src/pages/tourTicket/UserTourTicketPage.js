import React from 'react';
import {Routes, Route} from 'react-router-dom';
import UserList from '../../components/tourTicket/UserList';
import UserDetail from '../../components/tourTicket/UserDetail';

const UserTourTicketPage = () => {
  return (
    <Routes>
      <Route path="/list" element={<UserList />} />
      <Route path="/list/:id" element={<UserDetail />} />
    </Routes>
  );
};

export default UserTourTicketPage;
