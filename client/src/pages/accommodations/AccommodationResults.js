import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useSearchParams} from 'react-router-dom';
import {searchAccommodations} from '../../api/accommodation/accommodationService';
import {getUserFavorites} from '../../api/user/favoriteService'; // 즐겨찾기 목록 가져오기 추가
import {SearchBar, FilterPanel, AccommodationCard} from '../../components/accommodations';
import {Box} from '@mui/material';

// 오늘 날짜를 YYYY-MM-DD 포맷으로 반환하는 함수
const getFormattedDate = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
};

const AccommodationResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accommodations, setAccommodations] = useState([]);
  const [favorites, setFavorites] = useState([]); // 즐겨찾기 목록 추가
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);
  const loadingRef = useRef(false); // 중복 요청 방지

  // 필터 상태 (초기값 설정 + URL 인코딩 해결)
  const [filters, setFilters] = useState(() => ({
    city: decodeURIComponent(searchParams.get('city') || '서울'),
    startDate: searchParams.get('startDate') || getFormattedDate(1),
    endDate: searchParams.get('endDate') || getFormattedDate(2),
    adults: Number(searchParams.get('adults')) || 1,
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 500000,
    category: searchParams.get('category') || 'all',
    sortBy: searchParams.get('sortBy') || 'default'
  }));

  // 즐겨찾기 목록 불러오기
  const fetchFavorites = async () => {
    try {
      const response = await getUserFavorites();
      setFavorites(response.favorites.map(fav => fav.itemId)); // 즐겨찾기 ID만 저장
    } catch (error) {
      // console.error('즐겨찾기 목록 가져오기 오류:', error);
    }
  };

  // 숙소 데이터 불러오기 함수
  const fetchAccommodations = useCallback(
    async (updatedFilters, newPage = 1, reset = false) => {
      if (loadingRef.current || newPage > totalPages) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        // console.log('검색 요청 params:', {...updatedFilters, page: newPage});
        const {accommodations: newData, totalPages: newTotalPages} =
          await searchAccommodations(updatedFilters, newPage);

        setAccommodations(prev => {
          const uniqueAccommodations = new Map();
          [...(reset ? [] : prev), ...newData].forEach(acc =>
            uniqueAccommodations.set(acc._id, acc)
          );
          return Array.from(uniqueAccommodations.values());
        });

        setTotalPages(newTotalPages);
        setPage(reset ? 1 : newPage);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [totalPages]
  );

  // 즐겨찾기 상태 업데이트 함수
  const handleFavoriteToggle = (itemId, newStatus) => {
    setFavorites(prevFavorites => {
      if (newStatus) {
        return [...prevFavorites, itemId]; // 추가
      } else {
        return prevFavorites.filter(id => id !== itemId); // 제거
      }
    });
  };

  // 검색 실행 (SearchBar에서 호출)
  const handleSearch = ({searchTerm, startDate, endDate, adults}) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
      alert('유효한 검색어를 입력해주세요!');
      return;
    }

    searchTerm = searchTerm.trim() || '서울';

    const newFilters = {...filters, city: searchTerm, startDate, endDate, adults};
    setFilters(newFilters);
    setSearchParams(newFilters);
    fetchAccommodations(newFilters, 1, true); // 검색 요청 실행 (데이터 초기화)
  };

  // 필터 변경 시 API 요청 실행
  const handleFilterChange = useCallback(newFilters => {
    setFilters(prev => ({...prev, ...newFilters}));
  }, []);

  useEffect(() => {
    setSearchParams(filters); // 렌더링 후에 실행
    fetchAccommodations(filters, 1, true); // 렌더링 후에 실행
  }, [filters, setSearchParams, fetchAccommodations]);

  // 숙소 데이터를 불러올 때 즐겨찾기도 함께 불러오기
  useEffect(() => {
    fetchAccommodations(filters, 1, true);
    fetchFavorites(); // 즐겨찾기 목록도 가져오기
  }, [filters, fetchAccommodations]);

  // 푸터 위에서 observer 감지하도록 설정
  useEffect(() => {
    fetchAccommodations(filters, 1, true);
    fetchFavorites();
  }, [filters, fetchAccommodations]);

  // Intersection Observer (푸터보다 위에서 감지되도록 조정)
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchAccommodations(filters, page + 1);
        }
      },
      {rootMargin: '100px'}
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [filters, page, fetchAccommodations]);

  return (
    <div className="container mt-3">
      <h2>숙소 검색 결과</h2>

      <SearchBar onSearch={handleSearch} />

      <Box
        sx={{
          width: '100%',
          height: '2px',
          backgroundColor: '#ccc',
          mb: 2,
          marginTop: '10px'
        }}
      />

      <div className="row mt-3">
        <div className="col-md-3">
          <FilterPanel onFilterChange={handleFilterChange} />
        </div>

        <div className="col-md-9">
          {accommodations.map(acc => (
            <AccommodationCard
              key={acc._id}
              accommodation={acc}
              queryOptions={filters}
              isFavorite={favorites.includes(acc._id)} // 즐겨찾기 여부 전달
              onFavoriteToggle={handleFavoriteToggle} // 즐겨찾기 상태 변경 함수 전달
            />
          ))}
          <div ref={observerRef} style={{height: '50px', background: 'transparent'}} />
          {loading && <p className="text-center mt-2">로딩 중...</p>}
        </div>
      </div>
    </div>
  );
};

export default AccommodationResults;
