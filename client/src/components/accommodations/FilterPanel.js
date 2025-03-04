import React, {useState, useEffect, useRef} from 'react';
import {
  Box,
  Slider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Stack,
  CircularProgress
} from '@mui/material';

const FilterPanel = ({onFilterChange}) => {
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef(null);
  const prevFiltersRef = useRef(null);

  // 필터 변경 시 자동 적용 (디바운스 적용)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(() => {
      const newFilters = {
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        category,
        sortBy
      };

      if (JSON.stringify(prevFiltersRef.current) !== JSON.stringify(newFilters)) {
        onFilterChange(newFilters);
        prevFiltersRef.current = newFilters;
      }

      setIsLoading(false);
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [priceRange, category, sortBy, onFilterChange]);

  return (
    <Card sx={{p: 3, borderRadius: 2, boxShadow: 3, maxWidth: 320}}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          🏨 필터
        </Typography>

        {/* 로딩 표시 */}
        {isLoading && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{mb: 2}}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              필터 적용 중...
            </Typography>
          </Stack>
        )}

        {/* 가격 슬라이더 */}
        <Box sx={{my: 2}}>
          <Typography variant="subtitle1" fontWeight="bold">
            가격 (1박 기준)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {priceRange[0].toLocaleString()}원 - {priceRange[1].toLocaleString()}
            {priceRange[1] === 500000 ? '+' : ''}원
          </Typography>
          <Slider
            value={priceRange}
            onChange={(_, newValue) => setPriceRange(newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={500000}
            step={10000}
            sx={{mt: 1}}
          />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">0원</Typography>
            <Typography variant="caption">500,000원+</Typography>
          </Stack>
        </Box>

        {/* 숙소 유형 선택 */}
        <FormControl fullWidth sx={{my: 2}}>
          <InputLabel>숙소 유형</InputLabel>
          <Select
            value={category}
            onChange={e => setCategory(e.target.value)}
            label="숙소 유형">
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="Hotel">호텔</MenuItem>
            <MenuItem value="Pension">펜션</MenuItem>
            <MenuItem value="Resort">리조트</MenuItem>
            <MenuItem value="Motel">모텔</MenuItem>
          </Select>
        </FormControl>

        {/* 정렬 기준 선택 */}
        <FormControl fullWidth sx={{my: 2}}>
          <InputLabel>정렬 기준</InputLabel>
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            label="정렬 기준">
            <MenuItem value="default">기본순</MenuItem>
            <MenuItem value="priceLow">가격 낮은 순</MenuItem>
            <MenuItem value="priceHigh">가격 높은 순</MenuItem>
            <MenuItem value="rating">평점순</MenuItem>
          </Select>
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
