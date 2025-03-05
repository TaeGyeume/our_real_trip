import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getPackages, deletePackage} from '../../../api/package/packageService';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Box,
  Button,
  Pagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

const AdminPackageList = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPackages();
  }, [page]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPackages(page, 6);
      if (Array.isArray(data.packages)) {
        setPackages(data.packages);
        setTotalPages(data.totalPages || 1);
      } else {
        setError('서버 응답이 올바르지 않습니다.');
      }
    } catch (err) {
      setError('패키지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = id => {
    navigate(`/package/${id}`);
  };

  const handleEdit = id => {
    navigate(`/packages/${id}/edit`);
  };

  const handleDelete = async id => {
    if (!window.confirm('정말 이 패키지를 삭제하시겠습니까?')) return;
    try {
      await deletePackage(id);
      alert('패키지가 삭제되었습니다.');
      fetchPackages();
    } catch (err) {
      alert('패키지 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box sx={{py: 2}}>
      <Container maxWidth="lg">
        {/* 상단 패키지 생성 버튼 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
          <Typography variant="h5" sx={{fontWeight: 'bold'}}>
            📦 패키지 목록
          </Typography>
        </Box>

        {loading ? (
          <Typography variant="h6">로딩 중...</Typography>
        ) : error ? (
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        ) : (
          <Grid container spacing={2} justifyContent="flex-start">
            {packages.map(pkg => {
              const mainImage =
                pkg.images && pkg.images.length > 0
                  ? SERVER_URL + normalizeImagePath(pkg.images[0])
                  : '/default-image.jpg';

              return (
                <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                  <Card
                    sx={{
                      width: '100%',
                      borderRadius: 3,
                      boxShadow: 3,
                      mb: 2,
                      transition: '0.3s',
                      cursor: 'pointer',
                      '&:hover': {boxShadow: 6}
                    }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={mainImage}
                      alt={pkg.name}
                      onClick={() => handleDetail(pkg._id)}
                    />
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{mb: 1}}>
                        {pkg.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                        {pkg.description.length > 80
                          ? pkg.description.substring(0, 80) + '...'
                          : pkg.description}
                      </Typography>
                      {pkg.discountRate > 0 ? (
                        <>
                          <Typography
                            variant="body2"
                            sx={{textDecoration: 'line-through', color: 'gray'}}>
                            {pkg.price.toLocaleString()}원
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{fontWeight: 'bold', color: 'red'}}>
                            {pkg.finalPrice.toLocaleString()}원
                          </Typography>
                          <Typography variant="caption" sx={{color: 'blue'}}>
                            ({pkg.discountRate}% 할인)
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                          {pkg.finalPrice.toLocaleString()}원
                        </Typography>
                      )}
                    </CardContent>

                    {/* 수정 & 삭제 버튼 (관리자 페이지에만 표시) */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        px: 2,
                        pb: 2
                      }}>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{bgcolor: '#f57c00', '&:hover': {bgcolor: '#ef6c00'}}}
                        startIcon={<EditIcon />}
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(pkg._id);
                        }}>
                        수정
                      </Button>

                      <Button
                        variant="contained"
                        size="small"
                        sx={{bgcolor: '#d32f2f', '&:hover': {bgcolor: '#c62828'}}}
                        startIcon={<DeleteIcon />}
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(pkg._id);
                        }}>
                        삭제
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* 페이지네이션 */}
        <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPackageList;
