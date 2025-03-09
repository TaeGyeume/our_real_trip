import React, {useEffect, useState} from 'react';
import {
  Drawer,
  Box,
  Container,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {styled} from '@mui/system';
import {useNavigate} from 'react-router-dom';
import {FaQuestionCircle, FaLightbulb, FaCog, FaUser} from 'react-icons/fa';
import {MdExpandMore} from 'react-icons/md';
import {getQnaBoards, deleteQnaBoard} from '../../api/qna/qnaBoardService';
import {getUserProfile} from '../../api/user/user';

/* -------------------------
   1) FAQ 더미 데이터 (infoCards + faqItems)
   (한국어로 수정)
-------------------------- */
const infoCards = [
  {
    icon: <FaQuestionCircle size={32} />,
    title: '일반 문의',
    description: '서비스와 정책에 대한 자주 묻는 질문을 확인하세요.'
  },
  {
    icon: <FaLightbulb size={32} />,
    title: '시작하기',
    description: '서비스 사용 방법과 팁을 알아보세요.'
  },
  {
    icon: <FaCog size={32} />,
    title: '기술 지원',
    description: '기술 문제 해결에 도움이 되는 자료를 확인하세요.'
  },
  {
    icon: <FaUser size={32} />,
    title: '계정 관리',
    description: '계정 관리를 위한 모든 정보를 알아보세요.'
  }
];

const faqItems = [
  {
    question: '비밀번호를 재설정하려면 어떻게 해야 하나요?',
    answer:
      '로그인 페이지에서 "비밀번호 찾기"를 클릭한 뒤 이메일로 전송된 안내를 따라 진행하세요.'
  },
  {
    question: '어떤 결제 수단을 사용할 수 있나요?',
    answer: '주요 신용카드, PayPal, 은행 송금을 지원합니다.'
  },
  {
    question: '고객지원팀에 어떻게 문의할 수 있나요?',
    answer:
      '이메일, 전화, 라이브 채팅을 통해 24시간 문의하실 수 있습니다. 자세한 내용은 Contact Us 페이지를 참조하세요.'
  },
  {
    question: '환불 정책은 어떻게 되나요?',
    answer: '구매 후 30일 이내 환불을 보장합니다. 자세한 내용은 이용약관을 확인하세요.'
  },
  {
    question: '계정 정보를 업데이트하려면 어떻게 해야 하나요?',
    answer: '로그인 후 설정 페이지에서 프로필 정보를 수정하실 수 있습니다.'
  }
];

/* -------------------------
   2) 공통 스타일 정의
-------------------------- */
// FAQ 아이콘 카드 스타일
const StyledCard = styled(Card)(({theme}) => ({
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme?.shadows ? theme.shadows[4] : '0 4px 8px rgba(0,0,0,0.1)'
  },
  height: '100%'
}));

// QnA Accordion의 제목
// const TitleTypography = styled(Typography)({
//   fontSize: '1rem',
//   fontWeight: 'bold'
// });

// QnA Accordion 호버 시 그림자
// const StyledAccordion = styled(Accordion)(({theme}) => ({
//   transition: 'transform 0.3s ease-in-out',
//   '&:hover': {
//     transform: 'translateY(-2px)',
//     boxShadow: theme?.shadows ? theme.shadows[3] : '0 2px 6px rgba(0,0,0,0.1)'
//   }
// }));

/* -------------------------
   3) Drawer 메뉴 항목
-------------------------- */
const menuItems = ['Home', 'FAQs', 'Contact Us', 'About'];

