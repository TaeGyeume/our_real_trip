// import React, {useState} from 'react';
// import {useNavigate} from 'react-router-dom';
// import {createTourTicket} from '../../../api/tourTicket/tourTicketService';

// const locationOptions = [
//   '서울',
//   '경기도',
//   '강원도',
//   '충청북도',
//   '충청남도',
//   '전라북도',
//   '전라남도',
//   '경상북도',
//   '경상남도',
//   '제주도'
// ];

// const TourTicketForm = () => {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     location: '',
//     price: '',
//     stock: '',
//     images: []
//   });

//   const handleFileChange = e => {
//     setFormData({...formData, images: [...e.target.files]});
//   };

//   const handleChange = e => {
//     setFormData({...formData, [e.target.name]: e.target.value});
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     const formDataObj = new FormData();

//     formData.images.forEach(file => {
//       formDataObj.append('images', file);
//     });

//     formDataObj.append('title', formData.title);
//     formDataObj.append('description', formData.description);
//     formDataObj.append('location', formData.location);
//     formDataObj.append('price', formData.price);
//     formDataObj.append('stock', formData.stock);

//     try {
//       await createTourTicket(formDataObj);
//       alert('상품 등록 성공!');
//       navigate('/product/tourTicket/list');
//     } catch (error) {
//       console.error('상품 등록 실패:', error);
//     }
//   };

//   return (
//     <div>
//       <h2>투어 & 티켓 상품 등록</h2>
//       <form onSubmit={handleSubmit} encType="multipart/form-data">
//         <input
//           type="text"
//           name="title"
//           placeholder="상품명"
//           value={formData.title}
//           onChange={handleChange}
//           required
//         />
//         <textarea
//           name="description"
//           placeholder="상품 설명"
//           value={formData.description}
//           onChange={handleChange}
//           required
//         />
//         <select
//           name="location"
//           value={formData.location}
//           onChange={handleChange}
//           required>
//           <option value="">지역 선택</option>
//           {locationOptions.map(loc => (
//             <option key={loc} value={loc}>
//               {loc}
//             </option>
//           ))}
//         </select>
//         <input
//           type="number"
//           name="price"
//           placeholder="가격"
//           value={formData.price}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="number"
//           name="stock"
//           placeholder="재고"
//           value={formData.stock}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="file"
//           name="images"
//           multiple
//           accept="image/*"
//           onChange={handleFileChange}
//           required
//         />
//         <button type="submit">등록</button>
//       </form>
//     </div>
//   );
// };

// export default TourTicketForm;

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

const locationOptions = [
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

  const handleFileChange = e => {
    setFormData({...formData, images: [...e.target.files]});
  };

  const handleChange = e => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

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
            <TextField
              label="상품명"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />
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
            <FormControl fullWidth>
              <InputLabel>지역 선택</InputLabel>
              <Select
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                input={<OutlinedInput label="지역 선택" />}>
                {locationOptions.map(loc => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="가격 (₩)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              fullWidth
            />
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
