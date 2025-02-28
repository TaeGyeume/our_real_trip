// import axios from 'axios';
import api from '../axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/qna';

// QnA 게시글 생성 (Busboy 사용)
export const createQnaBoard = async (data, isMultipart) => {
  try {
    let requestData;

    //  파일이 없으면 JSON 요청 (application/json)
    if (
      (!data.images || data.images.length === 0) &&
      (!data.attachments || data.attachments.length === 0)
    ) {
      requestData = {
        category: data.category?.trim() || '',
        title: data.title?.trim() || '',
        content: data.content?.trim() || ''
      };
    } else {
      //  파일이 있을 경우 multipart/form-data 사용
      requestData = new FormData();
      if (data.category) requestData.append('category', data.category.trim());
      if (data.title) requestData.append('title', data.title.trim());
      if (data.content) requestData.append('content', data.content.trim());

      if (data.images && data.images.length > 0) {
        data.images.forEach(file => {
          if (file instanceof File) {
            requestData.append('images', file);
          }
        });
      }

      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach(file => {
          if (file instanceof File) {
            requestData.append('attachments', file);
          }
        });
      }
    }

    //  디버깅: requestData 출력
    // console.log(' 최종 전송할 데이터:', requestData);

    // if (requestData instanceof FormData) {
    //   for (let [key, value] of requestData.entries()) {
    //     console.log(` ${key}:`, value);
    //   }
    // } else {
    //   console.log(' JSON 데이터:', requestData);
    // }

    const headers = isMultipart
      ? {} //  FormData일 경우 Content-Type 자동 설정
      : {'Content-Type': 'application/json'}; // JSON 요청 시 명시적 지정

    //  요청 보내기 (JSON 또는 FormData 자동 선택)
    const response = await api.post('/qna', data, {
      headers,
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error(' QnA 게시글 생성 오류:', error.response?.data || error.message);
    throw error;
  }
};

//  QnA 게시글 목록 조회 (페이징)
export const getQnaBoards = async (page = 1, limit = 10, category = null) => {
  try {
    const response = await api.get(`/qna`, {
      params: {page, limit, category},
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(' QnA 게시글 목록 조회 오류:', error.response?.data || error.message);
    throw error;
  }
};

//  특정 QnA 게시글 조회 (상세보기)
export const getQnaBoardById = async qnaBoardId => {
  try {
    const response = await api.get(`/qna/${qnaBoardId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(' QnA 게시글 조회 오류:', error.response?.data || error.message);
    throw error;
  }
};

//  QnA 게시글 삭제 요청 (URL 수정)
export const deleteQnaBoard = async qnaBoardId => {
  try {
    const response = await api.delete(`/qna/${qnaBoardId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(' QnA 게시글 삭제 오류:', error);
    throw error.response?.data || {error: 'QnA 게시글 삭제 중 오류 발생'};
  }
};

//  QnA 댓글 작성
export const createQnaComment = async (qnaBoardId, content) => {
  try {
    const response = await api.post(
      `/qna/${qnaBoardId}/comments`,
      {content},
      {withCredentials: true}
    );
    return response.data;
  } catch (error) {
    console.error(' QnA 댓글 작성 오류:', error.response?.data || error.message);
    throw error;
  }
};

//  QnA 댓글 목록 조회 (페이징)
export const getQnaComments = async (qnaBoardId, page = 1, limit = 5) => {
  try {
    const response = await api.get(`/qna/${qnaBoardId}/comments`, {
      params: {page, limit},
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(' QnA 댓글 목록 조회 오류:', error.response?.data || error.message);
    throw error;
  }
};

//  QnA 댓글 삭제 (본인 또는 관리자)
export const deleteQnaComment = async commentId => {
  try {
    const response = await api.delete(`/qna/comments/${commentId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(' QnA 댓글 삭제 오류:', error.response?.data || error.message);
    throw error;
  }
};
export const updateQnaBoard = async (qnaBoardId, data, isMultipart) => {
  try {
    let requestData = data;
    let headers = isMultipart ? {} : {'Content-Type': 'application/json'};

    //  전송 데이터 디버깅
    // console.log(' 수정 요청 데이터:', requestData);

    // if (isMultipart) {
    //   for (let [key, value] of requestData.entries()) {
    //     console.log(` ${key}:`, value);
    //   }
    // } else {
    //   console.log(' JSON 데이터:', requestData);
    //

    const response = await api.put(`/qna/${qnaBoardId}`, requestData, {
      headers,
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error(' QnA 게시글 수정 오류:', error.response?.data || error.message);
    throw error;
  }
};
