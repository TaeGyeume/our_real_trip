import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  getQnaBoardById,
  deleteQnaBoard,
  getQnaComments,
  createQnaComment,
  deleteQnaComment
} from '../../api/qna/qnaBoardService';
import {getUserProfile} from '../../api/user/user';

// const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
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
        setComments(response.comments);
      } catch (error) {
        console.error('QnA 댓글 조회 오류:', error);
      }
    };

    fetchUser();
    fetchQnaBoard();
    fetchComments();
  }, [qnaBoardId, navigate]);

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

  const handleCreateComment = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    if (!newComment.trim()) return alert('댓글을 입력하세요.');

    setCommentLoading(true);
    try {
      const response = await createQnaComment(qnaBoardId, newComment);
      setComments(prevComments => [
        {
          ...response.qnaComment,
          user: {_id: user._id, username: user.username, email: user.email}
        },
        ...prevComments
      ]);
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 오류:', error);
    }
    setCommentLoading(false);
  };

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

  if (loading) return <CircularProgress sx={{display: 'block', margin: 'auto', mt: 4}} />;
  if (!qnaBoard)
    return <Typography align="center">게시글을 찾을 수 없습니다.</Typography>;

  return (
    <Box sx={{maxWidth: '900px', margin: 'auto', mt: 4, p: 2}}>
      {/* 게시글 상세 */}
      <Card sx={{p: 3, boxShadow: 3}}>
        <CardContent>
          <Typography variant="h4" sx={{fontWeight: 'bold', mb: 2}}>
            {qnaBoard.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            카테고리: {qnaBoard.category}
          </Typography>
          <Typography variant="body2" sx={{mt: 1}}>
            작성자: <strong>{qnaBoard.user?.username || '익명'}</strong> (
            {qnaBoard.user?.email || '비공개'})
          </Typography>
          <Typography variant="body2" sx={{mt: 1, mb: 2}}>
            작성일: {new Date(qnaBoard.createdAt).toLocaleString()}
          </Typography>
          <Divider />
          <Typography variant="body1" sx={{mt: 2}}>
            {qnaBoard.content}
          </Typography>

          {/* 이미지 & 첨부파일 */}
          {qnaBoard.images?.length > 0 && (
            <Grid container spacing={2} sx={{mt: 2}}>
              {qnaBoard.images.map((img, index) => (
                <Grid item xs={6} key={index}>
                  <img
                    src={`${SERVER_URL}${img}`}
                    alt="첨부 이미지"
                    style={{width: '100%', borderRadius: '8px'}}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {qnaBoard.attachments?.length > 0 && (
            <Box sx={{mt: 2}}>
              {qnaBoard.attachments.map((file, index) => (
                <Button
                  key={index}
                  href={`${SERVER_URL}${file}`}
                  download
                  sx={{display: 'block', textAlign: 'left', textTransform: 'none'}}>
                  📎 첨부파일 {index + 1}
                </Button>
              ))}
            </Box>
          )}

          {/* 삭제 버튼 */}
          {user && (user._id === qnaBoard.user?._id || user.roles?.includes('admin')) && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteQnaBoard}
              sx={{mt: 2}}>
              게시글 삭제
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <Box sx={{mt: 4}}>
        <Typography variant="h5">💬 댓글 ({comments.length})</Typography>
        {comments.map(comment => (
          <Paper key={comment._id} sx={{p: 2, mt: 2, borderRadius: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center'}}>
              <Avatar sx={{bgcolor: 'primary.main', mr: 2}}>
                {comment.user?.username?.charAt(0)}
              </Avatar>
              <Typography variant="body1">{comment.user?.username || '익명'}</Typography>
            </Box>
            <Typography variant="body2" sx={{mt: 1}}>
              {comment.content}
            </Typography>
            {user &&
              (user._id === comment.user?._id || user.roles?.includes('admin')) && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDeleteComment(comment._id)}
                  sx={{mt: 1}}>
                  삭제
                </Button>
              )}
          </Paper>
        ))}
      </Box>

      {/* 댓글 입력 */}
      <Box sx={{mt: 3}}>
        <TextField
          fullWidth
          label="댓글 입력"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <Button variant="contained" onClick={handleCreateComment} sx={{mt: 1}}>
          댓글 작성
        </Button>
      </Box>
    </Box>
  );
};

export default QnaBoardDetail;
