import React, {useEffect, useState} from 'react';
import {
  getTourTickets,
  deleteMultipleTourTickets
} from '../../../api/tourTicket/tourTicketService';
import {useLocation, useNavigate} from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Button,
  Box,
  IconButton
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import './styles/TourTicketList.css';

const TourTicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState(new Set());

  // 페이징
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getTourTickets();
        const sortedTickets = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setTickets(sortedTickets);
      } catch (error) {
        console.error('투어 티켓 목록을 가져오는 중 오류 발생:', error);
      }
    };

    fetchTickets();
  }, []);

  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => !prev);
    setSelectedTickets(new Set());
  };

  const handleSelectTicket = ticketId => {
    setSelectedTickets(prev => {
      const newSelection = new Set(prev);

      newSelection.has(ticketId)
        ? newSelection.delete(ticketId)
        : newSelection.add(ticketId);

      return newSelection;
    });
  };

  const handleDelete = async () => {
    if (selectedTickets.size === 0) {
      alert('삭제할 상품을 선택하세요.');
      return;
    }

    const confirmDelete = window.confirm(
      `${selectedTickets.size}개의 상품을 삭제하시겠습니까?`
    );

    if (!confirmDelete) return;

    try {
      await deleteMultipleTourTickets([...selectedTickets]);
      alert('삭제가 완료되었습니다.');

      setTickets(prev => prev.filter(ticket => !selectedTickets.has(ticket._id)));
      setSelectedTickets(new Set());
      setIsDeleteMode(false);
    } catch (error) {
      console.error('상품 삭제 중 오류 발생:', error);
      alert('상품 삭제 실패');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Box className="tour-ticket-container" display="flex" flexDirection="column" gap={2}>
      {/* 제목 */}
      <Typography variant="h4" fontWeight="bold">
        🎫 투어 & 티켓 상품
      </Typography>

      {/* 버튼 그룹 */}
      {location.pathname !== '/product' && (
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/product/tourTicket/new')}
            sx={{backgroundColor: 'rgb(0, 181, 204)', color: 'white'}}>
            상품 등록
          </Button>
          {!isDeleteMode ? (
            <Button
              variant="contained"
              color="error"
              onClick={toggleDeleteMode}
              sx={{backgroundColor: 'rgb(236, 118, 64)', color: 'white'}}>
              삭제 모드
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleDelete}
                sx={{backgroundColor: 'rgb(216, 65, 27)', color: 'white'}}>
                삭제하기
              </Button>
              <Button
                variant="outlined"
                onClick={toggleDeleteMode}
                sx={{backgroundColor: 'rgb(0, 51, 102)', color: 'white'}}>
                삭제 취소
              </Button>
            </>
          )}
        </Box>
      )}

      {/* 테이블 컨테이너 */}
      <TableContainer component={Paper} elevation={3}>
        <Table sx={{tableLayout: 'fixed', width: '100%'}}>
          <TableHead
            sx={{
              backgroundImage:
                'linear-gradient(90deg, rgb(0, 181, 204) 0%, rgb(0, 51, 102) 100%)',
              boxShadow: 3
            }}>
            <TableRow>
              {isDeleteMode && (
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    width: '60px',
                    textAlign: 'center'
                  }}>
                  선택
                </TableCell>
              )}
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  width: '60px',
                  textAlign: 'center'
                }}>
                번호
              </TableCell>
              <TableCell sx={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>
                상품명
              </TableCell>
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  width: '150px',
                  textAlign: 'center'
                }}>
                가격
              </TableCell>
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  width: '100px',
                  textAlign: 'center'
                }}>
                재고
              </TableCell>
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  width: '120px',
                  textAlign: 'center'
                }}>
                지역
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length > 0 ? (
              tickets
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) // 현재 페이지의 데이터만 가져오기
                .map((ticket, index) => (
                  <TableRow
                    key={ticket._id}
                    hover
                    sx={{cursor: 'pointer'}}
                    onClick={() =>
                      isDeleteMode
                        ? handleSelectTicket(ticket._id)
                        : navigate(`/product/tourTicket/${ticket._id}`)
                    }
                    selected={selectedTickets.has(ticket._id)}>
                    {isDeleteMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedTickets.has(ticket._id)}
                          onChange={() => handleSelectTicket(ticket._id)}
                          onClick={e => e.stopPropagation()}
                          color="primary"
                        />
                      </TableCell>
                    )}
                    <TableCell align="center" sx={{height: '76px', fontSize: '16px'}}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell align="left" sx={{height: '76px', fontSize: '16px'}}>
                      {ticket.title}
                    </TableCell>
                    <TableCell align="center" sx={{height: '76px', fontSize: '16px'}}>
                      {ticket.price.toLocaleString()}원
                    </TableCell>
                    <TableCell align="center" sx={{height: '76px', fontSize: '16px'}}>
                      {ticket.stock}
                    </TableCell>
                    <TableCell align="center" sx={{height: '76px', fontSize: '16px'}}>
                      {ticket.location}
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isDeleteMode ? 6 : 5}
                  align="center"
                  sx={{height: '76px', fontSize: '20px'}}>
                  등록된 상품이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* 페이지네이션 */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{padding: '10px 0'}}>
          {/* 이전 페이지 버튼 (첫 번째 페이지에서는 숨김) */}
          {page > 0 && (
            <IconButton
              onClick={event => handleChangePage(event, page - 1)}
              sx={{minWidth: '30px'}}>
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          )}

          {/* 현재 페이지 표시 */}
          <Typography variant="body1" fontWeight="bold" sx={{mx: 2}}>
            {`${page + 1} / ${Math.ceil(tickets.length / rowsPerPage)}`}
          </Typography>

          {/* 다음 페이지 버튼 (마지막 페이지에서는 숨김) */}
          {page < Math.ceil(tickets.length / rowsPerPage) - 1 && (
            <IconButton
              onClick={event => handleChangePage(event, page + 1)}
              sx={{minWidth: '30px'}}>
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </TableContainer>
    </Box>
  );
};

export default TourTicketList;
