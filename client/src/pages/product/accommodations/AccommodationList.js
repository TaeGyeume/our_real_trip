import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import axios from '../../../api/axios';
import AccommodationCard from '../../../components/product/accommodations/AccommodationCard';
import SearchBar from '../../../components/product/accommodations/SearchBar';
import {Box, Typography, Button, CircularProgress} from '@mui/material';

const AccommodationList = ({limit = 6}) => {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const observerInstance = useRef(null);

  // 데이터 가져오기 함수 (검색 + 페이지네이션 적용)
  const fetchAccommodations = useCallback(
    async (pageNumber = 1, reset = false, searchValue = searchTerm) => {
      if (loadingRef.current || pageNumber > totalPages) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const endpoint = searchValue
          ? '/accommodations/searchByName'
          : '/accommodations/list';
        const params = searchValue
          ? {page: pageNumber, limit, name: searchValue}
          : {page: pageNumber, limit};

        const response = await axios.get(endpoint, {params});

        const result = response.data.accommodations || response.data;

        if (!Array.isArray(result)) {
          throw new Error('accommodations 배열이 없음!');
        }

        // 중복 제거 로직 적용
        setAccommodations(prev => {
          const uniqueAccommodations = new Map();
          [...(reset ? [] : prev), ...result].forEach(acc =>
            uniqueAccommodations.set(acc._id, acc)
          );
          return Array.from(uniqueAccommodations.values());
        });

        setTotalPages(response.data.totalPages || 1);

        // 검색 시 첫 번째 페이지를 불러온 경우, 페이지 초기화
        if (reset) setPage(1);
      } catch (err) {
        console.error('숙소 데이터를 불러오는 중 오류:', err);
        setError('숙소 정보를 불러오는 중 오류 발생');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [totalPages, limit, searchTerm]
  );

  // 검색어 변경 시 새로운 검색 실행 (무한 스크롤 유지)
  useEffect(() => {
    setAccommodations([]); // 기존 데이터 초기화
    fetchAccommodations(1, true, searchTerm); // 첫 페이지부터 다시 검색
  }, [searchTerm, fetchAccommodations]);

  // 페이지 변경 시 추가 데이터 로드
  useEffect(() => {
    if (page > 1 && !loadingRef.current) {
      fetchAccommodations(page);
    }
  }, [page, fetchAccommodations]);

  // totalPages 변경을 감지하여 무한 스크롤 다시 적용
  useEffect(() => {
    if (!observerRef.current) return;

    if (observerInstance.current) {
      observerInstance.current.disconnect();
    }

    observerInstance.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingRef.current && page < totalPages) {
          setPage(prev => prev + 1);
        }
      },
      {threshold: 1.0}
    );

    observerInstance.current.observe(observerRef.current);

    return () => {
      if (observerInstance.current) observerInstance.current.disconnect();
    };
  }, [totalPages, page]);

  if (error) return <div>{error}</div>;

  return (
    <Box sx={{maxWidth: 1200, mx: 'auto', mt: 3, px: 2}}>
      {/* 숙소 목록 제목 */}
      <Typography variant="h4" fontWeight="bold" mb={3} sx={{textAlign: 'center'}}>
        🏨 숙소 목록
      </Typography>

      {/* 검색 및 숙소 등록, 위치 리스트 버튼 */}
      {location.pathname !== '/product' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap'
          }}>
          <SearchBar onSearch={setSearchTerm} />

          <Button
            color="secondary"
            sx={{
              height: '56px',
              fontWeight: 'bold',
              px: 3,
              borderRadius: 2,
              transition: '0.3s'
            }}
            onClick={() => navigate('/product/accommodations/new')}>
            ➕ 숙소 등록
          </Button>

          <Button
            color="primary"
            sx={{
              height: '56px',
              fontWeight: 'bold',
              px: 3,
              borderRadius: 2,
              transition: '0.3s'
            }}
            onClick={() => navigate('/product/locations/list')}>
            📍 위치 리스트
          </Button>
        </Box>
      )}

      {/* 숙소 카드 리스트 (한 줄에 3개씩 정렬) */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2, // 카드 간격 조정
          justifyContent: 'center'
        }}>
        {accommodations.length > 0 ? (
          accommodations.map(acc => (
            <Box
              key={acc._id}
              sx={{width: {xs: '100%', sm: '48%', md: '32%'}, minWidth: 300}}>
              <AccommodationCard accommodation={acc} />
            </Box>
          ))
        ) : (
          <Typography variant="body1" textAlign="center" sx={{mt: 4, width: '100%'}}>
            숙소가 없습니다.
          </Typography>
        )}
      </Box>

      {/* 무한 스크롤 감지 요소 */}
      <Box ref={observerRef} sx={{height: '80px', background: 'transparent'}} />

      {/* 로딩 표시 */}
      {loading && (
        <Box sx={{display: 'flex', justifyContent: 'center', mt: 2}}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default AccommodationList;
