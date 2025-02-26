import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getPackageById, updatePackage} from '../../../api/package/packageService';
import {Container, TextField, Button, Typography} from '@mui/material';

const PackageEdit = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState({name: '', description: ''});

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

  const handleUpdate = async () => {
    try {
      await updatePackage(id, {
        name: packageData.name,
        description: packageData.description
      });
      navigate(`/package/${id}`);
    } catch (error) {
      console.error('패키지 수정 실패:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4">패키지 수정</Typography>
      <TextField
        label="패키지명"
        fullWidth
        value={packageData.name}
        onChange={e => setPackageData({...packageData, name: e.target.value})}
        sx={{mt: 2}}
      />
      <TextField
        label="설명"
        fullWidth
        multiline
        rows={4}
        value={packageData.description}
        onChange={e => setPackageData({...packageData, description: e.target.value})}
        sx={{mt: 2}}
      />

      <Button variant="contained" color="primary" onClick={handleUpdate} sx={{mt: 2}}>
        수정 완료
      </Button>
    </Container>
  );
};

export default PackageEdit;
