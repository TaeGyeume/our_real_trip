import React, {useEffect, useState} from 'react';
import MyCoupons from '../../components/coupons/MyCoupons';
import {authAPI} from '../../api/auth';

const MyCouponsPage = () => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authAPI.getUserProfile();
        setUserId(user._id);
      } catch (error) {
        console.error('사용자 정보를 불러오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <p>사용자 정보를 불러오는 중...</p>;
  if (!userId) return <p>로그인이 필요합니다.</p>;

  return (
    <div>
      <MyCoupons userId={userId} />
    </div>
  );
};

export default MyCouponsPage;
