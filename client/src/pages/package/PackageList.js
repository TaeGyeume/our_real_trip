import React, {useEffect, useState} from 'react';
import {getPackages} from '../../api/package/packageService';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Pagination
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState('');
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

  const handleSearch = () => {
    setPage(1);
    fetchPackages();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        패키지 목록
      </Typography>

      <TextField
        label="검색"
        variant="outlined"
        fullWidth
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{mb: 2}}
      />
      <Button variant="contained" color="primary" onClick={handleSearch} sx={{mb: 2}}>
        검색
      </Button>

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
          <Grid container spacing={3}>
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
                  <Card
                    onClick={() => navigate(`/package/${pkg._id}`)}
                    sx={{
                      cursor: 'pointer',
                      height: '400px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                    <div style={{width: '100%', height: '250px', overflow: 'hidden'}}>
                      {images.length > 1 ? (
                        <Slider
                          dots={true}
                          infinite={true}
                          speed={500}
                          slidesToShow={1}
                          slidesToScroll={1}>
                          {images.map((img, index) => (
                            <img
                              key={index}
                              src={`${SERVER_URL}${img}`}
                              alt={`패키지 ${pkg.name}`}
                              style={{
                                width: '100%',
                                height: '250px',
                                objectFit: 'cover',
                                objectPosition: 'center'
                              }}
                            />
                          ))}
                        </Slider>
                      ) : (
                        <img
                          src={
                            images.length > 0
                              ? `${SERVER_URL}${images[0]}`
                              : '/default-image.jpg'
                          }
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

                    <CardContent style={{flexGrow: 1}}>
                      <Typography variant="h6">{pkg.name}</Typography>
                      <Typography variant="body2">{pkg.description}</Typography>
                      <Typography variant="subtitle1">
                        가격: {pkg.price ? pkg.price.toLocaleString() : '가격 정보 없음'}
                        원
                      </Typography>
                    </CardContent>
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
