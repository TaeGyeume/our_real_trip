import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getQnaBoardById, updateQnaBoard} from '../../api/qna/qnaBoardService';
import {getUserProfile} from '../../api/user/user';

// MUI 관련 import
import {
  Box,
  Button,
  Card,
  CardActions,
  CardMedia,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';

// 환경에 따른 서버 URL
const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ourrealtrip.shop/api';

const QnaBoardEdit = () => {
  const {qnaBoardId} = useParams();
  const navigate = useNavigate();

  // 로그인 사용자 정보
  const [user, setUser] = useState(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    images: [], // 새로 추가한 이미지(File)
    attachments: [], // 새로 추가한 첨부파일(File)
    existingImages: [], // 서버에서 가져온 기존 이미지 경로
    existingAttachments: [], // 서버에서 가져온 기존 첨부파일 경로
    deletedImages: [], // 삭제할 기존 이미지 경로
    deletedAttachments: [] // 삭제할 기존 첨부파일 경로
  });

  // 이미지 미리보기(기존 + 새 이미지)
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 카테고리 목록
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

  // ---------------------------
  // 1) 사용자 & 게시글 불러오기
  // ---------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const resp = await getUserProfile();
        setUser(resp.data);
      } catch {
        setUser(null);
      }
    };

    const fetchQnaBoard = async () => {
      try {
        const data = await getQnaBoardById(qnaBoardId);
        // 기존 게시글 정보
        setFormData({
          category: data.category,
          title: data.title,
          content: data.content,
          images: [],
          attachments: [],
          existingImages: data.images || [],
          existingAttachments: data.attachments || [],
          deletedImages: [],
          deletedAttachments: []
        });

        // 기존 이미지 경로를 풀 URL로 변환 후 미리보기 배열에 저장
        const oldImageURLs = (data.images || []).map(path => `${SERVER_URL}${path}`);
        setPreviewImages(oldImageURLs);

        setLoading(false);
      } catch (err) {
        console.error('QnA 게시글 조회 오류:', err);
        setLoading(false);
      }
    };

    fetchUser();
    fetchQnaBoard();
  }, [qnaBoardId]);

  // ----------------------------------
  // 2) 이미지/파일 선택 핸들러 (추가)
  // ----------------------------------
  const handleFileChange = e => {
    const {name, files} = e.target; // name: "images" or "attachments"
    const fileArray = Array.from(files);

    // 이미지 업로드 시 blob: URL로 미리보기
    if (name === 'images') {
      const newImageURLs = fileArray.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newImageURLs]);
    }

    // formData에 파일 목록 저장
    setFormData(prev => ({
      ...prev,
      [name]: [...prev[name], ...fileArray]
    }));
  };

  // -----------------------------
  // 3) 기존 이미지 삭제 로직
  // -----------------------------
  const handleRemoveExistingImage = index => {
    setFormData(prev => ({
      ...prev,
      deletedImages: [...prev.deletedImages, prev.existingImages[index]],
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
    // 미리보기에서도 제거
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // -----------------------------
  // 4) 새로 추가한 이미지 삭제
  // -----------------------------
  const handleRemoveNewImage = index => {
    // 미리보기에서 제거
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    // formData.images에서도 제거
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // -----------------------------
  // 5) 기존 첨부파일 삭제
  // -----------------------------
  const handleRemoveExistingFile = index => {
    setFormData(prev => ({
      ...prev,
      deletedAttachments: [...prev.deletedAttachments, prev.existingAttachments[index]],
      existingAttachments: prev.existingAttachments.filter((_, i) => i !== index)
    }));
  };

  // -----------------------------
  // 6) 새 첨부파일 삭제
  // -----------------------------
  const handleRemoveNewFile = index => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // -----------------------------
  // 7) 최종 수정 요청
  // -----------------------------
  const handleUpdateQnaBoard = async e => {
    e.preventDefault();

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!formData.category || !formData.title || !formData.content) {
      alert('카테고리, 제목, 내용을 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const updatedFormData = new FormData();
      updatedFormData.append('category', formData.category);
      updatedFormData.append('title', formData.title);
      updatedFormData.append('content', formData.content);

      // 새로 추가된 이미지
      formData.images.forEach(file => {
        if (file instanceof File) {
          updatedFormData.append('images', file);
        }
      });

      // 새로 추가된 첨부파일
      formData.attachments.forEach(file => {
        if (file instanceof File) {
          updatedFormData.append('attachments', file);
        }
      });

      // 기존 이미지, 첨부파일 + 삭제 예정 목록
      updatedFormData.append('existingImages', JSON.stringify(formData.existingImages));
      updatedFormData.append(
        'existingAttachments',
        JSON.stringify(formData.existingAttachments)
      );
      updatedFormData.append('deletedImages', JSON.stringify(formData.deletedImages));
      updatedFormData.append(
        'deletedAttachments',
        JSON.stringify(formData.deletedAttachments)
      );

      await updateQnaBoard(qnaBoardId, updatedFormData, true);
      alert('게시글이 수정되었습니다!');
      navigate(`/qna/${qnaBoardId}`);
    } catch (err) {
      console.error('게시글 수정 오류:', err);
      alert('게시글 수정 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <Box sx={{textAlign: 'center', mt: 4}}>
        <CircularProgress />
        <Typography variant="body1" sx={{mt: 2}}>
          로딩 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleUpdateQnaBoard}
      encType="multipart/form-data"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 800,
        margin: '0 auto',
        mt: 4
      }}>
      <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
        게시글 수정
      </Typography>

      {/* 카테고리 선택 */}
      <FormControl fullWidth>
        <InputLabel id="category-label">카테고리</InputLabel>
        <Select
          labelId="category-label"
          label="카테고리"
          name="category"
          value={formData.category}
          onChange={e => setFormData({...formData, category: e.target.value})}
          required>
          <MenuItem value="">
            <em>카테고리를 선택하세요</em>
          </MenuItem>
          {categories.map((cat, idx) => (
            <MenuItem key={idx} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 제목 */}
      <TextField
        label="제목"
        name="title"
        value={formData.title}
        onChange={e => setFormData({...formData, title: e.target.value})}
        fullWidth
        required
      />

      {/* 내용 */}
      <TextField
        label="내용"
        name="content"
        value={formData.content}
        onChange={e => setFormData({...formData, content: e.target.value})}
        required
        multiline
        minRows={5}
      />

      <Divider sx={{my: 2}} />

      {/* 기존 이미지 */}
      <Typography variant="h6" sx={{mt: 2}}>
        기존 이미지
      </Typography>
      {formData.existingImages.length === 0 && (
        <Typography variant="body2" sx={{mb: 1}}>
          현재 업로드된 이미지가 없습니다.
        </Typography>
      )}

      {/* 새로 추가된 이미지 + 기존 이미지 미리보기(통합) */}
      <Stack direction="row" spacing={2} sx={{flexWrap: 'wrap'}}>
        {previewImages.map((imgURL, index) => {
          // blob:으로 시작하면 새로 추가한 이미지
          const isNew = imgURL.startsWith('blob:');
          return (
            <Card key={index} sx={{width: 120}}>
              <CardMedia component="img" height="100" image={imgURL} alt="미리보기" />
              <CardActions>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() =>
                    isNew ? handleRemoveNewImage(index) : handleRemoveExistingImage(index)
                  }>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          );
        })}
      </Stack>

      {/* 이미지 업로드 버튼 */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{mt: 1}}>
        <Button variant="contained" component="label" startIcon={<ImageIcon />}>
          이미지 추가
          <input
            type="file"
            name="images"
            multiple
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </Button>
      </Stack>

      <Divider sx={{my: 2}} />

      {/* 기존 첨부파일 */}
      <Typography variant="h6" sx={{mt: 2}}>
        기존 첨부파일
      </Typography>
      {formData.existingAttachments.length === 0 && (
        <Typography variant="body2" sx={{mb: 1}}>
          현재 첨부파일이 없습니다.
        </Typography>
      )}
      <List>
        {formData.existingAttachments.map((filePath, idx) => (
          <ListItem key={idx} dense>
            <FileIcon sx={{mr: 1}} />
            <ListItemText
              primary={filePath.split('/').pop() || '첨부파일'}
              secondary={`경로: ${filePath}`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                size="small"
                color="error"
                onClick={() => handleRemoveExistingFile(idx)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* 새 첨부파일 미리보기 */}
      {formData.attachments.length > 0 && (
        <>
          <Typography variant="h6" sx={{mt: 2}}>
            새 첨부파일
          </Typography>
          <List>
            {formData.attachments.map((fileObj, idx) => (
              <ListItem key={idx} dense>
                <FileIcon sx={{mr: 1}} />
                <ListItemText
                  primary={fileObj.name}
                  secondary={`${(fileObj.size / 1024).toFixed(1)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    color="error"
                    onClick={() => handleRemoveNewFile(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* 첨부파일 업로드 버튼 */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{mt: 1}}>
        <Button variant="contained" component="label" startIcon={<AttachFileIcon />}>
          첨부파일 추가
          <input
            type="file"
            name="attachments"
            multiple
            accept=".pdf,.doc,.docx"
            hidden
            onChange={handleFileChange}
          />
        </Button>
      </Stack>

      <Divider sx={{my: 3}} />

      {/* 수정 버튼 */}
      <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}>
          {loading ? '수정 중...' : '수정 완료'}
        </Button>
      </Box>
    </Box>
  );
};

export default QnaBoardEdit;
