import React from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  Slider
} from '@mui/material';

const FilterPanel = ({
  availableAirlines,
  selectedAirlines,
  setSelectedAirlines,
  availableSeatTypes,
  selectedSeatTypes,
  setSelectedSeatTypes,
  priceRange,
  setPriceRange,
  maxPrice
}) => {
  // 항공사 체크박스 토글
  const handleAirlineToggle = airline => {
    if (selectedAirlines.includes(airline)) {
      setSelectedAirlines(selectedAirlines.filter(a => a !== airline));
    } else {
      setSelectedAirlines([...selectedAirlines, airline]);
    }
  };

  // 좌석 종류 체크박스 토글
  const handleSeatTypeToggle = seatType => {
    if (selectedSeatTypes.includes(seatType)) {
      setSelectedSeatTypes(selectedSeatTypes.filter(s => s !== seatType));
    } else {
      setSelectedSeatTypes([...selectedSeatTypes, seatType]);
    }
  };

  // 가격 슬라이더 변경 핸들러
  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  return (
    <Box sx={{p: 2, border: '1px solid #ddd', borderRadius: 2}}>
      {/* 항공사 필터 영역 */}
      <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
        <Typography variant="subtitle1" sx={{fontWeight: 'bold', flexGrow: 1}}>
          항공사
        </Typography>
        <Button
          onClick={() => setSelectedAirlines(availableAirlines)}
          variant="text"
          sx={{fontSize: '0.75rem', minWidth: 'auto'}}>
          모두 체크
        </Button>
        <Button
          onClick={() => setSelectedAirlines([])}
          variant="text"
          sx={{fontSize: '0.75rem', minWidth: 'auto'}}>
          모두 해제
        </Button>
      </Box>
      <FormGroup>
        {availableAirlines.length > 0 ? (
          availableAirlines.map(airline => (
            <FormControlLabel
              key={airline}
              control={
                <Checkbox
                  checked={selectedAirlines.includes(airline)}
                  onChange={() => handleAirlineToggle(airline)}
                />
              }
              label={airline}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            선택 가능한 항공사가 없습니다.
          </Typography>
        )}
      </FormGroup>

      {/* 좌석 종류 필터 영역 */}
      <Box sx={{display: 'flex', alignItems: 'center', mt: 2, mb: 1}}>
        <Typography variant="subtitle1" sx={{fontWeight: 'bold', flexGrow: 1}}>
          좌석 종류
        </Typography>
        <Button
          onClick={() => setSelectedSeatTypes(availableSeatTypes)}
          variant="text"
          sx={{fontSize: '0.75rem', minWidth: 'auto'}}>
          모두 체크
        </Button>
        <Button
          onClick={() => setSelectedSeatTypes([])}
          variant="text"
          sx={{fontSize: '0.75rem', minWidth: 'auto'}}>
          모두 해제
        </Button>
      </Box>
      <FormGroup>
        {availableSeatTypes && availableSeatTypes.length > 0 ? (
          availableSeatTypes.map(seatType => (
            <FormControlLabel
              key={seatType}
              control={
                <Checkbox
                  checked={selectedSeatTypes.includes(seatType)}
                  onChange={() => handleSeatTypeToggle(seatType)}
                />
              }
              label={seatType}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            선택 가능한 좌석 종류가 없습니다.
          </Typography>
        )}
      </FormGroup>

      {/* 가격대 필터 영역 */}
      <Box sx={{mt: 2}}>
        <Typography variant="subtitle1" sx={{fontWeight: 'bold', mb: 1}}>
          가격대
        </Typography>
        <Slider
          value={priceRange}
          onChange={handlePriceChange}
          valueLabelDisplay="auto"
          valueLabelFormat={value => `${value.toLocaleString()}원`}
          min={0}
          max={maxPrice}
        />
        <Typography variant="body2" color="text.secondary">
          {priceRange[0].toLocaleString()}원 ~ {priceRange[1].toLocaleString()}원
        </Typography>
      </Box>
    </Box>
  );
};

export default FilterPanel;
