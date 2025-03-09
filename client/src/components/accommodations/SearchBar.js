import React, {useState, useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import {fetchSuggestions} from '../../api/accommodation/accommodationService';
import {
  TextField,
  Button,
  Autocomplete,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  OutlinedInput,
  Stack,
  Paper
} from '@mui/material';
import {LocalizationProvider, DatePicker} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {Add, Remove} from '@mui/icons-material';

const SearchBar = ({onSearch}) => {
  const [searchParams] = useSearchParams();

  // URL에서 초기값 가져오기
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('city') || '서울');
  const [startDate, setStartDate] = useState(() =>
    searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : new Date()
  );
  const [endDate, setEndDate] = useState(() =>
    searchParams.get('endDate')
      ? new Date(searchParams.get('endDate'))
      : new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [adults, setAdults] = useState(() => Number(searchParams.get('adults')) || 1);
  const [suggestions, setSuggestions] = useState([]);

  // URL 변경 시 상태 업데이트
  useEffect(() => {
    setSearchTerm(searchParams.get('city') || '서울');
    setStartDate(
      searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : new Date()
    );
    setEndDate(
      searchParams.get('endDate')
        ? new Date(searchParams.get('endDate'))
        : new Date(new Date().setDate(new Date().getDate() + 1))
    );
    setAdults(Number(searchParams.get('adults')) || 1);
  }, [searchParams]);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      let results = await fetchSuggestions(searchTerm);

      // 옵션을 객체 배열로 변환
      if (Array.isArray(results)) {
        results = results.map(item => (typeof item === 'string' ? {name: item} : item));
      }

      setSuggestions(results);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 검색 실행 함수
  const handleSearch = () => {
    onSearch({
      searchTerm,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      adults
    });
  };

  // 검색어 하이라이트 적용 (정확히 일치하는 부분만)
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{color: 'blue', fontWeight: 'bold'}}>
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper
        elevation={3}
        sx={{
          width: '100%', // 전체 너비 적용
          mx: 0, // 좌우 여백 제거
          p: 3,
          borderRadius: 0, // 둥근 모서리 제거하여 전체 너비 채우기
          backgroundColor: 'white',
          boxShadow: 0
        }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between" // 좌우로 끝까지 배치
          sx={{width: '100%', px: 3}} // 내부 요소도 너비를 채우도록 조정
        >
          {/* 여행지 입력 */}
          <Autocomplete
            freeSolo
            options={suggestions}
            getOptionLabel={option =>
              typeof option === 'string' ? option : option?.name || ''
            }
            onInputChange={(event, newValue) => setSearchTerm(newValue)}
            value={searchTerm}
            renderOption={(props, option) => {
              const {key, ...restProps} = props; // key 속성을 분리
              return (
                <li key={option.id || option.name} {...restProps}>
                  {' '}
                  {/* key를 별도로 설정 */}
                  <Typography>{highlightMatch(option.name, searchTerm)}</Typography>
                </li>
              );
            }}
            renderInput={params => (
              <TextField {...params} label="여행지" variant="outlined" fullWidth />
            )}
            sx={{flex: 1, minWidth: '250px'}}
          />

          {/* 체크인 날짜 선택 */}
          <DatePicker
            label="체크인"
            value={startDate}
            onChange={newDate => setStartDate(newDate)}
            renderInput={params => <TextField {...params} fullWidth />}
            sx={{flex: 1, minWidth: '180px'}} // 크기 조정
          />

          {/* 체크아웃 날짜 선택 */}
          <DatePicker
            label="체크아웃"
            value={endDate}
            onChange={newDate => setEndDate(newDate)}
            renderInput={params => <TextField {...params} fullWidth />}
            minDate={startDate}
            sx={{flex: 1, minWidth: '180px'}} // 크기 조정
          />

          {/* 성인 수 선택 */}
          <FormControl sx={{flex: 1, minWidth: '160px'}}>
            <InputLabel shrink htmlFor="adult-count">
              성인
            </InputLabel>
            <OutlinedInput
              id="adult-count"
              notched
              label="성인"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '56px',
                padding: '0 8px', // 내부 패딩 조정
                borderRadius: '5px'
              }}
              startAdornment={
                <IconButton
                  onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                  size="small"
                  sx={{padding: '4px'}} // 버튼 크기 줄임
                >
                  <Remove fontSize="small" />
                </IconButton>
              }
              endAdornment={
                <IconButton
                  onClick={() => setAdults(prev => prev + 1)}
                  size="small"
                  sx={{padding: '4px'}} // 버튼 크기 줄임
                >
                  <Add fontSize="small" />
                </IconButton>
              }
              inputProps={{
                style: {
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '24px' // 숫자가 중앙 정렬되도록 조정
                }
              }}
              value={adults}
              readOnly
            />
          </FormControl>

          {/* 숙소 검색 버튼 */}
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              flexShrink: 0,
              minWidth: '140px',
              height: '56px'
            }}>
            검색
          </Button>
        </Stack>
      </Paper>
    </LocalizationProvider>
  );
};

export default SearchBar;
