import axios from '../axios';

// 저장된 알림 목록 불러오기
export const getNotifications = async () => {
  try {
    const response = await axios.get('/notifications', {withCredentials: true});
    return response.data.notifications;
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
