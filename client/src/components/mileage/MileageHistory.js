import React, {useState} from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Divider,
  Tabs,
  Tab,
  TextField,
  Pagination
} from '@mui/material';

/** 문자열에서 Z를 제거하고 dayjs로 파싱 (KST로 저장된 날짜를 그대로 로컬 시간으로) */
const parseAsLocalKST = dateString => {
  // 예: "2025-03-05T14:53:45.197Z" → "2025-03-05T14:53:45.197"
  const localString = dateString.replace(/Z$/, '');
  return dayjs(localString);
};

const MileageHistory = ({history}) => {
  const [tabValue, setTabValue] = useState(0);

  // 오늘 날짜 (YYYY-MM-DD)
  const today = dayjs().format('YYYY-MM-DD');
  // 1주 전 날짜
  const oneWeekAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

  // 날짜 범위 (1주 전 ~ 오늘)
  const [startDate, setStartDate] = useState(oneWeekAgo);
  const [endDate, setEndDate] = useState(today);

  // 페이징
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!history || history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{mt: 2}}>
        📭 마일리지 내역이 없습니다.
      </Typography>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  /** 날짜 필터링 함수:
   *  DB에는 KST로 저장되었지만 문자열 끝에 Z가 붙어 있다면,
   *  parseAsLocalKST()로 Z를 제거 후 파싱 */
  const isWithinRange = createdAt => {
    const itemDate = parseAsLocalKST(createdAt);
    // startDate는 00:00, endDate는 23:59까지 포함하도록
    if (startDate && itemDate.isBefore(dayjs(startDate).startOf('day'))) {
      return false;
    }
    if (endDate && itemDate.isAfter(dayjs(endDate).endOf('day'))) {
      return false;
    }
    return true;
  };

  // 적립/사용 필터
  const depositHistory = history.filter(
    item => item.amount > 0 && isWithinRange(item.createdAt)
  );
  const usageHistory = history.filter(
    item => item.amount < 0 && isWithinRange(item.createdAt)
  );
  const allCurrentData = tabValue === 0 ? depositHistory : usageHistory;

  // 페이징
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = allCurrentData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  /** 날짜 포맷 함수 */
  const formatDate = dateString => {
    return parseAsLocalKST(dateString).format('YYYY.MM.DD');
  };

  const totalPages = Math.ceil(allCurrentData.length / itemsPerPage);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        backgroundColor: 'grey.100',
        borderRadius: 2
      }}>
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="적립" />
        <Tab label="사용" />
      </Tabs>

      {/* 기간 조회 */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 1
        }}>
        <TextField
          label="시작일"
          type="date"
          size="small"
          value={startDate}
          onChange={e => {
            setStartDate(e.target.value);
            setCurrentPage(1);
          }}
          sx={{mr: 1}}
          InputLabelProps={{shrink: true}}
        />
        <Typography sx={{mx: 1}}>~</Typography>
        <TextField
          label="종료일"
          type="date"
          size="small"
          value={endDate}
          onChange={e => {
            setEndDate(e.target.value);
            setCurrentPage(1);
          }}
          sx={{mr: 1}}
          InputLabelProps={{shrink: true}}
        />
      </Box>

      {allCurrentData.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{mt: 2}}>
          📭 내역이 없습니다.
        </Typography>
      ) : (
        <>
          <List sx={{p: 0}}>
            {currentData.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start" sx={{py: 1}}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}>
                    <Box>
                      <Typography variant="body1" sx={{fontWeight: 'medium'}}>
                        {item.description}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography
                        variant="body1"
                        sx={{
                          color: item.amount > 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}>
                        {item.amount > 0 ? `+${item.amount}` : item.amount} P
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                {index < currentData.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          {totalPages > 1 && (
            <Box sx={{display: 'flex', justifyContent: 'center', mt: 2}}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default MileageHistory;
