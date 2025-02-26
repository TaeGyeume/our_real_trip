import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {createPackage} from '../../../api/package/packageService';
import {Container, TextField, Button, Typography, Grid} from '@mui/material';

const PackageCreate = () => {
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState({
    name: '',
    description: '',
    discountRate: '',
    startDate: '',
    endDate: '',
    category: ''
  });

  const handleChange = e => {
    setPackageData({...packageData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async () => {
    try {
      await createPackage(packageData);
      alert('패키지 등록 완료!');
      navigate('/packages'); // 목록 페이지로 이동
    } catch (error) {
      console.error('패키지 등록 실패:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        패키지 등록
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="패키지명"
            name="name"
            value={packageData.name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="설명"
            name="description"
            value={packageData.description}
            onChange={handleChange}
            multiline
            rows={4}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="할인율 (%)"
            name="discountRate"
            type="number"
            value={packageData.discountRate}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="카테고리"
            name="category"
            value={packageData.category}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="시작일"
            name="startDate"
            type="date"
            InputLabelProps={{shrink: true}}
            value={packageData.startDate}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="종료일"
            name="endDate"
            type="date"
            InputLabelProps={{shrink: true}}
            value={packageData.endDate}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Button variant="contained" color="primary" onClick={handleSubmit} sx={{mt: 2}}>
        패키지 등록
      </Button>
    </Container>
  );
};

export default PackageCreate;
