import React, {useEffect, useState} from 'react';
import {
  getTourTicketById,
  updateTourTicket
} from '../../../api/tourTicket/tourTicketService';
import {useParams, useNavigate} from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  IconButton,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';

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

const TourTicketModify = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [regionType, setRegionType] = useState('domestic');
  const [location, setLocation] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [deleteImages, setDeleteImages] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTourTicketById(id);
        setTicket(data);
        setTitle(data.title);
        setDescription(data.description);
        setPrice(data.price);
        setStock(data.stock);
        setLocation(data.location);
        setRegionType(
          domesticLocations.includes(data.location) ? 'domestic' : 'international'
        );
      } catch (error) {
        console.error('상품 정보를 불러오는 중 오류 발생:', error);
      }
    };

    fetchTicket();
  }, [id]);

  // useEffect(() => {
  //   if (regionType === 'domestic' && !domesticLocations.includes(location)) {
  //     setLocation(domesticLocations[0]);
  //   } else if (
  //     regionType === 'international' &&
  //     !internationalLocations.includes(location)
  //   ) {
  //     setLocation(internationalLocations[0]);
  //   }
  // }, [regionType]);

  const handleImageUpload = e => {
    const files = Array.from(e.target.files);
    const newImageURLs = files.map(file => URL.createObjectURL(file));
    setNewImages(prevImages => [...prevImages, ...newImageURLs]);
  };

  const handleImageDeleteToggle = image => {
    if (deleteImages.includes(image)) {
      setDeleteImages(deleteImages.filter(img => img !== image));
    } else {
      setDeleteImages([...deleteImages, image]);
    }
  };

  const handleRemoveImage = async image => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('deleteImages', JSON.stringify([image])); // 삭제할 이미지 배열 전송

      await updateTourTicket(id, formData);

      setTicket(prevTicket => ({
        ...prevTicket,
        images: prevTicket.images.filter(img => img !== image)
      }));
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      alert('이미지 삭제 실패');
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setDeleteImages(selectAll ? [] : ticket.images);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('regionType', regionType);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('deleteImages', JSON.stringify(deleteImages));
      newImages.forEach(img => formData.append('images', img));
      await updateTourTicket(id, formData);
      alert('상품이 수정되었습니다.');
      navigate(`/product/tourTicket/${id}`);
    } catch (error) {
      console.error('상품 수정 오류:', error);
      alert('수정 실패');
    }
  };

  return (
    <Paper elevation={3} sx={{padding: 4, maxWidth: 800, margin: 'auto', marginTop: 4}}>
      <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center">
        상품 수정
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box mb={2}>
          <TextField
            fullWidth
            label="상품명"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="상품 설명"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle1">지역 구분</Typography>
          <RadioGroup
            row
            value={regionType}
            onChange={e => {
              setRegionType(e.target.value);
            }}>
            <FormControlLabel value="domestic" control={<Radio />} label="국내" />
            <FormControlLabel value="international" control={<Radio />} label="해외" />
          </RadioGroup>
        </Box>
        <Box mb={2}>
          <FormControl fullWidth>
            <InputLabel variant="outlined">지역</InputLabel>
            <Select value={location} onChange={e => setLocation(e.target.value)} required>
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
        </Box>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            variant="outlined"
            fullWidth
            type="number"
            label="가격"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
          <TextField
            variant="outlined"
            fullWidth
            type="number"
            label="재고"
            value={stock}
            onChange={e => setStock(e.target.value)}
            required
          />
        </Box>
        <Typography variant="h6">기존 이미지</Typography>
        <FormControlLabel
          control={<Checkbox checked={selectAll} onChange={handleSelectAll} />}
          label="전체 선택"
        />
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          {ticket?.images.map((image, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection="column"
              alignItems="center"
              position="relative">
              <img
                src={`${SERVER_URL}${image}`}
                alt="기존 이미지"
                width="130"
                style={{borderRadius: 8}}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deleteImages.includes(image)}
                    onChange={() => handleImageDeleteToggle(image)}
                    label=""
                    sx={{position: 'absolute', top: 0, left: 0}}
                  />
                }
              />
              <IconButton onClick={() => handleRemoveImage(image)} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Typography variant="h6">추가할 이미지</Typography>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          {newImages.map((image, index) => (
            <Box key={index} display="flex" flexDirection="column" alignItems="center">
              <img src={image} alt="새 이미지" width="100" style={{borderRadius: 8}} />
            </Box>
          ))}
        </Box>
        <Box mb={2}>
          <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
            이미지 추가
            <input type="file" multiple hidden onChange={handleImageUpload} />
          </Button>
        </Box>
        <Box textAlign="center">
          <Button type="submit" variant="contained" color="primary" size="large">
            수정 완료
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default TourTicketModify;
