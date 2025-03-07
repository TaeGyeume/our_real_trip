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
import {styled} from '@mui/material/styles';
import {getPackageById} from '../../../api/package/packageService';

const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ourrealtrip.shop/api/uploads';

// 상단 배너 이미지 스타일
// const BannerImage = styled('img')({
//   width: '100%',
//   height: '400px',
//   objectFit: 'cover',
//   objectPosition: 'center'
// });

const PackageDetail = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [showAllImages, setShowAllImages] = useState(false); // "상품 소개 더보기" 상태

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
        const data = await getPackageById(id);
        setPkg(data);
      } catch (err) {
        console.error('패키지 조회 실패:', err);
      }
    })();
  }, [id]);

  if (!pkg) {
    return <Typography>로딩 중...</Typography>;
  }

  // 첫 번째 이미지를 상단 배너로 사용
  const bannerImage =
    pkg.images && pkg.images.length > 0
      ? `${SERVER_URL}/${pkg.images[0]}`
      : '/default-image.jpg';

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
          {/* 상품 소개 더보기 버튼 -> 추가 이미지 */}
          {additionalImages.length > 0 && (
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
          )}

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
            const {flightId, seatsToUse} = flightObj;
            if (!flightId) return null;
            return (
              <Box key={idx} sx={{ml: 2, mt: 1}}>
                <Typography variant="body2">
                  항공사: {flightId.airline} / 편명: {flightId.flightNumber}
                </Typography>
                <Typography variant="body2">
                  항공 가격: {flightId.price?.toLocaleString()}원 / 좌석 수: {seatsToUse}
                </Typography>
                {flightId.departureDate && (
                  <Typography variant="body2">
                    출발일: {flightId.departureDate}
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

      {/* 투어 정보 (있다면) */}
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

      {/* 예약하기 버튼 */}
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '200px',
          padding: '16px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          zIndex: 1000 // 다른 요소보다 위에 표시되도록 설정
        }}>
        {/* 결제 혜택 */}
        <Box sx={{mb: 2}}>
          <Typography variant="body2" color="text.secondary">
            결제 혜택
          </Typography>
          {discountRate > 0 ? (
            <Box>
              <Typography
                variant="h6"
                sx={{textDecoration: 'line-through', color: 'gray'}}>
                {price.toLocaleString()}원
              </Typography>
              <Typography variant="h5" sx={{fontWeight: 'bold', color: 'red'}}>
                {finalPrice.toLocaleString()}원
              </Typography>
              <Typography variant="caption" sx={{color: 'blue'}}>
                (할인율 {discountRate}%)
              </Typography>
            </Box>
          ) : (
            <Typography variant="h5" sx={{fontWeight: 'bold', color: 'red'}}>
              {finalPrice.toLocaleString()}원
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            sx={{width: '100%', fontSize: '16px', fontWeight: 'bold'}}
            onClick={() => navigate(`/package/booking/${id}`)}>
            예약하기
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PackageDetail;
