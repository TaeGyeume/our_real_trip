import React, {useState} from 'react';
import {useParams} from 'react-router-dom';
import {Box, Typography, Button} from '@mui/material';
import {locationData} from '../../data/locationData';
import TourTicketList from '../../components/mainbodycard/TourTicketList';
import {useNavigate} from 'react-router-dom';

const LocationDetailPage = () => {
  const {id} = useParams();
  const locationInfo = locationData.find(loc => loc.id === id);

  // 탭 상태: 기본값은 "투어·티켓" 탭이라고 가정
  const [activeTab, setActiveTab] = useState('tour');
  const navigate = useNavigate();

  if (!locationInfo) {
    return (
      <Box sx={{p: 3}}>
        <Typography variant="h5" color="error">
          해당 지역 정보를 찾을 수 없습니다.
        </Typography>
      </Box>
    );
  }

  // 탭 클릭 시 호출되는 함수
  const handleTabClick = tabName => {
    setActiveTab(tabName);
  };

  return (
    <Box sx={{width: '100%', mb: 4}}>
      {/* 1) 상단 Hero 영역 */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '300px',
          backgroundImage: `url(${locationInfo.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        {/* 배경 위에 반투명 오버레이 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0,0,0,0.4)'
          }}
        />
        {/* Hero 안의 텍스트 (나라 > 도시) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            color: 'white'
          }}>
          <Typography variant="body2" sx={{mb: 1}}>
            {locationInfo.country} &gt; {locationInfo.title}
          </Typography>
          <Typography variant="h3" sx={{fontWeight: 'bold'}}>
            {locationInfo.title}
          </Typography>
        </Box>
      </Box>

      {/* 2) 카테고리 탭(버튼) 섹션 */}
      <Box sx={{p: 2}}>
        <Box
          sx={{
            display: 'flex',
            gap: 5,
            justifyContent: 'center',
            borderBottom: '1px solid #ddd',
            pb: 1,
            mb: 2
          }}>
          {/* 투어·티켓 탭 */}
          <Button
            variant="text"
            onClick={() => handleTabClick('tour')}
            sx={{
              color: activeTab === 'tour' ? '#0288d1' : 'black',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 0,
              minWidth: 80,
              position: 'relative',
              '&:hover': {
                backgroundColor: 'white'
              },
              '& .underline': {
                opacity: activeTab === 'tour' ? 1 : 0,
                transition: 'opacity 0.3s'
              },
              '&:hover .underline': {
                opacity: 1
              }
            }}>
            <Box
              component="img"
              src="/images/category/tourticket.png"
              alt="투어아이콘"
              sx={{width: 48, height: 48, mb: 1}}
            />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                // activeTab === 'tour' 일 때만 파란색
                color: activeTab === 'tour' ? '#0288d1' : 'inherit'
              }}>
              투어·티켓
            </Typography>
            <Box
              className="underline"
              sx={{
                position: 'absolute',
                bottom: -8,
                left: '-10%',
                width: '120%',
                height: '2px',
                bgcolor: '#0288d1'
              }}
            />
          </Button>

          {/* 숙소 탭 */}
          <Button
            variant="text"
            onClick={() =>
              navigate(
                `/accommodations/results?city=${encodeURIComponent(locationInfo.title)}`
              )
            }
            sx={{
              // activeTab 관련 스타일은 그대로 두거나 필요에 따라 조정
              color: 'black',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 0,
              minWidth: 80,
              position: 'relative',
              '&:hover': {
                backgroundColor: 'white'
              },
              '& .underline': {
                opacity: activeTab === 'hotel' ? 1 : 0,
                transition: 'opacity 0.3s'
              },
              '&:hover .underline': {
                opacity: 1
              }
            }}>
            <Box
              component="img"
              src="/images/category/accommodation.png"
              alt="숙소아이콘"
              sx={{width: 48, height: 48, mb: 1}}
            />
            <Typography variant="body1" sx={{fontWeight: 'bold'}}>
              숙소
            </Typography>
            <Box
              className="underline"
              sx={{
                position: 'absolute',
                bottom: -8,
                left: '-10%',
                width: '120%',
                height: '2px',
                bgcolor: '#0288d1'
              }}
            />
          </Button>

          {/* 항공권 탭 */}
          <Button
            variant="text"
            onClick={() => handleTabClick('flight')}
            sx={{
              color: activeTab === 'flight' ? '#0288d1' : 'black',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 0,
              minWidth: 80,
              position: 'relative',
              '&:hover': {
                backgroundColor: 'white'
              },
              '& .underline': {
                opacity: activeTab === 'flight' ? 1 : 0,
                transition: 'opacity 0.3s'
              },
              '&:hover .underline': {
                opacity: 1
              }
            }}>
            <Box
              component="img"
              src="/images/category/flight.png"
              alt="항공아이콘"
              sx={{width: 48, height: 48, mb: 1}}
            />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                color: activeTab === 'flight' ? '#0288d1' : 'inherit'
              }}>
              항공권
            </Typography>
            <Box
              className="underline"
              sx={{
                position: 'absolute',
                bottom: -8,
                left: '-10%',
                width: '120%',
                height: '2px',
                bgcolor: '#0288d1'
              }}
            />
          </Button>
        </Box>
      </Box>

      {/* 3) 탭 내용 (activeTab에 따라 다른 섹션 렌더링) */}
      <Box sx={{p: 2, mt: 3}}>
        {activeTab === 'tour' && (
          <Box>
            <Typography variant="h6" sx={{mb: 2}}>
              투어·티켓 상품 목록
            </Typography>
            {/* 투어·티켓 관련 컴포넌트 or 데이터 */}
            <Typography variant="body2">
              <TourTicketList location={locationInfo.title} />
            </Typography>
          </Box>
        )}

        {activeTab === 'hotel' && (
          <Box>
            <Typography variant="h6" sx={{mb: 2}}>
              숙소 목록
            </Typography>
            {/* 숙소 관련 컴포넌트 or 데이터 */}
            <Typography variant="body2">
              여기에 숙소 목록(예: 호텔, 펜션, 게스트하우스 등)을 보여줍니다.
            </Typography>
          </Box>
        )}

        {activeTab === 'flight' && (
          <Box>
            <Typography variant="h6" sx={{mb: 2}}>
              항공권 정보
            </Typography>
            {/* 항공권 관련 컴포넌트 or 데이터 */}
            <Typography variant="body2">
              여기에 항공권 검색 또는 추천 정보를 보여줍니다.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LocationDetailPage;
