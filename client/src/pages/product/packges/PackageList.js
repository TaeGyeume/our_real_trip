import React, {useEffect, useState} from 'react';
import {getPackages, deletePackage} from '../../../api/package/packageService';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Button,
  Pagination
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, [page]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPackages(page, 3); // 한 페이지당 3개 표시

      if (Array.isArray(data.packages)) {
        setPackages(data.packages);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('서버 응답이 올바르지 않음:', data);
        setError('서버 응답이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('패키지 목록 불러오기 실패:', error);
      setError('패키지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 패키지 삭제 함수
  const handleDelete = async id => {
    if (window.confirm('정말 이 패키지를 삭제하시겠습니까?')) {
      try {
        await deletePackage(id);
        alert('패키지가 삭제되었습니다.');
        fetchPackages(); // 삭제 후 목록 새로고침
      } catch (error) {
        console.error('패키지 삭제 실패:', error);
        alert('패키지 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 패키지 수정 페이지로 이동
  const handleEdit = id => {
    navigate(`/packages/${id}/edit`);
  };

  // 패키지 상세 페이지로 이동
  const handleDetail = id => {
    navigate(`/package/${id}`);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        📦 관리자 패키지 목록
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
          <Grid container spacing={3} alignItems="stretch">
            {packages.map(pkg => {
              const packageImages = pkg.images && pkg.images.length > 0 ? pkg.images : [];
              const accommodationImages =
                pkg.accommodations && pkg.accommodations.length > 0
                  ? pkg.accommodations[0].images || []
                  : [];
              const tourImages =
                pkg.tours && pkg.tours.length > 0
                  ? pkg.tours.flatMap(tour => tour.images || [])
                  : [];

              const images = [...packageImages, ...accommodationImages, ...tourImages];

              return (
                <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                  <Card sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                    {/* 이미지 클릭 시 상세보기 이동 */}
                    <div
                      style={{
                        width: '100%',
                        height: '250px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDetail(pkg._id)}>
                      {images.length > 0 ? (
                        <img
                          src={`${SERVER_URL}${images[0]}`}
                          alt={`패키지 ${pkg.name}`}
                          style={{
                            width: '100%',
                            height: '250px',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                        />
                      ) : (
                        <img
                          src={'/default-image.jpg'}
                          alt={`패키지 ${pkg.name}`}
                          style={{
                            width: '100%',
                            height: '250px',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                        />
                      )}
                    </div>

                    <CardContent sx={{flexGrow: 1}}>
                      <Typography variant="h6">{pkg.name}</Typography>
                      <Typography variant="body2">{pkg.description}</Typography>
                      <Typography variant="subtitle1">
                        가격: {pkg.price ? pkg.price.toLocaleString() : '가격 정보 없음'}{' '}
                        원
                      </Typography>
                    </CardContent>

                    {/* 수정 및 삭제 버튼 추가 */}
                    <CardActions sx={{justifyContent: 'space-between'}}>
                      <IconButton onClick={() => handleEdit(pkg._id)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(pkg._id)} color="secondary">
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
            sx={{mt: 3, display: 'flex', justifyContent: 'center'}}
          />
        </>
      )}
    </Container>
  );
};

export default PackageList;
