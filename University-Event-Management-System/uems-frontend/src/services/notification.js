import api from './api';

export const notificationsService = {
  // Matches: notificationController.getNotifications
  getNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly }
    });
    return response.data; // { success, data: { notifications, pagination, unreadCount } }
  },

  // Matches: notificationController.markAsRead
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data; // { success, message, data: { notification } }
  },

  // Matches: notificationController.markAllAsRead
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data; // { success, message, data: { modifiedCount } }
  },

  // Matches: notificationController.deleteNotification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data; // { success, message }
  },

  // Matches: notificationController.clearAllNotifications
  clearAllNotifications: async () => {
    const response = await api.delete('/notifications');
    return response.data; // { success, message }
  },

  // Matches: notificationController.getUnreadCount
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data; // { success, data: { unreadCount } }
  }
};