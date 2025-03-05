import * as React from 'react';
import {useColorScheme} from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Select, {SelectProps} from '@mui/material/Select';

export default function ColorModeSelect(props: SelectProps) {
  const {setMode} = useColorScheme(); // mode는 이제 필요없음
  return (
    <Select
      value="light" // 항상 라이트 모드만 선택 가능
      onChange={
        event => setMode(event.target.value as 'light') // 'light'만 설정
      }
      {...props}>
      <MenuItem value="light">Light</MenuItem>
    </Select>
  );
}
