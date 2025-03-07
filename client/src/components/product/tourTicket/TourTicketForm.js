import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {createTourTicket} from '../../../api/tourTicket/tourTicketService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  OutlinedInput
} from '@mui/material';
import {styled} from '@mui/system';

// 국내 지역 리스트
const domesticLocations = [
  '서울',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주도'
];

// 해외 지역 리스트
const internationalLocations = [
  '도쿄',
  '베이징',
  '타이베이',
  '런던',
  '파리',
  '시드니',
  '뉴욕',
  '방콕'
];

// 스타일링 추가
const StyledForm = styled('form')({
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  width: '100%'
});

const FileInput = styled('input')({
  display: 'none'
});

const TourTicketForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    stock: '',
    images: []
  });

  // 국내/해외 선택 상태
  const [regionType, setRegionType] = useState('domestic'); // 기본값: 국내

  // 파일 선택 핸들러
  const handleFileChange = e => {
    setFormData({...formData, images: [...e.target.files]});
  };

  // 입력 필드 핸들러
  const handleChange = e => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // 상품 등록 핸들러
  const handleSubmit = async e => {
    e.preventDefault();
    const formDataObj = new FormData();

    formData.images.forEach(file => {
      formDataObj.append('images', file);
    });

    formDataObj.append('title', formData.title);
    formDataObj.append('description', formData.description);
    formDataObj.append('location', formData.location);
    formDataObj.append('price', formData.price);
    formDataObj.append('stock', formData.stock);

    try {
      await createTourTicket(formDataObj);
      alert('상품 등록 성공!');
      navigate('/product/tourTicket/list');
    } catch (error) {
      console.error('상품 등록 실패:', error);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{width: 500, p: 3, boxShadow: 3, borderRadius: 3}}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
            🎫 투어 & 티켓 상품 등록
          </Typography>

          <StyledForm onSubmit={handleSubmit} encType="multipart/form-data">
            {/* 상품명 입력 */}
            <TextField
              label="상품명"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />

            {/* 상품 설명 입력 */}
            <TextField
              label="상품 설명"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              multiline
              rows={3}
              fullWidth
            />

            {/* 국내 / 해외 구분 선택 */}
            <FormControl fullWidth>
              <InputLabel>지역 구분</InputLabel>
              <Select
                value={regionType}
                onChange={e => {
                  setRegionType(e.target.value);
                  setFormData({...formData, location: ''}); // 지역 선택 초기화
                }}
                input={<OutlinedInput label="지역 구분" />}>
                <MenuItem value="domestic">국내</MenuItem>
                <MenuItem value="international">해외</MenuItem>
              </Select>
            </FormControl>

            {/* 지역 선택 */}
            <FormControl fullWidth disabled={!regionType}>
              <InputLabel>지역 선택</InputLabel>
              <Select
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                input={<OutlinedInput label="지역 선택" />}>
                {(regionType === 'domestic'
                  ? domesticLocations
                  : internationalLocations
                ).map(loc => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 가격 입력 */}
            <TextField
              label="가격 (₩)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              fullWidth
            />

            {/* 재고 입력 */}
            <TextField
              label="재고 수량"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
              fullWidth
            />

            {/* 파일 업로드 */}
            <label htmlFor="upload-images">
              <FileInput
                id="upload-images"
                type="file"
                name="images"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button
                variant="contained"
                component="span"
                fullWidth
                sx={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  '&:hover': {backgroundColor: '#0056b3'}
                }}>
                이미지 업로드 ({formData.images.length}개 선택됨)
              </Button>
            </label>

            {/* 등록 버튼 */}
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: '#28a745',
                color: 'white',
                '&:hover': {backgroundColor: '#1e7e34'}
              }}
              fullWidth>
              등록하기
            </Button>
          </StyledForm>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TourTicketForm;
