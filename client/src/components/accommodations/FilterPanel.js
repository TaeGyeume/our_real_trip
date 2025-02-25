import React, {useState, useEffect, useRef} from 'react';
import Slider from 'react-slider';
import './styles/FilterPanel.css';

const FilterPanel = ({onFilterChange}) => {
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const debounceRef = useRef(null); // 마지막 요청 시간을 저장하는 ref
  const prevFiltersRef = useRef(null);

  // 필터 변경 시 자동 적용 (디바운스 적용)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const newFilters = {
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        category,
        sortBy
      };

      // 이전 필터 값과 비교하여 변경된 경우에만 실행
      if (JSON.stringify(prevFiltersRef.current) !== JSON.stringify(newFilters)) {
        onFilterChange(newFilters);
        prevFiltersRef.current = newFilters; // 현재 필터 값 저장
      }
    }, 500); // 500ms 동안 추가 입력이 없을 때만 실행

    return () => clearTimeout(debounceRef.current);
  }, [priceRange, category, sortBy, onFilterChange]); // 의존성 배열에 필터 값 포함

  return (
    <div className="card p-3">
      <h5>필터</h5>
      <div className="mb-3">
        <label>가격 (1박 기준 요금)</label>
        <p className="price-range">
          <span className="price-text">{priceRange[0].toLocaleString()}원</span> -{' '}
          <span className="price-text">
            {priceRange[1].toLocaleString()}
            {priceRange[1] === 500000 ? '+' : ''}원
          </span>
        </p>

        <Slider
          className="price-slider"
          min={0}
          max={500000}
          step={10000} // 가격 조정 단위
          value={priceRange}
          onChange={setPriceRange}
        />

        <div className="d-flex justify-content-between">
          <span className="text-muted">0원</span>
          <span className="text-muted">500,000원+</span>
        </div>
      </div>

      <div className="mb-2">
        <label>숙소 유형</label>
        <select
          className="form-select"
          value={category}
          onChange={e => setCategory(e.target.value)}>
          <option value="all">전체</option>
          <option value="Hotel">호텔</option>
          <option value="Pension">펜션</option>
          <option value="Resort">리조트</option>
          <option value="Motel">모텔</option>
        </select>
      </div>

      <div className="mb-2">
        <label>정렬 기준</label>
        <select
          className="form-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}>
          <option value="default">기본순</option>
          <option value="priceLow">가격 낮은 순</option>
          <option value="priceHigh">가격 높은 순</option>
          <option value="rating">평점순</option>
        </select>
      </div>

      {/* 기존 버튼은 그대로 유지 (필요하면 추가 클릭 가능) */}
      {/* <button
        className="btn btn-primary mt-2"
        onClick={() =>
          onFilterChange({
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            category,
            sortBy
          })
        }>
        필터 적용
      </button> */}
    </div>
  );
};

export default FilterPanel;
