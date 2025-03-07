import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FlightRoundedIcon from '@mui/icons-material/FlightRounded';
import HotelRoundedIcon from '@mui/icons-material/HotelRounded';
import TourRoundedIcon from '@mui/icons-material/TourRounded';
import CardTravelRoundedIcon from '@mui/icons-material/CardTravelRounded';
import {SitemarkIcon} from './CustomIcons';

// const items = [
//   {
//     icon: <SettingsSuggestRoundedIcon sx={{color: 'text.secondary'}} />,
//     title: 'Adaptable performance',
//     description:
//       'Our product effortlessly adjusts to your needs, boosting efficiency and simplifying your tasks.'
//   },
//   {
//     icon: <ConstructionRoundedIcon sx={{color: 'text.secondary'}} />,
//     title: 'Built to last',
//     description:
//       'Experience unmatched durability that goes above and beyond with lasting investment.'
//   },
//   {
//     icon: <ThumbUpAltRoundedIcon sx={{color: 'text.secondary'}} />,
//     title: 'Great user experience',
//     description:
//       'Integrate our product into your routine with an intuitive and easy-to-use interface.'
//   },
//   {
//     icon: <AutoFixHighRoundedIcon sx={{color: 'text.secondary'}} />,
//     title: 'Innovative functionality',
//     description:
//       'Stay ahead with features that set new standards, addressing your evolving needs better than the rest.'
//   }
// ];

const items = [
  {
    icon: <FlightRoundedIcon sx={{color: 'text.secondary'}} />,
    title: '항공',
    description: '예산 항공사부터 프리미엄 항공 경험까지 다양한 항공 옵션을 제공합니다.'
  },
  {
    icon: <HotelRoundedIcon sx={{color: 'text.secondary'}} />,
    title: '숙소',
    description:
      '저렴한 호스텔부터 고급 리조트와 호텔까지 다양한 숙소를 예약할 수 있습니다.'
  },
  {
    icon: <TourRoundedIcon sx={{color: 'text.secondary'}} />,
    title: '투어 & 티켓',
    description: '박물관 패스부터 이벤트 티켓까지 할인된 투어와 액티비티를 제공합니다.'
  },
  {
    icon: <CardTravelRoundedIcon sx={{color: 'text.secondary'}} />,
    title: '패키지 상품',
    description:
      '항공, 호텔, 투어를 결합한 맞춤형 패키지 상품으로 완벽한 여행을 즐겨보세요.'
  }
];

export default function Content() {
  return (
    <Stack sx={{flexDirection: 'column', alignSelf: 'center', gap: 4, maxWidth: 450}}>
      <Box sx={{display: {xs: 'none', md: 'flex'}}}>
        <SitemarkIcon />
      </Box>
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{gap: 2}}>
          {item.icon}
          <div>
            <Typography gutterBottom sx={{fontWeight: 'medium'}}>
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{color: 'text.secondary'}}>
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}
