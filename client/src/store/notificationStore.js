// notificationStore.js
import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {
  getNotifications,
  sendNotification,
  markAllNotificationsAsRead
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

      markAllAsRead: async () => {
        try {
          await markAllNotificationsAsRead();
          set(state => ({
            notifications: state.notifications.map(noti => ({
              ...noti,
              read: true
            }))
          }));
        } catch (error) {
          console.error('모든 알림 읽음처리 실패:', error);
        }
      },

      sendNotificationToAll: async message => {
        await sendNotification(message);
      },

      clearNotifications: () => set({notifications: []})
    }),
    {name: 'notification-store'}
  )
);
