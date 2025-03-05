import axios from '../axios';
import {authAPI} from '../auth/auth';
import {useAuthStore} from '../../store/authStore';

const requestConfig = {
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-store', // 캐시 방지
    'Content-Type': 'application/json'
  }
};

export const createReview = async formData => {
  return await axios.post(`reviews/create`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getReviews = async productId => {
  try {
    const response = await axios.get(`reviews/${encodeURIComponent(productId)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const updateReview = async (reviewId, updatedData) => {
  try {
    const response = await axios({
      method: 'put',
      url: `reviews/update/${reviewId}`,
      data: updatedData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error('[프론트] 리뷰 수정 실패:', error.response?.data || error.message);
    throw error.response?.data || {message: '리뷰 수정 중 오류 발생'};
  }
};

export const deleteReview = async reviewId => {
  try {
    const response = await axios.delete(`reviews/delete/${reviewId}`);

    return response.data;
  } catch (error) {
    console.error(
      '[프론트] 리뷰 삭제 실패:',
      error.response?.data?.message || error.message
    );

    throw error.response?.data || {message: '리뷰 삭제 중 오류가 발생했습니다.'};
  }
};

export const addComment = async (reviewId, commentContent) => {
  try {
    // console.log(`[프론트] 리뷰 ${reviewId}에 댓글 추가 요청`);

    // 유저 정보 가져오기
    const userResponse = await authAPI.getUserProfile();
    const userId = userResponse?._id;

    if (!userId) {
      throw new Error('사용자 정보가 없습니다. 로그인 상태를 확인하세요.');
    }

    const response = await axios.post(
      `reviews/${reviewId}/comments`,
      {
        content: commentContent,
        userId: userId,
        roles: userResponse.roles
      },
      requestConfig
    );

    return response.data;
  } catch (error) {
    console.error(
      '[프론트] 댓글 추가 실패:',
      error.response?.data?.message || error.message
    );
    throw error.response?.data || {message: '댓글 추가 중 오류가 발생했습니다.'};
  }
};

export const deleteComment = async (reviewId, commentId) => {
  try {
    const response = await axios.delete(`reviews/${reviewId}/comments/${commentId}`, {
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error(
      '[프론트] 댓글 삭제 실패:',
      error.response?.data?.message || error.message
    );
    throw error.response?.data || {message: '댓글 삭제 중 오류가 발생했습니다.'};
  }
};

export const updateComment = async (reviewId, commentId, newContent) => {
  try {
    const response = await axios.patch(
      `reviews/${reviewId}/comments/${commentId}`,
      {content: newContent},
      requestConfig
    );

    return response.data;
  } catch (error) {
    console.error(
      '[프론트] 댓글 수정 실패:',
      error.response?.data?.message || error.message
    );

    throw new Error(error.response?.data?.message || '댓글 수정 중 오류 발생');
  }
};

export const toggleLike = async (reviewId, userId) => {
  try {
    // console.log(`[프론트] 좋아요 요청 보냄`, reviewId);
    // console.log(`[프론트] 좋아요 요청 userId:`, userId);

    const response = await axios.patch(
      `${BASE_URL}/${reviewId}/like`,
      {userId},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().user?.token}`
        },
        withCredentials: true
      }
    );

    return response.data;
  } catch (error) {
    console.error('좋아요 처리 실패:', error.response?.data?.message || error.message);
    throw error.response?.data || {message: '좋아요 처리 중 오류가 발생했습니다.'};
  }
};

export const getBestReviews = async productId => {
  try {
    const response = await axios.get(`${BASE_URL}/${productId}/best`);
    return response.data.reviews;
  } catch (error) {
    console.error(
      '베스트 리뷰 불러오기 실패:',
      error.response?.data?.message || error.message
    );
    throw error;
  }
};
