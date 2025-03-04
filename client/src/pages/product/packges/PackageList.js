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

// 서버 주소
const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 이미지 경로 정규화
const normalizeImagePath = path => {
  // 역슬래시 -> 슬래시
  let newPath = path.replace(/\\/g, '/');
  // 앞에 '/' 없으면 추가
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

const PackageList = () => {
  const navigate = useNavigate();

  // 패키지 목록 상태
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 패키지 목록 불러오기
  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line
  }, [page]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      // 한 페이지당 6개씩
      const data = await getPackages(page, 6);

      if (Array.isArray(data.packages)) {
        setPackages(data.packages);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('서버 응답이 올바르지 않음:', data);
        setError('서버 응답이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('패키지 목록 불러오기 실패:', err);
      setError('패키지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상세보기
  const handleDetail = id => {
    navigate(`/package/${id}`);
  };

  // 수정
  const handleEdit = id => {
    navigate(`/packages/${id}/edit`);
  };

  // 삭제
  const handleDelete = async id => {
    if (!window.confirm('정말 이 패키지를 삭제하시겠습니까?')) return;

    try {
      await deletePackage(id);
      alert('패키지가 삭제되었습니다.');
      fetchPackages(); // 삭제 후 목록 재호출
    } catch (err) {
      console.error('패키지 삭제 실패:', err);
      alert('패키지 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box sx={{py: 2}}>
      <Container maxWidth="lg">
        {/* 제목 왼쪽 정렬 */}
        <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
          패키지 목록
        </Typography>

        {loading ? (
          <Typography variant="h6">로딩 중...</Typography>
        ) : error ? (
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        ) : packages.length === 0 ? (
          <Typography variant="h6">등록된 패키지가 없습니다.</Typography>
        ) : (
          <>
            {/* 카드들을 왼쪽 정렬로 나열 */}
            <Grid container spacing={2} justifyContent="flex-start">
              {packages.map(pkg => {
                // 메인 이미지
                const mainImage =
                  pkg.images && pkg.images.length > 0
                    ? SERVER_URL + normalizeImagePath(pkg.images[0])
                    : '/default-image.jpg';

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={pkg._id}>
                    <Card
                      sx={{
                        maxWidth: 280,
                        borderRadius: 3,
                        boxShadow: 3,
                        mb: 2,
                        transition: '0.3s',
                        cursor: 'pointer',
                        '&:hover': {boxShadow: 6}
                      }}>
                      {/* 이미지 (클릭 시 상세보기 이동) */}
                      <CardMedia
                        component="img"
                        height="200"
                        image={mainImage}
                        alt={pkg.name}
                        onClick={() => handleDetail(pkg._id)}
                      />

                      {/* 카드 내용 */}
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" sx={{mb: 1}}>
                          {pkg.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                          {pkg.description.length > 80
                            ? pkg.description.substring(0, 80) + '...'
                            : pkg.description}
                        </Typography>

                        {/* 가격 정보 */}
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

                      {/* 수정/삭제 버튼 */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          px: 2,
                          pb: 2
                        }}>
                        {/* 수정 버튼 (오렌지색) */}
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: '#f57c00',
                            '&:hover': {bgcolor: '#ef6c00'}
                          }}
                          startIcon={<EditIcon />}
                          onClick={e => {
                            e.stopPropagation();
                            handleEdit(pkg._id);
                          }}>
                          수정
                        </Button>

                        {/* 삭제 버튼 (빨간색) */}
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: '#d32f2f',
                            '&:hover': {bgcolor: '#c62828'}
                          }}
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

            {/* 페이지네이션 */}
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              sx={{mt: 2}}
            />
          </>
        )}
      </Container>
    </Box>
  );
};

export default PackageList;
