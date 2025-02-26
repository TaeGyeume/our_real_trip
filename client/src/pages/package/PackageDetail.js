import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {getPackageById} from '../../api/package/packageService';
import {Container, Typography, Button} from '@mui/material';

const PackageDetail = () => {
  const {id} = useParams();
  const [packageData, setPackageData] = useState(null);

  useEffect(() => {
    fetchPackage();
  }, []);

  const fetchPackage = async () => {
    try {
      const data = await getPackageById(id);
      setPackageData(data);
    } catch (error) {
      console.error('패키지 조회 실패:', error);
    }
  };

  if (!packageData) return <Typography>로딩 중...</Typography>;

  return (
    <Container>
      <Typography variant="h4">{packageData.name}</Typography>
      <Typography variant="body1">{packageData.description}</Typography>
      <Typography variant="h6">가격: {packageData.price.toLocaleString()}원</Typography>

      <Button variant="contained" color="primary" sx={{mt: 2}}>
        예약하기
      </Button>
    </Container>
  );
};

export default PackageDetail;
