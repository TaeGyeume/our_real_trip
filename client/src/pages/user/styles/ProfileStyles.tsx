// client/src/pages/user/styles/ProfileStyles.tsx
import {styled} from '@mui/material/styles';
import {Container, Paper, Box} from '@mui/material';

// 최외곽 컨테이너
export const ProfileWrapper = styled(Container)(({theme}) => ({
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(5)
  // 배경색/이미지 등 원하는 스타일을 자유롭게
}));

// 프로필 정보 표시용 Paper
export const ProfilePaper = styled(Paper)(({theme}) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3]
}));

// 각 필드를 감싸는 Box
export const ProfileFieldBox = styled(Box)(({theme}) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1, 0)
}));
