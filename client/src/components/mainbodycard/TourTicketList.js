// // src/components/TourTicketList.jsx
// import React, {useState, useEffect} from 'react';
// import {Box, Card, CardMedia, CardContent, Typography} from '@mui/material';

// // 샘플 투어티켓 데이터 (실제 환경에서는 API 호출 결과 사용)
// // const sampleTourTickets = [
// //   {
// //     _id: '67caae87645b2794e636cb6b',
// //     title: '서울 투어 1',
// //     description: '서울의 명소를 둘러보세요!',
// //     location: '서울',
// //     price: 111,
// //     stock: 11,
// //     images: ['/images/locationcard/seoul.jpg'],
// //     views: 3
// //   },
// //   {
// //     _id: '2',
// //     title: '도쿄 투어',
// //     description: '도쿄의 다양한 매력을 경험하세요.',
// //     location: '도쿄',
// //     price: 200,
// //     stock: 5,
// //     images: ['/images/locationcard/tokyo2.jpg'],
// //     views: 10
// //   },
// //   {
// //     _id: '3',
// //     title: '서울 투어 2',
// //     description: '서울의 또 다른 매력을 발견해보세요!',
// //     location: '서울',
// //     price: 150,
// //     stock: 8,
// //     images: ['/images/locationcard/tokyo.jpg'],
// //     views: 7
// //   }
// // ];

// const TourTicketList = ({location}) => {
//   const [tourTickets, setTourTickets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // 선택한 지역과 DB의 투어티켓 데이터의 location이 일치하는 항목만 필터링
//     const filtered = sampleTourTickets.filter(ticket => ticket.location === location);
//     setTourTickets(filtered);
//   }, [location]);

//   if (tourTickets.length === 0) {
//     return (
//       <Typography variant="body1">해당 지역의 투어 티켓 데이터가 없습니다.</Typography>
//     );
//   }

//   return (
//     <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2}}>
//       {tourTickets.map(ticket => (
//         <Card key={ticket._id} sx={{width: 300}}>
//           {ticket.images && ticket.images.length > 0 && (
//             <CardMedia
//               component="img"
//               image={ticket.images[0]}
//               alt={ticket.title}
//               sx={{height: 180, objectFit: 'cover'}}
//             />
//           )}
//           <CardContent>
//             <Typography variant="h6" gutterBottom>
//               {ticket.title}
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {ticket.description}
//             </Typography>
//             <Typography variant="body2" sx={{mt: 1}}>
//               가격: {ticket.price}원
//             </Typography>
//           </CardContent>
//         </Card>
//       ))}
//     </Box>
//   );
// };

// export default TourTicketList;

// src/components/TourTicketList.jsx
import React, {useState, useEffect} from 'react';
import {Box, Card, CardMedia, CardContent, Typography} from '@mui/material';

const TourTicketList = ({location}) => {
  const [tourTickets, setTourTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 실제 API 엔드포인트로 데이터 요청
    const fetchTourTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        // 예: 백엔드에서 location에 맞는 투어티켓 데이터를 제공하는 API
        const response = await fetch(
          `/api/tourTickets?location=${encodeURIComponent(location)}`
        );
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setTourTickets(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTourTickets();
  }, [location]);

  if (loading) {
    return <Typography variant="body1">데이터를 불러오는 중...</Typography>;
  }

  if (error) {
    return (
      <Typography variant="body1" color="error">
        {error}
      </Typography>
    );
  }

  if (tourTickets.length === 0) {
    return (
      <Typography variant="body1">해당 지역의 투어 티켓 데이터가 없습니다.</Typography>
    );
  }

  return (
    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2}}>
      {tourTickets.map(ticket => (
        <Card key={ticket._id} sx={{width: 300}}>
          {ticket.images && ticket.images.length > 0 && (
            <CardMedia
              component="img"
              image={ticket.images[0]}
              alt={ticket.title}
              sx={{height: 180, objectFit: 'cover'}}
            />
          )}
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {ticket.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ticket.description}
            </Typography>
            <Typography variant="body2" sx={{mt: 1}}>
              가격: {ticket.price}원
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TourTicketList;
