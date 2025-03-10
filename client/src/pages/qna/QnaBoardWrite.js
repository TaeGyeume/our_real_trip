import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {createQnaBoard} from '../../api/qna/qnaBoardService';

// MUI 관련 import
import {
  Box,
  Button,
  Card,
  CardActions,
  CardMedia,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Stack
} from '@mui/material';
import {AttachFile, Image as ImageIcon, Delete as DeleteIcon} from '@mui/icons-material';

const QnaBoardWrite = () => {
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    images: [],
    attachments: []
  });

  const [imagePreviews, setImagePreviews] = useState([]); // 이미지 미리보기
  const [fileNames, setFileNames] = useState([]); // 첨부파일 이름 리스트
  const [loading, setLoading] = useState(false);

  // 카테고리 옵션
  const categories = [
    '회원 정보 문의',
    '회원 가입 문의',
    '여행 상품 문의',
    '항공 문의',
    '투어/티켓 문의',
    '숙소 문의',
    '예약 문의',
    '결제 문의',
    '취소/환불 문의',
    '기타 문의'
  ];

  // 입력 변경 핸들러
  const handleChange = e => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // 파일 업로드 핸들러
  const handleFileChange = e => {
    const {name, files} = e.target;
    const fileArray = Array.from(files);

    if (name === 'images') {
      // 이미지 미리보기 생성
      const previews = fileArray.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    } else if (name === 'attachments') {
      // 첨부파일 리스트 업데이트
      const fileList = fileArray.map(file => file.name);
      setFileNames(fileList);
    }

    setFormData({...formData, [name]: fileArray});
  };

  // 이미지 삭제 핸들러: 미리보기와 formData.images 모두에서 제거
  const handleRemoveImage = index => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.category.trim() || !formData.title.trim() || !formData.content.trim()) {
      alert('카테고리, 제목, 내용을 입력하세요.');
      return;
    }

    setLoading(true);

    try {
      let requestData = new FormData();
      let isMultipart = false;

      // 문자열 데이터
      requestData.append('category', formData.category.trim());
      requestData.append('title', formData.title.trim());
      requestData.append('content', formData.content.trim());

      // 파일이 존재한다면 FormData에 추가
      if (formData.images.length > 0 || formData.attachments.length > 0) {
        isMultipart = true;
        formData.images.forEach(file => {
          if (file instanceof File) {
            requestData.append('images', file);
          }
        });

        formData.attachments.forEach(file => {
          if (file instanceof File) {
            requestData.append('attachments', file);
          }
        });
      }

      // 서버에 게시글 생성 요청
      await createQnaBoard(requestData, isMultipart);

      alert('게시글이 성공적으로 등록되었습니다!');
      navigate('/qna');
    } catch (error) {
      console.error('QnA 게시글 작성 오류:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 800,
        margin: '0 auto',
        mt: 4
      }}
      encType="multipart/form-data">
      <Typography variant="h4" component="h2" gutterBottom>
        QnA 게시글 작성
      </Typography>

      {/* 카테고리 선택 */}
      <FormControl fullWidth>
        <InputLabel id="category-label">카테고리</InputLabel>
        <Select
          labelId="category-label"
          label="카테고리"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required>
          <MenuItem value="">
            <em>카테고리를 선택하세요</em>
          </MenuItem>
          {categories.map((category, index) => (
            <MenuItem key={index} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 제목 입력 */}
      <TextField
        label="제목"
        name="title"
        value={formData.title}
        onChange={handleChange}
        required
      />

      {/* 내용 입력 */}
      <TextField
        label="내용"
        name="content"
        value={formData.content}
        onChange={handleChange}
        required
        multiline
        minRows={5}
      />

      {/* 이미지 업로드 */}
      <Box>
        <Typography variant="body1" sx={{mb: 1}}>
          이미지 업로드 (최대 3개)
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button variant="contained" component="label" startIcon={<ImageIcon />}>
            이미지 선택
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {imagePreviews.length > 0 && (
            <Typography variant="body2">{imagePreviews.length}장 선택됨</Typography>
          )}
        </Stack>
        {/* 이미지 미리보기 및 삭제 버튼 */}
        <Stack direction="row" spacing={2} sx={{mt: 2, flexWrap: 'wrap'}}>
          {imagePreviews.map((src, index) => (
            <Card key={index} sx={{width: 120, position: 'relative'}}>
              <CardMedia
                component="img"
                height="80"
                image={src}
                alt={`미리보기-${index}`}
              />
              <CardActions sx={{p: 0, justifyContent: 'flex-end'}}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveImage(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* 첨부파일 업로드 */}
      <Box>
        <Typography variant="body1" sx={{mb: 1}}>
          첨부파일 업로드 (PDF, DOCX 등)
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button variant="contained" component="label" startIcon={<AttachFile />}>
            파일 선택
            <input
              type="file"
              name="attachments"
              multiple
              accept=".pdf, .doc, .docx"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {fileNames.length > 0 && (
            <Typography variant="body2">{fileNames.length}개 파일 선택됨</Typography>
          )}
        </Stack>
        {/* 첨부파일 리스트 */}
        {fileNames.length > 0 && (
          <ul style={{marginTop: '8px'}}>
            {fileNames.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        )}
      </Box>

      {/* 제출 버튼 */}
      <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}>
          {loading ? '작성 중...' : '게시글 작성'}
        </Button>
      </Box>
    </Box>
  );
};

export default QnaBoardWrite;
