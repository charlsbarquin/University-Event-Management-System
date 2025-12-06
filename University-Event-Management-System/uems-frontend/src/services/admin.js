import api from './api';

export const adminService = {
  // Matches: adminController.getPendingEvents
  getPendingEvents: async (page = 1, limit = 10) => {
    const response = await api.get('/admin/pending-events', {
      params: { page, limit }
    });
    return response.data; // { success, data: { events, currentPage, totalPages, totalPending } }
  },

  // Matches: adminController.approveEvent
  approveEvent: async (eventId) => {
    const response = await api.put(`/admin/events/${eventId}/approve`, {});
    return response.data; // { success, message, data: { event } }
  },

  // Matches: adminController.rejectEvent  
  rejectEvent: async (eventId, rejectionNotes) => {
    const response = await api.put(`/admin/events/${eventId}/reject`, {
      rejectionNotes
    });
    return response.data; // { success, message, data: { event } }
  },

  // Matches: adminController.getStatistics
  getStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return response.data; // { success, data: { eventStats, userStats, recentActivity, popularCategories } }
  },

  // ✅ NEW: Get organizer analytics
  getOrganizerAnalytics: async (organizerId) => {
    const response = await api.get(`/admin/organizer-analytics/${organizerId}`);
    return response.data; // { success, data: { organizer, summary, performance, upcomingEvents } }
  },

  // ✅ NEW: Get comprehensive analytics
  getComprehensiveAnalytics: async () => {
    const response = await api.get('/admin/analytics/comprehensive');
    return response.data; // { success, data: { summary, statistics, performance, trends, attendance, insights } }
  }
};