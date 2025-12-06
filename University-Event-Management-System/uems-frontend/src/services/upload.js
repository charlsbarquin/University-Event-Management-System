import api from './api';

export const uploadService = {
  uploadEventMedia: async (eventId, formData) => {
    try {
      const response = await api.post(`/upload/events/${eventId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Upload successful');
      return response.data;
    } catch (error) {
      console.error('❌ Upload error:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteEventMedia: async (eventId, mediaType, filename) => {
    console.log('🔍 DELETE REQUEST INITIATED:', { 
      eventId, 
      mediaType, 
      filename,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Extract just the filename
      const cleanFilename = filename.split('/').pop();
      console.log('📁 Cleaned filename:', cleanFilename);
      
      // Use URL parameters instead of request body
      const response = await api.delete(
        `/upload/events/${eventId}/media/${mediaType}/${cleanFilename}`
      );
      
      console.log('✅ Delete successful:', response.data);
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('❌ DELETE FAILED - Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Return structured error
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Delete failed',
        status: error.response?.status,
        error: error.response?.data
      };
    }
  }
};