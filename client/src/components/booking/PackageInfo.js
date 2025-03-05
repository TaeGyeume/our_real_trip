import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, Typography, Box} from '@mui/material';

/**
 * departure, arrival가 객체일 경우 문자열 변환
 */
const formatLocationData = data => {
  if (!data || typeof data !== 'object') {
    return '정보 없음';
  }
  const {airport, city, date, time} = data;
  // 예: "김포공항/GMP (2025-03-03T17:00:00.000Z 1000)"
  return `${city || '도시정보 없음'}/${airport || '공항정보 없음'} (${date || ''} ${time || ''})`;
};

const PackageInfo = ({booking}) => {
  const navigate = useNavigate();

  // 패키지 상세 페이지로 이동
  const handlePackageClick = packageItem => {
    if (!packageItem?._id) return;
    // 예: "/package/:id" 로 이동
    navigate(`/package/${packageItem._id}`);
  };

  // 패키지 정보가 없으면 표시하지 않음
  if (!booking.packages || booking.packages.length === 0) return null;

  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        패키지 예약 정보
      </Typography>

      {booking.packages.map(pkg => (
        <Card
          key={pkg._id}
          sx={{
            p: 2,
            mb: 2,
            cursor: 'pointer',
            boxShadow: 3,
            borderRadius: 2,
            transition: '0.3s',
            '&:hover': {boxShadow: 6}
          }}
          onClick={() => handlePackageClick(pkg)}>
          <CardContent>
            {/* 패키지 기본 정보 */}
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
              패키지명 <Typography component="span">{pkg.name || '정보 없음'}</Typography>
            </Typography>
            <Typography variant="body2" sx={{color: 'gray', mb: 2}}>
              {pkg.description || '패키지 설명 없음'}
            </Typography>

            {/* 숙소 정보 */}
            {pkg.accommodations?.length > 0 && (
              <Box sx={{mt: 2}}>
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                  포함된 숙소
                </Typography>
                {pkg.accommodations.map(acc => (
                  <Box key={acc._id} sx={{ml: 2, mb: 1}}>
                    <Typography variant="body2">
                      - {acc.name || '숙소 정보 없음'}
                    </Typography>
                    {acc.address && (
                      <Typography variant="caption" sx={{ml: 4, display: 'block'}}>
                        주소: {acc.address}
                      </Typography>
                    )}
                    {/* 룸 정보가 populate 되어 있다면 여기서 표시 */}
                    {acc.rooms?.length > 0 ? (
                      acc.rooms.map(room => (
                        <Typography
                          key={room._id}
                          variant="caption"
                          sx={{ml: 4, display: 'block'}}>
                          객실: {room.name || '방 정보 없음'} -{' '}
                          {room.pricePerNight
                            ? `${room.pricePerNight.toLocaleString()}원/박`
                            : '가격 정보 없음'}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="caption" sx={{ml: 4}}>
                        룸 정보 없음
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* 항공 정보 */}
            {pkg.flights?.length > 0 && (
              <Box sx={{mt: 2}}>
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                  포함된 항공편
                </Typography>
                {pkg.flights.map((flightObj, index) => {
                  // flightObj = { flightId: {...}, seatsToUse, ... }
                  const flightDoc = flightObj.flightId || {};

                  const airline = flightDoc.airline || '항공 정보 없음';
                  const flightNumber = flightDoc.flightNumber || '편명 없음';
                  // price 예: 105000 => "105,000원"
                  const flightPrice = flightDoc.price
                    ? `${flightDoc.price.toLocaleString()}원`
                    : '가격 정보 없음';
                  const seatClass = flightDoc.seatClass || '좌석 클래스 없음';
                  const seatsToUse = flightObj.seatsToUse || 0;

                  const departureStr = formatLocationData(flightDoc.departure);
                  const arrivalStr = formatLocationData(flightDoc.arrival);

                  return (
                    <Box key={flightObj._id || index} sx={{ml: 2, mb: 1}}>
                      <Typography variant="body2">- 항공사: {airline}</Typography>
                      <Typography variant="caption" sx={{ml: 4, display: 'block'}}>
                        편명: {flightNumber}, 좌석: {seatsToUse}, 가격: {flightPrice}
                      </Typography>
                      <Typography variant="caption" sx={{ml: 4, display: 'block'}}>
                        클래스: {seatClass}
                      </Typography>
                      <Typography variant="caption" sx={{ml: 4, display: 'block'}}>
                        출발: {departureStr}
                      </Typography>
                      <Typography variant="caption" sx={{ml: 4, display: 'block'}}>
                        도착: {arrivalStr}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* 투어/티켓 정보 */}
            {pkg.tours?.length > 0 && (
              <Box sx={{mt: 2}}>
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                  포함된 투어/티켓
                </Typography>
                {pkg.tours.map(tour => (
                  <Box key={tour._id} sx={{ml: 2, mb: 1}}>
                    <Typography variant="body2">
                      - {tour.title || '투어 정보 없음'}
                    </Typography>
                    <Typography variant="caption" sx={{ml: 4, display: 'block'}}>
                      가격:{' '}
                      {tour.price ? `${tour.price.toLocaleString()}원` : '가격 정보 없음'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* 가격 정보 */}
            <Box sx={{mt: 2}}>
              <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                가격{' '}
                <Typography component="span" sx={{color: 'red', fontWeight: 'bold'}}>
                  {pkg.finalPrice?.toLocaleString()}원
                </Typography>
              </Typography>
              {pkg.discountRate > 0 && (
                <Typography
                  variant="body2"
                  sx={{color: 'gray', textDecoration: 'line-through'}}>
                  원가: {pkg.price?.toLocaleString()}원 (할인율 {pkg.discountRate}%)
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default PackageInfo;
