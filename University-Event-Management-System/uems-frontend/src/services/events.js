import api from './api';

export const eventsService = {
  // Public event browsing
  getEvents: async (filters = {}) => {
    try {
      const response = await api.get('/events', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return {
        success: false,
        message: 'Failed to load events',
        error: error.message
      };
    }
  },

  getActiveEventCount: async () => {
    try {
      const response = await api.get('/events/active-count');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEvent: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      return {
        success: false,
        message: 'Failed to load event details',
        error: error.message
      };
    }
  },

  // ✅ NEW: Get organizer analytics
  getOrganizerAnalytics: async () => {
    try {
      const response = await api.get('/events/organizer/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer analytics:', error);
      return {
        success: false,
        message: 'Failed to load organizer analytics',
        error: error.message
      };
    }
  },

  // ✅ NEW: Close registration for an event
  closeRegistration: async (eventId) => {
    try {
      const response = await api.patch(`/events/${eventId}/close-registration`);
      return response.data;
    } catch (error) {
      console.error('Error closing registration:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to close registration',
        error: error.message
      };
    }
  },

  // ✅ NEW: Open registration for an event
  openRegistration: async (eventId) => {
    try {
      const response = await api.patch(`/events/${eventId}/open-registration`);
      return response.data;
    } catch (error) {
      console.error('Error opening registration:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to open registration',
        error: error.message
      };
    }
  },

  registerForEvent: async (eventId, source = 'direct') => {
    try {
      const response = await api.post(`/events/${eventId}/register`, { source });
      
      if (response.data && response.data.data && response.data.data.event) {
        console.log('Registration successful, updated event:', response.data.data.event);
        console.log('Current attendees in response:', response.data.data.event.currentAttendees);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error registering for event:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register for event',
        error: error.message
      };
    }
  },
  
  // ✅ ADDED: Unregister from event
  unregisterFromEvent: async (eventId) => {
    try {
      const response = await api.delete(`/events/${eventId}/register`);
      console.log('Unregister response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error unregistering from event:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unregister from event',
        error: error.message
      };
    }
  },
  
  // ✅ ADDED: Delete approved event (NEW FUNCTION)
  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/events/${eventId}`);
      console.log('Delete event response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete event',
        error: error.message
      };
    }
  },
  
  // Event proposals (authenticated users)
  createProposal: async (eventData) => {
    try {
      const response = await api.post('/events/proposals', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating proposal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create event proposal',
        error: error.message
      };
    }
  },

  submitProposal: async (eventId) => {
    try {
      const response = await api.post(`/events/proposals/${eventId}/submit`, {});
      return response.data;
    } catch (error) {
      console.error('Error submitting proposal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit proposal',
        error: error.message
      };
    }
  },

  getMyProposals: async (filters = {}) => {
    try {
      const response = await api.get('/events/proposals/my-events', { 
        params: filters 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my proposals:', error);
      return {
        success: false,
        message: 'Failed to load your event proposals',
        error: error.message
      };
    }
  },

  updateProposal: async (eventId, updates) => {
    try {
      const response = await api.put(`/events/proposals/${eventId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating proposal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update proposal',
        error: error.message
      };
    }
  },

  // ✅ ADDED: Delete draft proposal
  deleteProposal: async (eventId) => {
    try {
      const response = await api.delete(`/events/proposals/${eventId}`);
      console.log('Delete proposal response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting proposal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete draft',
        error: error.message
      };
    }
  },

  cancelSubmission: async (eventId) => {
    try {
      const response = await api.put(`/events/proposals/${eventId}/cancel-submission`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling submission:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel submission',
        error: error.message
      };
    }
  },

  // ✅ NEW: Get attendance list for an event
  getAttendanceList: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/attendance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance list:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load attendance list',
        error: error.message
      };
    }
  },

  // ✅ NEW: Mark attendance for a registration
  markAttendance: async (eventId, registrationId) => {
    try {
      const response = await api.put(`/events/${eventId}/attendance/${registrationId}`);
      return response.data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark attendance',
        error: error.message
      };
    }
  },
};