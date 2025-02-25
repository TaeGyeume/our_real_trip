import axios from 'axios';
import {authAPI} from '../auth/auth';

const BASE_URL = 'http://localhost:5000/reviews';

const requestConfig = {
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-store', // 캐시 방지
    'Content-Type': 'application/json'
  }
};

export const createReview = async formData => {
  return await axios.post(`${BASE_URL}/create`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getReviews = async productId => {
  try {
    const response = await axios.get(`${BASE_URL}/${encodeURIComponent(productId)}`);
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
      url: `${BASE_URL}/update/${reviewId}`,
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
    const response = await axios.delete(`${BASE_URL}/delete/${reviewId}`);

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
    console.log(`[프론트] 리뷰 ${reviewId}에 댓글 추가 요청`);

    // 유저 정보 가져오기
    const userResponse = await authAPI.getUserProfile();
    const userId = userResponse?._id;

    if (!userId) {
      throw new Error('사용자 정보가 없습니다. 로그인 상태를 확인하세요.');
    }

    const response = await axios.post(
      `${BASE_URL}/${reviewId}/comments`,
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
    const response = await axios.delete(`${BASE_URL}/${reviewId}/comments/${commentId}`, {
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
      `${BASE_URL}/${reviewId}/comments/${commentId}`,
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

export const likeReview = async reviewId => {
  const response = await axios.post(`${BASE_URL}/${reviewId}/like`);
  return response.data;
};
