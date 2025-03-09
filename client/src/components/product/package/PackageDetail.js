import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Divider,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// ★ 항공편 전체 조회 API
import {fetchFlights} from '../../../api/flight/flights';

import {getPackageById} from '../../../api/package/packageService';

const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ourrealtrip.shop/api';

const PackageDetail = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  // 패키지 상세 정보
  const [pkg, setPkg] = useState(null);
  // "상품 소개 더보기" 상태
  const [showAllImages, setShowAllImages] = useState(false);

  // 항공편 전체 목록
  const [, setAllFlights] = useState([]);

  // 자주 묻는 질문(FAQ) (예시)
  const [faqList] = useState([
    '카트비, 캐디피 / 미팅&샌딩비는 누구에게 지불하나요?',
    '현지에 오셔서 현지실장에게 지불 해주시면 됩니다^^',
    '다른친구랑 같이 올수있나요?',
    '단독투어로 조인 없이 움직이기 때문에 가능합니다.',
    '차량 호텔 골프장만 이용이 가능한가요?',
    '1일 12시간 기준으로 골프장 이용 후 남은시간 자유롭게 이용하시면 됩니다.\n<12시간 초과시 시간당 300바트의 추가금이 발생합니다>'
  ]);

  useEffect(() => {
    (async () => {
      try {
        // (1) 모든 항공편 문서를 먼저 불러온다
        const flightDocs = await fetchFlights();
        setAllFlights(flightDocs);

        // (2) 특정 패키지 조회
        const data = await getPackageById(id);

        // (3) pkg.flights를 순회하며 flightId를 실제 항공편 객체로 매칭
        if (data.flights && data.flights.length > 0) {
          const updatedFlights = data.flights.map(flightObj => {
            if (!flightObj.flightId) return flightObj;

            let flightIdStr = '';
            if (typeof flightObj.flightId === 'string') {
              // flightId가 문자열인 경우
              flightIdStr = flightObj.flightId;
            } else if (typeof flightObj.flightId === 'object') {
              // flightId가 객체인 경우
              flightIdStr = flightObj.flightId._id;
            }

            // flightDocs에서 찾기
            const foundDoc = flightDocs.find(doc => doc._id === flightIdStr);
            if (!foundDoc) return flightObj; // 문서를 못 찾으면 그대로 반환

            // flightObj.flightId를 foundDoc으로 교체
            return {
              ...flightObj,
              flightId: {
                ...foundDoc
              }
            };
          });
          data.flights = updatedFlights;
        }

        setPkg(data);
      } catch (err) {
        console.error('패키지 조회 실패:', err);
      }
    })();
  }, [id]);

  if (!pkg) {
    return <Typography>로딩 중...</Typography>;
  }

  // 추가 이미지 (두 번째 이후)
  const additionalImages = pkg.images && pkg.images.length > 1 ? pkg.images.slice(1) : [];

  // 결제 혜택
  const {discountRate = 0, price = 0, finalPrice = 0} = pkg;

  return (
    <Container maxWidth="md" sx={{py: 4}}>
      {/* 상단: 패키지 제목 / 설명 */}
      <Typography variant="h4" sx={{fontWeight: 'bold', mb: 1}}>
        {pkg.name}
      </Typography>
      {pkg.description && (
        <Typography variant="subtitle1" color="text.secondary" sx={{mb: 2}}>
          {pkg.description}
        </Typography>
      )}

      {/* 추가 정보 (최저가 보장, 즉시확정, 무이자 할부) */}
      <Box sx={{mb: 2, textAlign: 'left'}}>
        <Typography variant="body2" sx={{display: 'flex', alignItems: 'center', mb: 1}}>
          🏷️ <strong style={{marginLeft: '8px'}}>최저가 보장제</strong> - 차액의 두 배
          포인트 보상
        </Typography>
        <Typography variant="body2" sx={{display: 'flex', alignItems: 'center', mb: 1}}>
          ⚡ <strong style={{marginLeft: '8px'}}>즉시확정</strong> - 구매 즉시 예약 확정
        </Typography>
        <Typography variant="body2" sx={{display: 'flex', alignItems: 'center'}}>
          💳 <strong style={{marginLeft: '8px'}}>최대 12개월 무이자 할부</strong> 가능
        </Typography>
      </Box>

      {/* "상품 소개 더보기" 버튼 -> 추가 이미지 */}
      {additionalImages.length > 0 && (
        <Box sx={{mb: 3}}>
          <Box
            sx={{
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
              maxHeight: showAllImages ? 'none' : '400px'
            }}>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
              {additionalImages.map((img, index) => (
                <img
                  key={index}
                  src={`${SERVER_URL}/${img}`}
                  alt={`추가 이미지 ${index}`}
                  style={{
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              ))}
            </Box>

            {!showAllImages && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '150px',
                  background:
                    'linear-gradient(to bottom, rgba(255,255,255,0) 0%, white 100%)'
                }}
              />
            )}
          </Box>

          <Button
            type="button"
            onClick={() => setShowAllImages(prev => !prev)}
            sx={{
              display: 'block',
              margin: '20px auto 0',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              color: '#333',
              fontWeight: 'bold'
            }}>
            {showAllImages ? '상품 소개 접기' : '상품 소개 더보기'}
          </Button>
        </Box>
      )}

      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        패키지 상품 상세 정보
      </Typography>

      {/* 항공 정보 */}
      {pkg.flights && pkg.flights.length > 0 && (
        <Box sx={{mb: 2}}>
          <Typography variant="h6" sx={{fontWeight: 'bold'}}>
            항공
          </Typography>
          {pkg.flights.map((flightObj, idx) => {
            // 이제 flightObj.flightId가 실제 항공편 객체
            const flightDoc = flightObj.flightId;
            if (!flightDoc) return null;

            const seatsUsed = flightObj.seatsToUse || 1;
            return (
              <Box key={idx} sx={{ml: 2, mt: 1}}>
                <Typography variant="body2">
                  항공사: {flightDoc.airline} / 편명: {flightDoc.flightNumber}
                </Typography>
                <Typography variant="body2">
                  항공 가격: {flightDoc.price?.toLocaleString()}원 / 좌석 수: {seatsUsed}
                </Typography>
                {/* 출발 정보 */}
                {flightDoc.departure?.city && (
                  <Typography variant="body2">
                    출발: {flightDoc.departure.city}/{flightDoc.departure.airport} (
                    {flightDoc.departure.date} {flightDoc.departure.time})
                  </Typography>
                )}
                {/* 도착 정보 */}
                {flightDoc.arrival?.city && (
                  <Typography variant="body2">
                    도착: {flightDoc.arrival.city}/{flightDoc.arrival.airport} (
                    {flightDoc.arrival.date} {flightDoc.arrival.time})
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* 숙소 정보 */}
      {pkg.accommodations && pkg.accommodations.length > 0 && (
        <Box sx={{mb: 2}}>
          <Typography variant="h6" sx={{fontWeight: 'bold'}}>
            숙소
          </Typography>
          {pkg.accommodations.map(acc => (
            <Card key={acc._id} sx={{mb: 2}}>
              <CardContent>
                <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                  {acc.name}
                </Typography>
                {acc.rooms && acc.rooms.length > 0 ? (
                  acc.rooms.map(room => (
                    <Typography key={room._id} variant="body2" sx={{ml: 2}}>
                      - {room.name || '방 이름 없음'}:{' '}
                      {room.pricePerNight?.toLocaleString()}원/박
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ml: 2}}>
                    객실 정보 없음
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 투어 정보 */}
      {pkg.tours && pkg.tours.length > 0 && (
        <Box sx={{mb: 2}}>
          <Typography variant="h6" sx={{fontWeight: 'bold'}}>
            투어/티켓
          </Typography>
          {pkg.tours.map((tour, idx) => (
            <Typography key={idx} variant="body2" sx={{ml: 2, mt: 1}}>
              {tour.title || '투어 제목 없음'} /{' '}
              {tour.price ? `${tour.price.toLocaleString()}원` : '가격 정보 없음'}
            </Typography>
          ))}
        </Box>
      )}

      <Divider sx={{my: 3}} />

      {/* 포함 / 불포함 사항 */}
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        포함 · 불포함 사항
      </Typography>
      {/* 포함 사항 */}
      <Box sx={{mb: 3}}>
        <Typography variant="h6" sx={{fontWeight: 'bold', mb: 1}}>
          포함되어 있어요
        </Typography>
        {pkg.includedItems && pkg.includedItems.length > 0 ? (
          <List sx={{ml: 2}}>
            {pkg.includedItems.map((item, idx) => (
              <ListItem key={idx} disablePadding sx={{py: 0.5}}>
                <ListItemIcon sx={{minWidth: '30px'}}>
                  <CheckCircleOutlineIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ml: 2}}>
            없음
          </Typography>
        )}
      </Box>
      {/* 불포함 사항 */}
      <Box sx={{mb: 3}}>
        <Typography variant="h6" sx={{fontWeight: 'bold', mb: 1}}>
          불포함되어 있어요
        </Typography>
        {pkg.excludedItems && pkg.excludedItems.length > 0 ? (
          <List sx={{ml: 2}}>
            {pkg.excludedItems.map((item, idx) => (
              <ListItem key={idx} disablePadding sx={{py: 0.5}}>
                <ListItemIcon sx={{minWidth: '30px'}}>
                  <CheckCircleOutlineIcon fontSize="small" color="disabled" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ml: 2}}>
            없음
          </Typography>
        )}
      </Box>

      <Divider sx={{my: 3}} />

      {/* 필수 확인 사항 */}
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        필수 확인 사항
      </Typography>
      {pkg.essentialInfo && pkg.essentialInfo.length > 0 ? (
        <Box sx={{ml: 2}}>
          {pkg.essentialInfo.map((info, idx) => (
            <Typography key={idx} variant="body2" sx={{mb: 1}}>
              {info}
            </Typography>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ml: 2}}>
          필수 확인 사항이 없습니다.
        </Typography>
      )}

      <Divider sx={{my: 3}} />

      {/* 취소/환불 규정 */}
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        취소/환불 규정
      </Typography>
      {pkg.refundPolicy && pkg.refundPolicy.length > 0 ? (
        <Box sx={{ml: 2}}>
          {pkg.refundPolicy.map((rule, idx) => (
            <Typography key={idx} variant="body2" sx={{mb: 1}}>
              {rule}
            </Typography>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ml: 2}}>
          별도의 취소/환불 규정이 없습니다.
        </Typography>
      )}

      <Divider sx={{my: 3}} />

      {/* 자주 묻는 질문 (FAQ) */}
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        자주 묻는 질문
      </Typography>
      <Box sx={{ml: 2}}>
        {faqList.map((faq, idx) => (
          <Typography key={idx} variant="body2" sx={{mb: 1, whiteSpace: 'pre-line'}}>
            {faq}
          </Typography>
        ))}
      </Box>

      {/* 예약 및 결제 정보 (오른쪽 고정) */}
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '300px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          textAlign: 'center',
          zIndex: 1000,
          border: '1px solid #ddd'
        }}>
        {/* 일반가 표시 */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{fontWeight: 'bold', mb: 1}}>
          일반가
        </Typography>

        {/* 가격 정보 */}
        {discountRate > 0 ? (
          <Box>
            <Typography
              variant="h6"
              sx={{
                textDecoration: 'line-through',
                color: 'gray',
                fontSize: '12px'
              }}>
              {price.toLocaleString()}원
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: 'red',
                fontSize: '22px'
              }}>
              {finalPrice.toLocaleString()}원
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'blue',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
              (할인율 {discountRate}%)
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="h5"
            sx={{fontWeight: 'bold', color: 'red', fontSize: '22px'}}>
            {finalPrice.toLocaleString()}원
          </Typography>
        )}

        {/* 예약하기 버튼 */}
        <Button
          variant="contained"
          color="primary"
          sx={{
            width: '100%',
            fontSize: '18px',
            fontWeight: 'bold',
            mt: 2,
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#007aff',
            '&:hover': {backgroundColor: '#0066cc'}
          }}
          onClick={() => navigate(`/package/booking/${id}`)}>
          ⚡ 예약하기
        </Button>

        {/* 구매 후 즉시 확정 문구 */}
        <Typography
          variant="body2"
          sx={{
            color: 'gray',
            mt: 1,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          ⚡ 구매 후 즉시 확정됩니다.
          <span style={{marginLeft: '4px', cursor: 'pointer'}}>❓</span>
        </Typography>
      </Box>
    </Container>
  );
};

export default PackageDetail;
