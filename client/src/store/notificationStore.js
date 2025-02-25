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
      currentPage: 1,
      hasMore: true,

      // 최초 알림 불러오기
      fetchNotifications: async (page = 1, limit = 10) => {
        try {
          const {notifications, hasMore} = await getNotifications({page, limit});
          set({
            notifications,
            currentPage: page,
            hasMore
          });
        } catch (error) {
          console.error('알림 불러오기 실패:', error);
        }
      },

      fetchMoreNotifications: async (page, limit = 10) => {
        try {
          const {notifications: moreNoti, hasMore} = await getNotifications({
            page,
            limit
          });
          set(state => {
            // 기존 notifications에 이미 존재하는 _id는 추가하지 않도록 필터링
            const existingIds = new Set(state.notifications.map(noti => noti._id));
            const uniqueNotifications = moreNoti.filter(
              noti => !existingIds.has(noti._id)
            );

            return {
              notifications: [...state.notifications, ...uniqueNotifications],
              currentPage: page,
              hasMore
            };
          });
        } catch (error) {
          console.error('추가 알림 불러오기 실패:', error);
        }
      },

      listenSocketNotifications: socket => {
        socket
          .off('notification')
          .on(
            'notification',
            ({message, notificationId, createdAt, bookingId, bookingType}) => {
              const newNoti = {
                _id: notificationId,
                message,
                createdAt: createdAt || new Date().toISOString(),
                read: false,
                bookingId,
                bookingType
              };

              set(state => {
                const exists = state.notifications.some(n => n._id === notificationId);
                if (exists) return state;

                return {notifications: [newNoti, ...state.notifications]};
              });
            }
          );
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

      clearNotifications: () => set({notifications: [], currentPage: 1, hasMore: true})
    }),
    {name: 'notification-store'}
  )
);
