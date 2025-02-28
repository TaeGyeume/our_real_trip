import React, {useEffect, useState} from 'react';
import {getQnaBoards, deleteQnaBoard} from '../../api/qna/qnaBoardService';
import {useNavigate} from 'react-router-dom';
import {getUserProfile} from '../../api/user/user';
import './styles/QnaBoardList.css';

const QnaBoardList = () => {
  const [qnaBoards, setQnaBoards] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndBoards = async () => {
      try {
        setLoading(true);
        const userResponse = await getUserProfile();
        setUser(userResponse.data);
        const response = await getQnaBoards(page, 10, category);
        setQnaBoards(response.qnaBoards ?? []);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error(' 데이터 로드 중 오류 발생:', error);
        setQnaBoards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBoards();
  }, [page, category]);

  const handleCategoryChange = e => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleDeleteQnaBoard = async qnaBoardId => {
    if (!user) return alert('로그인이 필요합니다.');

    if (window.confirm('정말로 삭제하시겠습니까?')) {
      try {
        await deleteQnaBoard(qnaBoardId);
        setQnaBoards(prevBoards => prevBoards.filter(qna => qna._id !== qnaBoardId));
        alert('게시글이 삭제되었습니다.');
      } catch (error) {
        console.error(' 게시글 삭제 오류:', error);
        alert('게시글 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditQnaBoard = qnaBoardId => {
    navigate(`/qna/edit/${qnaBoardId}`);
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">고객 문의</h1>

      {user && (
        <button className="btn btn-primary mb-3" onClick={() => navigate('/qna/write')}>
          ✏️ 고객 문의 등록
        </button>
      )}

      <select
        className="form-select mb-3"
        onChange={handleCategoryChange}
        value={category}>
        <option value="">전체</option>
        <option value="회원 정보 문의">회원 정보 문의</option>
        <option value="회원 가입 문의">회원 가입 문의</option>
        <option value="여행 상품 문의">여행 상품 문의</option>
        <option value="항공 문의">항공 문의</option>
        <option value="투어/티켓 문의">투어/티켓 문의</option>
        <option value="숙소 문의">숙소 문의</option>
        <option value="예약 문의">예약 문의</option>
        <option value="결제 문의">결제 문의</option>
        <option value="취소/환불 문의">취소/환불 문의</option>
        <option value="기타 문의">기타 문의</option>
      </select>

      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : (
        <div className="list-group">
          {Array.isArray(qnaBoards) && qnaBoards.length > 0 ? (
            qnaBoards.map(qna => (
              <div
                key={qna._id}
                className="list-group-item list-group-item-action d-flex justify-content-between"
                onClick={() => navigate(`/qna/${qna._id}`)}>
                <div>
                  <h5 className="mb-1">{qna.title}</h5>
                  <p className="mb-1">{qna.category}</p>
                  <small>작성자: {qna.user?.username || '익명'}</small>
                </div>
                <div>
                  {user._id === qna.user?._id || user.roles.includes('admin') ? (
                    <div className="d-flex flex-column align-items-end">
                      {user._id === qna.user?._id && (
                        <button
                          className="btn btn-warning btn-sm mb-1"
                          onClick={e => {
                            e.stopPropagation();
                            handleEditQnaBoard(qna._id);
                          }}>
                          수정
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteQnaBoard(qna._id);
                        }}>
                        삭제
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p>등록된 QnA가 없습니다.</p>
          )}
        </div>
      )}

      <div className="d-flex justify-content-center mt-3">
        <button
          className="btn btn-secondary mx-2"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}>
          이전
        </button>
        <span className="my-auto">
          {page} / {totalPages}
        </span>
        <button
          className="btn btn-secondary mx-2"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}>
          다음
        </button>
      </div>
    </div>
  );
};

export default QnaBoardList;
