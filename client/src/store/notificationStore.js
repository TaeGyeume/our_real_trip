// notificationStore.js
import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {
  getNotifications,
  sendNotification
} from '../api/notification/notificationService';

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      fetchNotifications: async () => {
        try {
          const notifications = await getNotifications();
          set({notifications});
        } catch (error) {
          console.error('알림 불러오기 실패:', error);
        }
      },

      listenSocketNotifications: socket => {
        socket
          .off('notification')
          .on('notification', ({message, notificationId, createdAt}) => {
            const newNoti = {
              _id: notificationId,
              message,
              createdAt: createdAt || new Date().toISOString(), // createdAt 없으면 현재 시간 설정
              read: false
            };

            set(state => {
              const exists = state.notifications.some(n => n._id === notificationId);
              if (exists) return state; // 중복 방지

              return {notifications: [newNoti, ...state.notifications]};
            });
          });
      },
      sendNotificationToAll: async message => {
        await sendNotification(message);
      }
    }),
    {name: 'notification-store'}
  )
);
