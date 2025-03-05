import React from 'react';
import {Routes, Route} from 'react-router-dom';
import TourTicketList from '../../../components/product/tourTicket/TourTicketList';
import TourTicketDetail from '../../../components/product/tourTicket/TourTicketDetail';
import TourTicketModify from '../../../components/product/tourTicket/TourTicketModify';
import TourTicketForm from '../../../components/product/tourTicket/TourTicketForm';

const AdminTourTicketPage = () => {
  return (
    <Routes>
      <Route path="/product/list" element={<TourTicketList />} />
      <Route path="/product/list/:id" element={<TourTicketDetail />} />
      <Route path="/product/new" element={<TourTicketForm />} />
      <Route path="/product/modify/:id" element={<TourTicketModify />} />
    </Routes>
  );
};

export default AdminTourTicketPage;
