import React, {useEffect, useState} from 'react';
import {Container, Box, Typography, CircularProgress, Alert} from '@mui/material';
import {fetchMileage, fetchMileageHistory} from '../../api/mileage/mileageService';
import MileageSummary from '../../components/mileage/MileageSummary';
import MileageHistory from '../../components/mileage/MileageHistory';
import {authAPI} from '../../api/auth';

const MileagePage = () => {
  const [userId, setUserId] = useState(null);
  const [totalMileage, setTotalMileage] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0); // 총 결제 금액
  const [membershipLevel, setMembershipLevel] = useState(''); // 내 등급 대신 membershipLevel 사용
  const [mileageHistory, setMileageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 유저 정보 가져오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await authAPI.getUserProfile();
        console.log('유저 정보:', userData);

        if (userData && userData._id) {
          setUserId(userData._id);
          // totalSpent와 membershipLevel 필드 사용 (membershipLevel 필드로 변경)
          setTotalSpent(userData.totalSpent || 0);
          setMembershipLevel(userData.membershipLevel || '');
        } else if (userData?.user?.id) {
          setUserId(userData.user.id);
          setTotalSpent(userData.user.totalSpent || 0);
          setMembershipLevel(userData.user.membershipLevel || '');
        } else {
          throw new Error('유효한 유저 ID를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('유저 정보 가져오기 실패:', err);
        setError('유저 정보를 불러올 수 없습니다.');
      }
    };

    fetchUserProfile();
  }, []);

  // 마일리지 및 내역 불러오기
  useEffect(() => {
    if (!userId) return;

    const loadMileageData = async () => {
      try {
        setLoading(true);
        const mileageData = await fetchMileage(userId);
        console.log('총 마일리지 API 응답:', mileageData);

        if (!mileageData || typeof mileageData.mileage === 'undefined') {
          throw new Error('마일리지 데이터가 유효하지 않습니다.');
        }
        setTotalMileage(mileageData.mileage || 0);

        const historyData = await fetchMileageHistory(userId);
        console.log('마일리지 내역 API 응답:', historyData);

        if (!Array.isArray(historyData)) {
          throw new Error('마일리지 내역 데이터가 유효하지 않습니다.');
        }
        setMileageHistory(historyData);
      } catch (error) {
        console.error('마일리지 데이터 불러오기 실패:', error.response ?? error.message);
        setError('마일리지 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadMileageData();
  }, [userId]);

  if (loading) {
    return (
      <Container sx={{textAlign: 'center', mt: 4}}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{mt: 4}}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{py: 4}}>
      <Typography variant="h4" align="center" gutterBottom>
        마일리지
      </Typography>
      {userId ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: {xs: 'column', md: 'row'},
            gap: 2
          }}>
          <Box sx={{flex: 1}}>
            <MileageSummary
              totalMileage={totalMileage}
              totalSpent={totalSpent}
              membershipLevel={membershipLevel} // membershipLevel prop 전달
            />
            <MileageHistory history={mileageHistory} />
          </Box>
        </Box>
      ) : (
        <Alert severity="error">유저 정보가 없습니다.</Alert>
      )}
    </Container>
  );
};

export default MileagePage;
