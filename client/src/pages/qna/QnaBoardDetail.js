import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Divider,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Link,
  Dialog,
  IconButton,
  Select,
  MenuItem,
  Pagination
} from '@mui/material';
import {
  AttachFile,
  ArrowBack,
  Close,
  ArrowBackIos,
  ArrowForwardIos
} from '@mui/icons-material';
import {
  getQnaBoardById,
  deleteQnaBoard,
  getQnaComments,
  createQnaComment,
  deleteQnaComment
} from '../../api/qna/qnaBoardService';
import {getUserProfile} from '../../api/user/user';

const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ourrealtrip.shop/api';

const QnaBoardDetail = () => {
  const {qnaBoardId} = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [qnaBoard, setQnaBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setCommentLoading] = useState(false);

  // 이미지 모달 상태
  const [openImageModal, setOpenImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 페이지네이션 상태
  const [commentsPerPage, setCommentsPerPage] = useState(10); // 기본 10개씩
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserProfile();
        setUser(response.data);
      } catch (error) {
        setUser(null);
      }
    };

    const fetchQnaBoard = async () => {
      try {
        const data = await getQnaBoardById(qnaBoardId);
        setQnaBoard(data);
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 404) {
          navigate('/qna');
        }
      }
    };

    const fetchComments = async () => {
      try {
        const response = await getQnaComments(qnaBoardId);
        // 오래된 댓글이 위, 새 댓글이 아래로 쌓이는 순서라면
        // 서버가 이미 오래된 순으로 주는 경우 그대로 사용
        // (최신순으로 주는 경우 reverse() 등으로 재정렬 가능)
        setComments(response.comments);
      } catch (error) {
        console.error('QnA 댓글 조회 오류:', error);
      }
    };

    fetchUser();
    fetchQnaBoard();
    fetchComments();
  }, [qnaBoardId, navigate]);

  /** 게시글 삭제 */
  const handleDeleteQnaBoard = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      try {
        await deleteQnaBoard(qnaBoardId);
        navigate('/qna');
      } catch (error) {
        console.error('게시글 삭제 오류:', error);
      }
    }
  };

  /** 댓글 작성 */
  const handleCreateComment = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    if (!newComment.trim()) return alert('댓글을 입력하세요.');

    setCommentLoading(true);
    try {
      const response = await createQnaComment(qnaBoardId, newComment);
      // 오래된 댓글 위, 새 댓글 아래 -> 새 댓글을 뒤에 추가
      setComments(prevComments => [
        ...prevComments,
        {
          ...response.qnaComment,
          user: {_id: user._id, username: user.username, email: user.email}
        }
      ]);
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 오류:', error);
    }
    setCommentLoading(false);
  };

  /** 댓글 삭제 */
  const handleDeleteComment = async commentId => {
    if (!user) return alert('로그인이 필요합니다.');
    if (window.confirm('정말로 댓글을 삭제하시겠습니까?')) {
      try {
        await deleteQnaComment(commentId, user._id, user.roles);
        setComments(prevComments =>
          prevComments.filter(comment => comment._id !== commentId)
        );
      } catch (error) {
        console.error('댓글 삭제 오류:', error);
      }
    }
  };

  /** 이미지 모달 열기 */
  const handleOpenImageModal = index => {
    setCurrentImageIndex(index);
    setOpenImageModal(true);
  };

  /** 이미지 모달 닫기 */
  const handleCloseImageModal = () => {
    setOpenImageModal(false);
  };

  /** 이전 이미지 보기 */
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  /** 다음 이미지 보기 */
  const handleNextImage = () => {
    if (currentImageIndex < (qnaBoard.images?.length || 0) - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  /** 페이지 변경 */
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  /** 페이지당 댓글 수 변경 */
  const handleCommentsPerPageChange = event => {
    setCommentsPerPage(event.target.value);
    setCurrentPage(1); // 페이지 수가 바뀌면 첫 페이지로 이동
  };

  if (loading) {
    return <CircularProgress sx={{display: 'block', margin: 'auto', mt: 4}} />;
  }
  if (!qnaBoard) {
    return <Typography align="center">게시글을 찾을 수 없습니다.</Typography>;
  }

  // 현재 페이지에 보여줄 댓글 계산
  const startIndex = (currentPage - 1) * commentsPerPage;
  const endIndex = startIndex + commentsPerPage;
  const currentComments = comments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  return (
    <Box sx={{maxWidth: '900px', margin: 'auto', mt: 4, p: 2}}>
      {/* 상단 네비게이션 */}
      <Box sx={{mb: 2, display: 'flex', alignItems: 'center'}}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/qna')} sx={{mr: 1}}>
          목록으로
        </Button>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" onClick={() => navigate('/')}>
            홈
          </Link>
          <Link underline="hover" color="inherit" onClick={() => navigate('/qna')}>
            FAQ
          </Link>
          <Typography color="text.primary">상세보기</Typography>
        </Breadcrumbs>
      </Box>

      {/* 게시글 상세 */}
      <Card sx={{p: 3, boxShadow: 3, borderRadius: 2, mb: 4}}>
        <CardContent>
          <Typography variant="h3" sx={{fontWeight: 'bold', mb: 3}}>
            {qnaBoard.title}
          </Typography>
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2}}>
            <Typography variant="body2" color="text.secondary">
              <strong>카테고리</strong>: {qnaBoard.category}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>작성자</strong>: {qnaBoard.user?.username || '익명'} (
              {qnaBoard.user?.email || '비공개'})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>작성일</strong>: {new Date(qnaBoard.createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Divider sx={{mb: 3}} />
          <Typography variant="body1" sx={{mb: 38, lineHeight: 1.8, fontSize: '1.1rem'}}>
            {qnaBoard.content}
          </Typography>

          {/* 첨부 이미지 (줄바꿈) */}
          {qnaBoard.images?.length > 0 && (
            <>
              <Typography variant="h6" sx={{mt: 2}}>
                첨부이미지
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap', // 여러 이미지를 다음 줄로 자동 배치
                  gap: 2,
                  mt: 2
                }}>
                {qnaBoard.images.map((img, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={`${SERVER_URL}${img}`}
                    alt="첨부 이미지"
                    onClick={() => handleOpenImageModal(index)}
                    sx={{
                      width: '120px',
                      height: '120px',
                      borderRadius: 2,
                      boxShadow: 2,
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* 첨부파일 (가로 나열) */}
          {qnaBoard.attachments?.length > 0 && (
            <>
              <Typography variant="h6" sx={{mt: 3}}>
                첨부파일
              </Typography>
              <Box sx={{display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap'}}>
                {qnaBoard.attachments.map((file, index) => (
                  <Button
                    key={index}
                    href={`${SERVER_URL}${file}`}
                    download
                    startIcon={<AttachFile />}
                    sx={{
                      textAlign: 'left',
                      textTransform: 'none'
                    }}>
                    첨부파일 {index + 1}
                  </Button>
                ))}
              </Box>
            </>
          )}

          {/* 삭제 버튼 */}
          {user && (user._id === qnaBoard.user?._id || user.roles?.includes('admin')) && (
            <Box sx={{mt: 3}}>
              <Button variant="contained" color="error" onClick={handleDeleteQnaBoard}>
                게시글 삭제
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <Paper sx={{p: 3, borderRadius: 2, mb: 4, boxShadow: 3}}>
        <Typography variant="h5" sx={{mb: 2}}>
          💬 댓글 ({comments.length})
        </Typography>
        <Divider sx={{mb: 2}} />

        {/* 페이지당 표시 개수 선택 */}
        {comments.length > 0 && (
          <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
            <Typography variant="body2">페이지당 표시할 댓글 수:</Typography>
            <Select
              size="small"
              value={commentsPerPage}
              onChange={handleCommentsPerPageChange}>
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={30}>30개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
            </Select>
          </Box>
        )}

        {/* 댓글 목록 */}
        {currentComments.length === 0 && comments.length > 0 ? (
          // 예: 마지막 페이지에서 댓글이 없는 경우
          <Typography variant="body2" color="text.secondary">
            현재 페이지에 댓글이 없습니다.
          </Typography>
        ) : currentComments.length === 0 && comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            댓글이 없습니다. 첫 댓글을 달아보세요!
          </Typography>
        ) : (
          currentComments.map(comment => (
            <Box key={comment._id} sx={{mb: 2}}>
              {/* 작성자 정보(Avatar 제거) */}
              <Box sx={{display: 'flex', alignItems: 'baseline', gap: 1, mb: 1}}>
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                  {comment.user?.username || '익명'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {comment.user?.email || '비공개'}
                </Typography>
              </Box>
              {/* 댓글 내용 */}
              <Paper sx={{p: 2, borderRadius: 2, backgroundColor: '#f9f9f9'}}>
                <Typography variant="body1" sx={{mb: 1}}>
                  {comment.content}
                </Typography>
                {user &&
                  (user._id === comment.user?._id || user.roles?.includes('admin')) && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteComment(comment._id)}>
                      삭제
                    </Button>
                  )}
              </Paper>
            </Box>
          ))
        )}

        {/* 페이지네이션 */}
        {comments.length > 0 && (
          <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* 댓글 입력 */}
      <Paper sx={{p: 3, borderRadius: 2, boxShadow: 3}} elevation={2}>
        <Typography variant="h6" sx={{mb: 2}}>
          댓글 작성
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          variant="outlined"
          label="댓글 입력"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          sx={{mb: 2}}
        />
        <Button variant="contained" onClick={handleCreateComment}>
          등록하기
        </Button>
      </Paper>

      {/* 이미지 크게 보기 모달 */}
      <Dialog
        open={openImageModal}
        onClose={handleCloseImageModal}
        maxWidth="lg"
        sx={{'& .MuiPaper-root': {borderRadius: 2, overflow: 'hidden'}}}>
        <Box
          sx={{position: 'relative', p: 2, textAlign: 'center', backgroundColor: '#fff'}}>
          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleCloseImageModal}
            sx={{position: 'absolute', top: 8, right: 8}}>
            <Close />
          </IconButton>

          {/* 이전/다음 버튼 + 이미지 */}
          <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <IconButton
              onClick={handlePrevImage}
              disabled={currentImageIndex === 0}
              sx={{mx: 2}}>
              <ArrowBackIos />
            </IconButton>
            <Box
              component="img"
              src={`${SERVER_URL}${qnaBoard.images?.[currentImageIndex]}`}
              alt="확대된 첨부 이미지"
              sx={{
                maxWidth: '80vw',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
            <IconButton
              onClick={handleNextImage}
              disabled={currentImageIndex === (qnaBoard.images?.length || 0) - 1}
              sx={{mx: 2}}>
              <ArrowForwardIos />
            </IconButton>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default QnaBoardDetail;
