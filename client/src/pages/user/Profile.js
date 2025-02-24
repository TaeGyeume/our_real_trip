import React, {useState, useEffect} from 'react';
import {authAPI} from '../../api/auth';
import {useAuthStore} from '../../store/authStore';
import {useNavigate} from 'react-router-dom';

const Profile = () => {
  const [userData, setUserData] = useState({
    userid: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    membershipLevel: '',
    mileage: 0
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkMessage, setCheckMessage] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState('');

  const {checkAuth} = useAuthStore();
  const navigate = useNavigate();

  //  사용자 프로필 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await checkAuth();
        const response = await authAPI.getUserProfile();

        // 필요한 데이터만 저장
        const filteredData = {
          userid: response.userid,
          username: response.username,
          email: response.email,
          phone: response.phone,
          address: response.address,
          membershipLevel: response.membershipLevel,
          mileage: response.mileage
        };

        setUserData(filteredData);
        setOriginalData(filteredData);
      } catch (error) {
        console.error('프로필 정보를 불러오는 데 실패했습니다.', error);
        setError('프로필 정보를 불러오는 데 실패했습니다. 다시 로그인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [checkAuth]);

  //  항목별 한글 이름 매핑
  const fieldNames = {
    userid: '아이디',
    username: '이름',
    email: '이메일',
    phone: '전화번호',
    address: '주소',
    membershipLevel: '회원 등급',
    mileage: '마일리지'
  };

  //  입력 값 변경 감지
  const handleChange = e => {
    setUserData({...userData, [editingField]: e.target.value});
    setCheckMessage({...checkMessage, [editingField]: ''});
  };

  //  중복 확인 API 호출 (userid, email, phone)
  const handleCheckDuplicate = async () => {
    if (!['userid', 'email', 'phone'].includes(editingField)) return;

    if (userData[editingField] === originalData[editingField]) {
      setCheckMessage({...checkMessage, [editingField]: '현재 값과 동일합니다.'});
      return;
    }

    try {
      const response = await authAPI.checkDuplicate({
        [editingField]: userData[editingField]
      });
      setCheckMessage({...checkMessage, [editingField]: response.message});
    } catch (error) {
      setCheckMessage({
        ...checkMessage,
        [editingField]:
          error.response?.data?.message || error.message || '중복 확인에 실패했습니다.'
      });
    }
  };

  //  변경된 값만 서버로 전송
  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const updatedData = {};
    Object.keys(userData).forEach(key => {
      if (userData[key] !== originalData[key]) {
        updatedData[key] = userData[key];
      }
    });

    if (Object.keys(updatedData).length === 0) {
      setError('변경된 내용이 없습니다.');
      return;
    }

    try {
      await authAPI.updateProfile(updatedData);
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setOriginalData(userData); // 원본 데이터 업데이트
      setShowModal(false);
    } catch (error) {
      setError(error.response?.data?.message || '프로필 업데이트에 실패했습니다.');
    }
  };

  //  모달 열기
  const openModal = field => {
    if (field === 'membershipLevel' || field === 'mileage') return; // 수정 불가 필드
    setEditingField(field);
    setShowModal(true);
  };

  //  마일리지 관리 페이지로 이동
  const goToMileagePage = () => {
    navigate('/mileage'); // `/mileage` 페이지로 이동
  };

  if (loading) return <p className="text-center">프로필 불러오는 중...</p>;

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">프로필 페이지</h2>
      {error && <div className="alert alert-danger text-center">{error}</div>}
      {success && <div className="alert alert-success text-center">{success}</div>}

      <div className="card p-4 shadow-lg">
        {Object.entries(userData).map(([key, value]) => (
          <div
            key={key}
            className="d-flex justify-content-between align-items-center border-bottom py-2">
            <p className="mb-0">
              <strong>{fieldNames[key] || key}:</strong> {value || '미등록'}
            </p>

            {/* 마일리지 항목에만 "마일리지 관리" 버튼 추가 */}
            {key === 'mileage' ? (
              <button
                className="btn btn-outline-success btn-sm"
                onClick={goToMileagePage}>
                상세정보
              </button>
            ) : (
              key !== 'membershipLevel' && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => openModal(key)}>
                  수정
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {/*  모달 창 */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {fieldNames[editingField] || editingField} 수정
                </h5>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  name={editingField}
                  className="form-control"
                  value={userData[editingField]}
                  onChange={handleChange}
                />
                {['userid', 'email', 'phone'].includes(editingField) && (
                  <button
                    className="btn btn-outline-secondary mt-2 w-100"
                    onClick={handleCheckDuplicate}>
                    중복 확인
                  </button>
                )}
                {checkMessage[editingField] && (
                  <small className="text-danger d-block mt-1">
                    {checkMessage[editingField]}
                  </small>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}>
                  닫기
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
