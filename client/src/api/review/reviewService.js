import axios from 'axios';
import {authAPI} from '../auth/auth';

const BASE_URL = 'http://localhost:5000/reviews';

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
    console.log('Fetched reviews:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const updateReview = async (productType, reviewId, updatedData) => {
  const response = await axios.put(
    `${BASE_URL}/${productType}/reviews/${reviewId}`,
    updatedData
  );
  return response.data;
};

export const deleteReview = async reviewId => {
  try {
    const response = await axios.delete(`${BASE_URL}/delete/${reviewId}`);

    console.log('[프론트] 리뷰 삭제 성공:', response.data.message);

    return response.data;
  } catch (error) {
    console.error(
      '[프론트] 리뷰 삭제 실패:',
      error.response?.data?.message || error.message
    );

    throw error.response?.data || {message: '리뷰 삭제 중 오류가 발생했습니다.'};
  }
};

export const likeReview = async reviewId => {
  const response = await axios.post(`${BASE_URL}/${reviewId}/like`);
  return response.data;
};

const requestConfig = {
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-store', // 캐시 방지
    'Content-Type': 'application/json'
  }
};

export const addComment = async (reviewId, commentContent) => {
  try {
    console.log(`[프론트] 리뷰 ${reviewId}에 댓글 추가 요청`);

    const response = await authAPI.getUserProfile().then(user => {
      return axios.post(
        `${BASE_URL}/${reviewId}/comments`,
        {content: commentContent},
        requestConfig
      );
    });

    console.log('[프론트] 댓글 추가 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      '[프론트] 댓글 추가 실패:',
      error.response?.data?.message || error.message
    );
    throw error.response?.data || {message: '댓글 추가 중 오류가 발생했습니다.'};
  }
};

export const deleteComment = async commentId => {
  const response = await axios.delete(`${BASE_URL}/comment/${commentId}`);
  return response.data;
};
