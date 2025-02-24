import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getQnaBoardById, updateQnaBoard} from '../../api/qna/qnaBoardService';
import {getUserProfile} from '../../api/user/user';
import {
  Button,
  IconButton,
  Card,
  CardMedia,
  CardActions,
  TextField,
  MenuItem,
  Typography,
  Box,
  // Stack,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css'; // (선택 사항: Bootstrap을 사용한다면)

const QnaBoardEdit = () => {
  const {qnaBoardId} = useParams();
  const navigate = useNavigate();

  // 로그인 사용자 정보
  const [user, setUser] = useState(null);

  // 폼 상태: 기존이미지/파일 + 새 이미지/파일 + 삭제할 목록 등
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    images: [], // 새로 추가된 이미지(File 객체)
    attachments: [], // 새로 추가된 첨부파일(File 객체)
    existingImages: [], // 서버에서 가져온 기존 이미지 경로
    existingAttachments: [], // 서버에서 가져온 기존 첨부파일 경로
    deletedImages: [], // 서버에서 삭제할 이미지 경로
    deletedAttachments: [] // 서버에서 삭제할 첨부파일 경로
  });

  // 기존 + 새 이미지 모두를 **미리보기**로 표시하기 위한 상태
  // 기존 이미지는 "http://localhost:5000/...경로" 형태,
  // 새 이미지는 blob: URL 형태
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
    // 사용자 프로필 조회
    const fetchUser = async () => {
      try {
        const resp = await getUserProfile();
        setUser(resp.data);
      } catch {
        setUser(null);
      }
    };

    // 해당 게시글 조회
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

        // 기존 이미지 경로를 "http://localhost:5000/...경로" 형태로 전환
        const oldImageURLs = (data.images || []).map(
          path => `http://localhost:5000${path}`
        );
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
    const {name, files} = e.target; // name="images" or "attachments"
    const fileList = Array.from(files);

    // 만약 이미지면 => blob: URL 생성하여 미리보기 추가
    if (name === 'images') {
      const newImageURLs = fileList.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newImageURLs]);
    }

    // formData 에 파일 목록 저장
    setFormData(prev => ({
      ...prev,
      [name]: [...prev[name], ...fileList]
    }));
  };

  // -----------------------------
  // 3) 기존 이미지 삭제 로직
  // -----------------------------
  const handleRemoveExistingImage = index => {
    // 기존이미지 중 index번째 경로를 deletedImages 에 추가
    setFormData(prev => ({
      ...prev,
      deletedImages: [...prev.deletedImages, prev.existingImages[index]],
      // existingImages 배열에서 제거
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
    // 미리보기에서도 제거
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // -----------------------------
  // 4) 새로 추가한 이미지 삭제
  // -----------------------------
  const handleRemoveNewImage = index => {
    // previewImages에서 제거
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

    // 로그인 여부 확인
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    // 필수값 체크
    if (!formData.category || !formData.title || !formData.content) {
      alert('카테고리, 제목, 내용을 입력하세요.');
      return;
    }

    setLoading(true);

    try {
      // FormData 구성
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

  if (loading) return <Typography>로딩 중...</Typography>;

  return (
    <Box
      sx={{
        maxWidth: 800,
        margin: 'auto',
        mt: 4,
        p: 3,
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: 3
      }}>
      <Typography variant="h4" sx={{mb: 3, textAlign: 'center', fontWeight: 'bold'}}>
        게시글 수정
      </Typography>

      <form onSubmit={handleUpdateQnaBoard} encType="multipart/form-data">
        {/* 카테고리 */}
        <TextField
          select
          label="카테고리"
          name="category"
          value={formData.category}
          onChange={e => setFormData({...formData, category: e.target.value})}
          fullWidth
          required
          margin="normal">
          {categories.map((cat, idx) => (
            <MenuItem key={idx} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>

        {/* 제목 */}
        <TextField
          label="제목"
          name="title"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          fullWidth
          required
          margin="normal"
        />

        {/* 내용 */}
        <TextField
          label="내용"
          name="content"
          multiline
          rows={5}
          value={formData.content}
          onChange={e => setFormData({...formData, content: e.target.value})}
          fullWidth
          required
          margin="normal"
        />

        <Divider sx={{my: 3}} />

        {/* 기존 이미지 목록 */}
        <Typography variant="h6" sx={{mt: 2, mb: 1}}>
          기존 업로드된 이미지
        </Typography>
        {formData.existingImages.length === 0 && (
          <Typography variant="body2" sx={{mb: 2}}>
            현재 업로드된 이미지가 없습니다.
          </Typography>
        )}
        <Grid container spacing={2}>
          {formData.existingImages.map((path, index) => (
            <Grid item key={index}>
              <Card sx={{width: 120}}>
                <CardMedia
                  component="img"
                  height="100"
                  image={`http://localhost:5000${path}`}
                  alt="기존 이미지"
                />
                <CardActions>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveExistingImage(index)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 새로 추가한 이미지 미리보기 */}
        <Typography variant="h6" sx={{mt: 3, mb: 1}}>
          새로 추가할 이미지 미리보기
        </Typography>
        <Grid container spacing={2}>
          {previewImages.map((imgURL, index) => {
            // blob:.. 이면 새로 추가한 것
            const isNew = imgURL.startsWith('blob:');
            return (
              <Grid item key={index}>
                <Card sx={{width: 120}}>
                  <CardMedia component="img" height="100" image={imgURL} alt="미리보기" />
                  <CardActions>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        isNew
                          ? handleRemoveNewImage(index)
                          : handleRemoveExistingImage(index)
                      }>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* 이미지 추가 버튼 */}
        <Box sx={{mt: 2}}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            sx={{mr: 2}}>
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
        </Box>

        <Divider sx={{my: 3}} />

        {/* 기존 첨부파일 목록 */}
        <Typography variant="h6" sx={{mt: 2, mb: 1}}>
          기존 첨부파일
        </Typography>
        {formData.existingAttachments.length === 0 && (
          <Typography variant="body2" sx={{mb: 2}}>
            현재 첨부파일이 없습니다.
          </Typography>
        )}
        <List>
          {formData.existingAttachments.map((filePath, idx) => (
            <ListItem key={idx} dense>
              <FileIcon sx={{mr: 1}} />
              <ListItemText
                primary={filePath.split('/').pop() || '첨부파일'}
                secondary={`파일 경로: ${filePath}`}
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

        {/* 새로 추가한 첨부파일 미리보기 */}
        <Typography variant="h6" sx={{mt: 3, mb: 1}}>
          새 첨부파일
        </Typography>
        {formData.attachments.length > 0 && (
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
        )}

        {/* 첨부파일 추가 버튼 */}
        <Box sx={{mt: 2}}>
          <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
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
        </Box>

        <Divider sx={{my: 3}} />

        {/* 수정 버튼 */}
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{mt: 3}}>
          {loading ? '수정 중...' : '수정 완료'}
        </Button>
      </form>
    </Box>
  );
};

export default QnaBoardEdit;
