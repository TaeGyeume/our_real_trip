import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';

const Sidebar = ({activeSection, onSelectCategory}) => {
  const [sidebarTop, setSidebarTop] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // 스크롤 위치가 100px 이상이면 Sidebar가 따라 움직이도록 설정
      setSidebarTop(window.scrollY > 100 ? window.scrollY - 20 : 0); // 누가 수정했게? 이제 사이드바 다 보이지롱 ><
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{position: 'absolute', top: `${sidebarTop}px`, transition: 'top 0.3s ease'}}>
      <Tab.Container id="left-tabs-example" activeKey={activeSection || null}>
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              {/* 숙소 탭 */}
              <Nav.Item style={{whiteSpace: 'nowrap'}}>
                <Nav.Link
                  style={
                    activeSection === 'accommodations' ? activeTabStyle : defaultTabStyle
                  }
                  eventKey="accommodations"
                  onClick={() => onSelectCategory('accommodations')}>
                  🏨 숙소
                </Nav.Link>
              </Nav.Item>

              {/* 투어.티켓 탭 */}
              <Nav.Item style={{whiteSpace: 'nowrap'}}>
                <Nav.Link
                  style={
                    activeSection === 'tourTicket' ? activeTabStyle : defaultTabStyle
                  }
                  eventKey="tourTicket"
                  onClick={() => onSelectCategory('tourTicket')}>
                  🎟 투어.티켓
                </Nav.Link>
              </Nav.Item>

              {/* 여행용품 탭 */}
              <Nav.Item style={{whiteSpace: 'nowrap'}}>
                <Nav.Link
                  style={
                    activeSection === 'travelItem' ? activeTabStyle : defaultTabStyle
                  }
                  eventKey="travelItem"
                  onClick={() => onSelectCategory('travelItem')}>
                  🛍️ 여행용품
                </Nav.Link>
              </Nav.Item>

              {/* 쿠폰 관리 탭 */}
              <Nav.Item style={{whiteSpace: 'nowrap'}}>
                <Nav.Link
                  style={
                    activeSection === 'couponList' ? activeTabStyle : defaultTabStyle
                  }
                  onClick={() => navigate('/product/coupon/list')}>
                  🎫 쿠폰 관리
                </Nav.Link>
              </Nav.Item>

              <Nav.Item style={{whiteSpace: 'nowrap'}}>
                <Nav.Link
                  style={defaultTabStyle} // 기본 탭 스타일 사용
                  onClick={() => navigate('/product/package/create')}>
                  📦 패키지 생성
                </Nav.Link>
              </Nav.Item>

              <Nav.Item style={{whiteSpace: 'nowrap'}}>
                <Nav.Link
                  style={defaultTabStyle} // 기본 탭 스타일 사용
                  onClick={() => navigate('/flights/list')}>
                  ✈ 항공편 관리
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>
      </Tab.Container>
    </div>
  );
};

/* 선택된 탭 스타일 */
const activeTabStyle = {
  padding: '13px',
  backgroundColor: '#007bff',
  color: '#fff',
  fontWeight: 'bold',
  borderRadius: '5px'
};

/* 기본 탭 스타일 */
const defaultTabStyle = {
  padding: '13px',
  backgroundColor: 'transparent',
  color: '#000'
};

export default Sidebar;
