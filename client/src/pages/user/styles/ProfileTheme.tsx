import {createTheme} from '@mui/material/styles';

// 프로필 페이지에서만 쓰일 간단한 커스텀 테마 예시
const profileTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2' // 파란색
    },
    secondary: {
      main: '#f50057' // 핑크
    }
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 10 // 모서리 라운딩
  }
});

export default profileTheme;
