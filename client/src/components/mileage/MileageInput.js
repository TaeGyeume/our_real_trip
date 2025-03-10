import React, {useState, useEffect} from 'react';
import {Box, Button, TextField, Typography} from '@mui/material';

const MileageInput = ({userMileage, totalPrice, onMileageChange}) => {
  const [usedMileage, setUsedMileage] = useState(''); // 문자열로 관리
  const [remainingMileage, setRemainingMileage] = useState(userMileage);

  useEffect(() => {
    // usedMileage가 ''이면 0으로 간주
    const usedNum = usedMileage === '' ? 0 : Number(usedMileage);
    setRemainingMileage(userMileage - usedNum);
  }, [usedMileage, userMileage]);

  // 최대 사용 가능 마일리지 계산
  const maxUsableMileage = Math.min(userMileage || 0, totalPrice);

  // 입력값 변경 시 처리
  const handleMileageChange = e => {
    // 사용자가 입력한 값(문자열)
    let inputValue = e.target.value;

    // 빈 값이면 0으로 처리 (또는 그냥 빈 문자열로 유지해도 됨)
    if (inputValue === '') {
      setUsedMileage('');
      onMileageChange(0);
      return;
    }

    // 숫자로 변환 가능한지 검사
    let numericValue = parseInt(inputValue, 10);
    if (isNaN(numericValue)) {
      numericValue = 0; // 숫자가 아니면 0으로
    }

    // 최대 사용 가능 마일리지를 초과하면 최대치로 제한
    if (numericValue > maxUsableMileage) {
      numericValue = maxUsableMileage;
    }

    // 최종적으로, 리드 제로를 제거한 문자열로 set
    setUsedMileage(String(numericValue));

    // 부모 콜백에도 숫자값 전달
    onMileageChange(numericValue);
  };

  // "모두 사용" 버튼
  const handleUseAllMileage = () => {
    setUsedMileage(String(maxUsableMileage));
    setRemainingMileage(userMileage - maxUsableMileage);
    onMileageChange(maxUsableMileage);
  };

  return (
    <Box
      sx={{
        border: '1px solid #ccc',
        borderRadius: 2,
        p: 2,
        maxWidth: 600,
        m: '0 auto'
      }}>
      <Typography variant="subtitle1" sx={{mb: 1}}>
        🎯 사용할 마일리지:
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1
        }}>
        <TextField
          type="number"
          value={usedMileage}
          onChange={handleMileageChange}
          inputProps={{
            min: 0,
            max: maxUsableMileage
          }}
          size="small"
          sx={{flexGrow: 1}}
        />
        <Button variant="outlined" size="small" onClick={handleUseAllMileage}>
          모두 사용
        </Button>
      </Box>

      <Typography variant="body2">
        보유 마일리지: {remainingMileage.toLocaleString()}P
      </Typography>
    </Box>
  );
};

export default MileageInput;
