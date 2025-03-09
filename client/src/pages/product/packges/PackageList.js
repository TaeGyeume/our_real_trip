import React, {useEffect, useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SERVER_URL =
  process.env.REACT_APP_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ourrealtrip.shop/api';

//  이미지 경로 정리 함수
const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

const PackageList = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleCreatePackage = () => {
    navigate('/product/package/create');
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
    <Box sx={{py: 4}}>
      <Container maxWidth="lg">
        {/* 패키지 목록 제목 + 패키지 생성 버튼 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
          <Typography variant="h4" fontWeight="bold">
            📦 패키지 목록
          </Typography>

          {/*  현재 경로가 '/product/packages/list'일 때만 '패키지 생성' 버튼 표시 */}
          {location.pathname === '/product/packages/list' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleCreatePackage}>
              패키지 생성
            </Button>
          )}
        </Box>

        {/* 패키지 리스트 */}
        {loading ? (
          <Typography variant="h6">로딩 중...</Typography>
        ) : error ? (
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {packages.map(pkg => {
              const mainImage =
                pkg.images && pkg.images.length > 0
                  ? SERVER_URL + normalizeImagePath(pkg.images[0])
                  : '/default-image.jpg';

              return (
                <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: 3,
                      transition: '0.3s',
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
                      <Typography variant="h6" fontWeight="bold">
                        {pkg.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pkg.description.length > 80
                          ? pkg.description.substring(0, 80) + '...'
                          : pkg.description}
                      </Typography>
                    </CardContent>

                    {/*  수정 & 삭제 버튼 유지 */}
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
                        color="warning"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(pkg._id)}>
                        수정
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(pkg._id)}>
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

export default PackageList;
