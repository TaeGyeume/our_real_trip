import React from 'react';
import {Box, Typography, Button, Stack, IconButton, Divider} from '@mui/material';
import {FaFacebookF, FaInstagram, FaYoutube, FaApple, FaGooglePlay} from 'react-icons/fa';
import useChannelTalk from '../hooks/useChannelTalk';

const Footer = () => {
  const toggleChannelTalk = useChannelTalk();

  return (
    <Box component="footer" sx={{bgcolor: '#f8f9fa', py: 4, px: 2, mt: 5}}>
      <Box sx={{maxWidth: 1200, mx: 'auto'}}>
        {/* 고객 지원 및 소개 */}
        <Stack
          direction={{xs: 'column', md: 'row'}}
          spacing={4}
          justifyContent="space-between">
          {/* 고객지원실 */}
          <Box flex={1}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              고객지원실 운영안내
            </Typography>
            <Typography variant="body2">채팅상담 연중무휴 24시간</Typography>
            <Typography variant="body2">유선상담 연중무휴 09:00~18:00</Typography>
            <Typography variant="body2">대표번호 1300-8282</Typography>
            <Typography variant="body2">
              ✈ 항공권 환불 - 연중무휴 09:00~17:00 접수 가능
            </Typography>
            <Typography variant="body2">
              ✈ 항공권 변경 - 평일 09:00~17:00 접수 가능
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{mt: 1}}
              onClick={toggleChannelTalk}>
              1:1 채팅상담
            </Button>
          </Box>

          {/* 소개 */}
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              소개
            </Typography>
            <Typography variant="body2">
              <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
                회사소개
              </a>
            </Typography>
            <Typography variant="body2">
              <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
                채용
              </a>
            </Typography>
            <Typography variant="body2">
              <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
                광고
              </a>
            </Typography>
          </Box>

          {/* 파트너 */}
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              파트너
            </Typography>
            <Typography variant="body2">
              <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
                파트너 홈
              </a>
            </Typography>
            <Typography variant="body2">
              <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
                제휴 문의
              </a>
            </Typography>
            <Typography variant="body2">
              <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
                광고 문의
              </a>
            </Typography>
          </Box>

          {/* 지원 */}
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              지원
            </Typography>
            <Typography variant="body2">
              <a href="/qna" style={{textDecoration: 'none', color: 'inherit'}}>
                공지사항/FAQ
              </a>
            </Typography>
            <Typography variant="body2">
              <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
                최저가 보장제
              </a>
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{my: 3}} />

        {/* 이용 약관 */}
        <Stack direction="row" justifyContent="center" spacing={3}>
          <Typography variant="body2">
            <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
              이용 약관
            </a>
          </Typography>
          <Typography variant="body2">
            <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
              개인정보 처리방침
            </a>
          </Typography>
          <Typography variant="body2">
            <a href="/main" style={{textDecoration: 'none', color: 'inherit'}}>
              취소 및 환불 정책
            </a>
          </Typography>
        </Stack>

        <Divider sx={{my: 3}} />

        {/* 회사 정보 */}
        <Box textAlign="center">
          <Typography variant="body2">
            상호명 (주)우리리얼트립 | 대표 김우리 | 개인정보보호책임자 김민혁 |
            사업자등록번호 2*9-**-55*39
          </Typography>
          <Typography variant="body2">
            주소 서울특별시 서초구 강남대로 3*1 (한화생명보험빌딩)
          </Typography>
          <Typography variant="body2">
            이메일 help@ourrealtrip.com | 마케팅 문의 marketing@ourrealtrip.com
          </Typography>
          <Typography variant="body2" sx={{mt: 1}}>
            자사는 서울특별시관광협회 공제영업보증보험에 가입되어 있습니다. 영업보증보험:
            1.5억원 / 기획여행보증: 2억원
          </Typography>
        </Box>

        <Divider sx={{my: 3}} />

        {/* 소셜미디어 아이콘 */}
        <Stack direction="row" justifyContent="center" spacing={2}>
          <IconButton color="primary">
            <FaFacebookF />
          </IconButton>
          <IconButton color="secondary">
            <FaInstagram />
          </IconButton>
          <IconButton color="error">
            <FaYoutube />
          </IconButton>
          <IconButton>
            <FaApple />
          </IconButton>
          <IconButton>
            <FaGooglePlay />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;
