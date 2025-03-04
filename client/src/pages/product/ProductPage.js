import React, {useRef, useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import Sidebar from '../../components/Sidebar';
import TourTicketList from '../../components/product/tourTicket/TourTicketList';
import AccommodationList from '../../components/product/accommodations/AccommodationList';
import TravelItemListPage from '../../components/product/travelItems/TravelItemList';
import PackageList from '../../pages/product/packges/PackageList';

import {Button} from '@mui/material';
import SendNotificationModal from '../../components/product/notification/SendNotificationModal';
import {useAuthStore} from '../../store/authStore';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSquarePlus} from '@fortawesome/free-solid-svg-icons';

const ProductPage = () => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const accommodationsRef = useRef(null);
  const tourTicketRef = useRef(null);
  const travelItemRef = useRef(null);
  const packageRef = useRef(null);

  const {user} = useAuthStore();

  const scrollToSection = section => {
    const sectionRefs = {
      accommodations: accommodationsRef,
      tourTicket: tourTicketRef,
      travelItem: travelItemRef,
      package: packageRef
    };

    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({behavior: 'smooth'});
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setActiveSection(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{display: 'flex', position: 'relative'}}>
      <Sidebar activeSection={activeSection} onSelectCategory={scrollToSection} />

      <div style={{padding: '20px', flex: 1}}>
        {/* 알림 전송 버튼 (관리자만 보임) */}
        {user?.roles.includes('admin') && (
          <div style={{textAlign: 'right', marginBottom: '20px', marginRight: '20px'}}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setModalOpen(true)}>
              전체 알림 보내기
            </Button>
          </div>
        )}

        <div id="accommodations" ref={accommodationsRef} style={sectionStyle}>
          <div style={headerContainerStyle}>
            <FontAwesomeIcon
              icon={faSquarePlus}
              onClick={() => navigate('/product/accommodations/list')}
              style={plusButtonStyle}
            />
          </div>
          <AccommodationList limit={3} />
        </div>

        <div id="tourTicket" ref={tourTicketRef} style={sectionStyle}>
          <div style={headerContainerStyle}>
            <FontAwesomeIcon
              icon={faSquarePlus}
              onClick={() => navigate('/product/tourTicket/list')}
              style={plusButtonStyle}
            />
          </div>
          <TourTicketList />
        </div>

        <div id="travelItem" ref={travelItemRef} style={sectionStyle}>
          <div style={headerContainerStyle}>
            <FontAwesomeIcon
              icon={faSquarePlus}
              onClick={() => navigate('/product/travelItems/list')}
              style={plusButtonStyle}
            />
          </div>
          <TravelItemListPage limit={3} />
        </div>

        <div id="package" ref={packageRef} style={sectionStyle}>
          <div style={headerContainerStyle}>
            <FontAwesomeIcon
              icon={faSquarePlus}
              onClick={() => navigate('/product/packages/list')}
              style={plusButtonStyle}
            />
          </div>
          <PackageList limit={3} />
        </div>
      </div>
      {/* 알림 전송 모달 추가 */}
      <SendNotificationModal open={modalOpen} handleClose={() => setModalOpen(false)} />
    </div>
  );
};

const sectionStyle = {
  border: '1px solid #ddd',
  padding: '20px',
  marginBottom: '20px',
  marginLeft: '150px',
  position: 'auto',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9'
};

const headerContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative'
};

const plusButtonStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  // backgroundColor: '#007bff',
  // color: '#fff',
  border: 'none',
  // borderRadius: '50%',
  width: '30px',
  height: '30px',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
  // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
};

export default ProductPage;
