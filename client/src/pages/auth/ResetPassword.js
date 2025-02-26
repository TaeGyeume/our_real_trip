import React, {useState, useEffect} from 'react';
import {authAPI} from '../../api/auth';
import {useNavigate, useLocation} from 'react-router-dom';
import {useAuthStore} from '../../store/authStore'; // 로그인 상태 확인

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token'); // URL에서 토큰 추출
  const {isAuthenticated} = useAuthStore(); // 로그인 상태 확인

  useEffect(() => {
    if (!token && !isAuthenticated) {
      setError('유효하지 않은 접근입니다.');
    }
  }, [token, isAuthenticated]);

  // 입력 값 변경 감지
  const handleChange = e => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // 폼 제출 핸들러
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      if (token) {
        //  비밀번호 찾기 후 재설정 (토큰 기반)
        await authAPI.resetPassword({
          token: token,
          newPassword: formData.newPassword
        });
      } else if (isAuthenticated) {
        //  로그인된 사용자 비밀번호 변경
        if (!formData.currentPassword) {
          setError('현재 비밀번호를 입력해주세요.');
          return;
        }
        await authAPI.resetPassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      }

      setSuccess('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setError(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">비밀번호 변경</h2>
      {error && <div className="alert alert-danger text-center">{error}</div>}
      {success && <div className="alert alert-success text-center">{success}</div>}

      <form onSubmit={handleSubmit} className="p-4 border rounded shadow">
        {!token && (
          <div className="mb-3">
            <label className="form-label">현재 비밀번호</label>
            <input
              type="password"
              name="currentPassword"
              className="form-control"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">새 비밀번호</label>
          <input
            type="password"
            name="newPassword"
            className="form-control"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">새 비밀번호 확인</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">
          비밀번호 변경
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
