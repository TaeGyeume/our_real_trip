import React, {useState} from 'react';
import {TextField, Button, InputAdornment, Box} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({onSearch}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onSearch(searchTerm); // 부모 컴포넌트로 검색어 전달
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        maxWidth: 400 // 최대 너비 제한
      }}>
      {/* 검색 입력 필드 */}
      <TextField
        fullWidth
        variant="standard"
        placeholder="숙소 이름 검색"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          )
        }}
        sx={{flex: 1, bgcolor: 'white', borderRadius: 2}}
      />

      {/* 검색 버튼 */}
      <Button
        type="submit"
        variant="text"
        color="primary"
        sx={{
          px: 3, // 좌우 패딩 조정
          fontWeight: 'bold',
          borderRadius: 2,
          height: '56px' // 텍스트 필드와 높이 맞춤
        }}>
        검색
      </Button>
    </Box>
  );
};

export default SearchBar;
