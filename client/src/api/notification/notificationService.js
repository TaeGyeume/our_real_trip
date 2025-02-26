import axios from '../axios';

// 저장된 알림 목록 불러오기
export const getNotifications = async ({page = 1, limit = 10}) => {
  try {
    const response = await axios.get('/notifications', {
      params: {page, limit},
      withCredentials: true
    });

    return {
      notifications: response.data.notifications,
      hasMore: response.data.hasMore
    };
  } catch (error) {
    console.error('알림 불러오기 실패:', error);
    throw error;
  }
};

// 알림 전송 API
export const sendNotification = async message => {
  try {
    const response = await axios.post('/notifications/send', {message});
    return response.data;
  } catch (error) {
    console.error('알림 전송 실패:', error);
    throw error;
  }
};

// 알림 읽음 처리 API 호출
export const markAllNotificationsAsRead = async () => {
  await axios.patch('/notifications/read-all');
};