const QnaBoardList = () => {
  /* -------------------------
     4) 상태 정의
  -------------------------- */
  const [mobileOpen, setMobileOpen] = useState(false); // Drawer 열림/닫힘
  const [qnaBoards, setQnaBoards] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  // const theme = useTheme();

  /* -------------------------
     5) 사용자 + QnA 목록 로드
  -------------------------- */
  useEffect(() => {
    const fetchUserAndBoards = async () => {
      try {
        setLoading(true);
        const userResponse = await getUserProfile();
        setUser(userResponse.data);

        const response = await getQnaBoards(page, 10, category);
        setQnaBoards(response.qnaBoards ?? []);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error);
        setQnaBoards([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndBoards();
  }, [page, category]);

  /* -------------------------
     6) Drawer 열기/닫기
  -------------------------- */
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  /* -------------------------
     7) QnA 삭제
  -------------------------- */
  const handleDeleteQnaBoard = async qnaBoardId => {
    if (!user) return alert('로그인이 필요합니다.');
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      try {
        await deleteQnaBoard(qnaBoardId);
        setQnaBoards(prev => prev.filter(q => q._id !== qnaBoardId));
        alert('게시글이 삭제되었습니다.');
      } catch (error) {
        console.error('게시글 삭제 오류:', error);
        alert('게시글 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  /* -------------------------
     8) QnA 수정
  -------------------------- */
  const handleEditQnaBoard = qnaBoardId => {
    navigate(`/qna/edit/${qnaBoardId}`);
  };

  /* -------------------------
     9) Drawer 내용
  -------------------------- */
  const drawer = (
    <Box sx={{width: 240, p: 2}}>
      {menuItems.map(text => (
        <Box
          key={text}
          sx={{
            p: 1,
            cursor: 'pointer',
            '&:hover': {bgcolor: 'action.hover'}
          }}>
          <Typography variant="body1">{text}</Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{display: 'flex'}}>
      {/* -------------------------
          (B) Drawer (모바일)
      -------------------------- */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{keepMounted: true}}
          sx={{
            display: {xs: 'block', sm: 'none'},
            '& .MuiDrawer-paper': {boxSizing: 'border-box', width: 240}
          }}>
          {drawer}
        </Drawer>
      </Box>

      {/* -------------------------
          (C) 메인 컨텐츠
      -------------------------- */}
      <Box component="main" sx={{flexGrow: 1, pt: 10, pb: 6}}>
        <Container maxWidth="lg">
          {/* 1) FAQ 더미 데이터 (상단, 한국어) */}
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            자주 묻는 질문
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" paragraph>
            Our Real Trip 에 대한 자주 묻는 질문을 확인하세요.
          </Typography>

          {/* 아이콘 카드 (infoCards) */}
          <Grid container spacing={4} sx={{mt: 4, mb: 6}}>
            {infoCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StyledCard>
                  <CardContent sx={{textAlign: 'center'}}>
                    <Box sx={{mb: 2}}>{card.icon}</Box>
                    <Typography variant="h6" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>

          {/* Common Questions (faqItems, 한국어) */}
          <Box sx={{mt: 6}}>
            <Typography variant="h4" gutterBottom>
              자주 묻는 질문 목록
            </Typography>
            {faqItems.map((faq, index) => (
              <Accordion key={index} sx={{mt: 2}}>
                <AccordionSummary
                  expandIcon={<MdExpandMore />}
                  aria-controls={`panel${index}-content`}
                  id={`panel${index}-header`}>
                  <Typography variant="h6">{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* 2) 실제 QnA 게시글 (하단) */}
          <Box sx={{mt: 8}}>
            {/* 상단 안내 문구는 제거 (원하시는 부분 삭제) */}
            {/* 카테고리 선택 (왼쪽) + 게시글 등록 (오른쪽) */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
              {/* 왼쪽: 카테고리 */}
              <FormControl variant="outlined" sx={{minWidth: 200}}>
                <InputLabel id="category-label">카테고리</InputLabel>
                <Select
                  labelId="category-label"
                  label="카테고리"
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}>
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="회원 정보 문의">회원 정보 문의</MenuItem>
                  <MenuItem value="회원 가입 문의">회원 가입 문의</MenuItem>
                  <MenuItem value="여행 상품 문의">여행 상품 문의</MenuItem>
                  <MenuItem value="항공 문의">항공 문의</MenuItem>
                  <MenuItem value="투어/티켓 문의">투어/티켓 문의</MenuItem>
                  <MenuItem value="숙소 문의">숙소 문의</MenuItem>
                  <MenuItem value="예약 문의">예약 문의</MenuItem>
                  <MenuItem value="결제 문의">결제 문의</MenuItem>
                  <MenuItem value="취소/환불 문의">취소/환불 문의</MenuItem>
                  <MenuItem value="기타 문의">기타 문의</MenuItem>
                </Select>
              </FormControl>

              {/* 오른쪽: 게시글 등록 (로그인된 유저만) */}
              {user && (
                <Button variant="contained" onClick={() => navigate('/qna/write')}>
                  ✏️ 고객 문의 등록
                </Button>
              )}
            </Box>

            {/* 로딩 상태 */}
            {loading ? (
              <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* QnA 목록 */}
                {qnaBoards.length > 0 ? (
                  <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    {qnaBoards.map(qna => (
                      <Box
                        key={qna._id}
                        sx={{
                          p: 2,
                          border: '1px solid #ddd',
                          borderRadius: 2,
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/qna/${qna._id}`)}>
                        {/* 제목 */}
                        <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                          {qna.title}
                        </Typography>

                        {/* 카테고리 & 작성자 정보 */}
                        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                          <strong>카테고리:</strong> {qna.category} |{' '}
                          <strong>작성자:</strong> {qna.user?.username || '익명'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>이메일:</strong> {qna.user?.email || '비공개'}
                        </Typography>

                        {/* 게시글 내용 (본문) */}
                        {qna.content && (
                          <Typography variant="body1" sx={{mt: 2}}>
                            {qna.content.length > 20
                              ? `${qna.content.substring(0, 20)}...`
                              : qna.content}
                          </Typography>
                        )}

                        {/* 수정/삭제 버튼 (글쓴이 또는 관리자만 보이도록) */}
                        {(user?._id === qna.user?._id ||
                          user?.roles?.includes('admin')) && (
                          <Box sx={{display: 'flex', gap: 1, mt: 2}}>
                            {user?._id === qna.user?._id && (
                              <Button
                                variant="outlined"
                                color="warning"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEditQnaBoard(qna._id);
                                }}>
                                수정
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteQnaBoard(qna._id);
                              }}>
                              삭제
                            </Button>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography align="center" sx={{mt: 2}}>
                    등록된 문의가 없습니다.
                  </Typography>
                )}
              </>
            )}

            {/* 페이지네이션 */}
            <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}>
              <Button
                variant="outlined"
                sx={{mx: 1}}
                disabled={page === 1}
                onClick={() => setPage(prev => prev - 1)}>
                이전
              </Button>
              <Typography variant="body1" sx={{mx: 1, alignSelf: 'center'}}>
                {page} / {totalPages}
              </Typography>
              <Button
                variant="outlined"
                sx={{mx: 1}}
                disabled={page === totalPages}
                onClick={() => setPage(prev => prev + 1)}>
                다음
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default QnaBoardList;
