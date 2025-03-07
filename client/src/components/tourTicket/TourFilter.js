import React from 'react';
import {
  Slider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Button,
  Typography,
  FormGroup
} from '@mui/material';

const TourFilter = ({
  priceRange,
  setPriceRange,
  ratingFilter,
  setRatingFilter,
  regionType,
  setRegionType,
  selectedCities,
  setSelectedCities,
  domesticLocations,
  internationalLocations,
  handleResetFilters
}) => {
  return (
    <div className="user-list-filter">
      {' '}
      {/* 기존 UserList에서 필터 영역 유지 */}
      <Typography variant="h6" fontWeight="bold">
        필터
      </Typography>
      <Button onClick={handleResetFilters} sx={{float: 'right', color: 'gray'}}>
        초기화
      </Button>
      {/* 가격 필터 */}
      <Typography variant="subtitle1" fontWeight="bold" mt={2}>
        가격대
      </Typography>
      <Typography variant="subtitle1" fontWeight="bold" mt={1} sx={{color: 'dodgerblue'}}>
        {priceRange[0].toLocaleString()}원 ~ {priceRange[1].toLocaleString()}원
      </Typography>
      <Slider
        value={priceRange}
        onChange={(event, newValue) => setPriceRange(newValue)}
        min={0}
        max={100000}
        step={500}
        valueLabelDisplay="off"
        sx={{color: 'dodgerblue'}}
      />
      <hr className="sun" />
      {/* 평점 필터 */}
      <Typography variant="subtitle1" fontWeight="bold" mt={2}>
        평점
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
          <FormControlLabel
            value="all"
            control={<Radio sx={{'&.Mui-checked': {color: 'dodgerblue'}}} />}
            label="전체"
          />
          <FormControlLabel
            value="4"
            control={<Radio sx={{'&.Mui-checked': {color: 'dodgerblue'}}} />}
            label="4점 이상"
          />
          <FormControlLabel
            value="1"
            control={<Radio sx={{'&.Mui-checked': {color: 'dodgerblue'}}} />}
            label="1점 이하"
          />
        </RadioGroup>
      </FormControl>
      <hr className="sun" />
      {/* 국내/해외 필터 */}
      <Typography variant="subtitle1" fontWeight="bold" mt={2}>
        지역 구분
      </Typography>
      <FormControl fullWidth>
        <RadioGroup
          row
          value={regionType}
          onChange={e => {
            setRegionType(e.target.value);
            setSelectedCities([]);
          }}>
          <FormControlLabel
            value="domestic"
            control={<Radio sx={{'&.Mui-checked': {color: 'dodgerblue'}}} />}
            label="국내"
          />
          <FormControlLabel
            value="international"
            control={<Radio sx={{'&.Mui-checked': {color: 'dodgerblue'}}} />}
            label="해외"
          />
        </RadioGroup>
      </FormControl>
      {/* 여행지 필터 */}
      <Typography variant="subtitle1" fontWeight="bold" mt={2}>
        여행지
      </Typography>
      <FormGroup>
        {(regionType === 'domestic' ? domesticLocations : internationalLocations).map(
          city => (
            <FormControlLabel
              key={city}
              control={
                <Checkbox
                  checked={selectedCities.includes(city)}
                  onChange={e => {
                    const city = e.target.name;
                    setSelectedCities(prev =>
                      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
                    );
                  }}
                  name={city}
                />
              }
              label={city}
            />
          )
        )}
      </FormGroup>
    </div>
  );
};

export default TourFilter;
