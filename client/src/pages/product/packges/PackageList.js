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
  TextField,
  Button,
  Pagination,
  Box,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import HotelIcon from '@mui/icons-material/Hotel';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

// 헬퍼 함수: 이미지 경로 정규화 (역슬래시 -> 슬래시, 앞에 '/' 추가)
const normalizeImagePath = path => {
  let newPath = path.replace(/\\/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // 패키지 목록 가져오기
  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line
  }, [page]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      // 한 페이지당 6개씩, 검색어 search
      const data = await getPackages(page, 6, search);

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

  // 검색 버튼 클릭
  const handleSearch = () => {
    setPage(1);
    fetchPackages();
  };

  // 포함된 서비스(항공, 숙박, 투어) 정보를 추출하는 함수
  const getIncludedCategories = pkg => {
    const categories = [];
    if (pkg.flights && pkg.flights.length > 0) {
      categories.push({label: '항공', icon: <FlightTakeoffIcon />});
    }
    if (pkg.accommodations && pkg.accommodations.length > 0) {
      categories.push({label: '숙박/숙소', icon: <HotelIcon />});
    }
    if (pkg.tours && pkg.tours.length > 0) {
      categories.push({label: '투어/티켓', icon: <ConfirmationNumberIcon />});
    }
    return categories.slice(0, 3); // 최대 3개까지만 표시
  };

  // 패키지 상세보기
  const handleDetail = id => {
    navigate(`/package/${id}`);
  };

  // 수정 버튼
  const handleEdit = id => {
    // 수정 페이지로 이동
    navigate(`/packages/${id}/edit`);
  };

  // 삭제 버튼
  const handleDelete = async id => {
    if (!window.confirm('정말 이 패키지를 삭제하시겠습니까?')) return;

    try {
      await deletePackage(id);
      alert('패키지가 삭제되었습니다.');
      fetchPackages(); // 목록 새로고침
    } catch (error) {
      console.error('패키지 삭제 실패:', error);
      alert('패키지 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box sx={{minHeight: '100vh', py: 4}}>
      <Container sx={{maxWidth: '1000px'}}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{fontWeight: 'bold', textAlign: 'center', mb: 3}}>
          📦 관리자 패키지 목록
        </Typography>

        {/* 검색 바 */}
        <Box display="flex" gap={1} sx={{mb: 3, justifyContent: 'center'}}>
          <TextField
            label="패키지명을 검색하세요..."
            variant="outlined"
            fullWidth
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{maxWidth: 400}}
          />
          <Button variant="contained" color="primary" onClick={handleSearch}>
            검색
          </Button>
        </Box>

        {/* 로딩/에러 처리 */}
        {loading ? (
          <Typography variant="h6" align="center">
            로딩 중...
          </Typography>
        ) : error ? (
          <Typography variant="h6" align="center" color="error">
            {error}
          </Typography>
        ) : packages.length === 0 ? (
          <Typography variant="h6" align="center">
            등록된 패키지가 없습니다.
          </Typography>
        ) : (
          <>
            {/* 패키지 리스트 */}
            <Grid container spacing={2} justifyContent="center">
              {packages.map(pkg => {
                // 패키지 메인이미지
                const mainImage =
                  pkg.images && pkg.images.length > 0
                    ? `${SERVER_URL}${normalizeImagePath(pkg.images[0])}`
                    : '/default-image.jpg';

                return (
                  <Grid item xs={12} key={pkg._id}>
                    <Card
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        transition: '0.3s',
                        '&:hover': {boxShadow: 5}
                      }}>
                      {/* 왼쪽 이미지 (클릭 시 상세보기) */}
                      <CardMedia
                        component="img"
                        sx={{width: 180, height: 120, borderRadius: 2, cursor: 'pointer'}}
                        image={mainImage}
                        alt={`패키지 ${pkg.name}`}
                        onClick={() => handleDetail(pkg._id)}
                      />

                      {/* 오른쪽 텍스트 정보 */}
                      <CardContent sx={{flex: 1, pl: 2}}>
                        <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                          {pkg.name}
                        </Typography>

                        {/* 포함된 서비스 표시 */}
                        <Stack direction="row" spacing={1} sx={{mt: 1, mb: 1}}>
                          {getIncludedCategories(pkg).map((category, index) => (
                            <Chip
                              key={index}
                              icon={category.icon}
                              label={category.label}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Stack>

                        {/* 상세 정보 */}
                        <Typography variant="body2" color="text.secondary">
                          {pkg.description.length > 80
                            ? `${pkg.description.substring(0, 80)}...`
                            : pkg.description}
                        </Typography>

                        {/* 가격 정보 */}
                        <Box display="flex" alignItems="center" gap={1} sx={{mt: 1}}>
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
                        </Box>
                      </CardContent>

                      {/* 수정/삭제 버튼 영역 */}
                      <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                        <IconButton
                          color="warning"
                          onClick={() => handleEdit(pkg._id)}
                          sx={{mb: 1}}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(pkg._id)}>
                          <DeleteIcon />
                        </IconButton>
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
              sx={{mt: 4, display: 'flex', justifyContent: 'center'}}
            />
          </>
        )}
      </Container>
    </Box>
  );
};

export default PackageList;
