import api from './api';

export const sharingService = {
  // Matches: shareController.generateShareLinks
  generateShareLinks: async (eventId, platform = 'direct') => {
    const response = await api.get(`/share/events/${eventId}`, {
      params: { platform }
    });
    return response.data; // { success, data: { event, shareUrl, shareLinks, shareContent } }
  },

  // Matches: shareController.getShareAnalytics
  getShareAnalytics: async (eventId) => {
    const response = await api.get(`/share/events/${eventId}/analytics`);
    return response.data; // { success, data: { event, overview, dailyTrend, timePeriod } }
  },

  // Matches: shareController.bulkShareEvents
  bulkShareEvents: async (eventIds, platforms, message) => {
    const response = await api.post('/share/bulk', {
      eventIds,
      platforms,
      message
    });
    return response.data; // { success, message, data: { campaign, results } }
  }
};