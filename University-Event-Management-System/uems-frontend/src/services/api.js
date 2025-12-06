// uems-frontend/src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.metadata = { 
      startTime: Date.now(),
      id: `${config.method}-${Date.now()}`,
      url: config.url
    };
    
    // Special handling for file uploads
    if (config.url?.includes('/upload/')) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - ABSOLUTELY NO REDIRECTS
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    
    // Show success toast for non-GET requests
    if (response.config.method !== 'GET' && response.data?.message) {
      toast.success(response.data.message, {
        duration: 3000,
      });
    }
    
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    const response = error.response;
    const duration = originalRequest?.metadata ? Date.now() - originalRequest.metadata.startTime : 0;
    
    console.group('🚨 API Error');
    console.log('URL:', originalRequest?.url);
    console.log('Method:', originalRequest?.method);
    console.log('Status:', response?.status);
    console.log('Duration:', duration + 'ms');
    console.log('Error:', error.message);
    console.groupEnd();
    
    // Handle different error types
    if (response) {
      switch (response.status) {
        case 400:
          toast.error(response.data?.message || 'Bad request. Please check your input.', {
            duration: 4000,
          });
          break;
          
        case 401:
          // CRITICAL: NO REDIRECTS - Just show toast
          console.warn('⚠️ 401 Detected - NO REDIRECT', originalRequest?.url);
          toast.error('Your session has expired. Please login again.', {
            duration: 4000,
            icon: '🔒',
          });
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action.', {
            duration: 4000,
            icon: '🚫',
          });
          break;
          
        case 404:
          toast.error('The requested resource was not found.', {
            duration: 3000,
          });
          break;
          
        case 422:
          // Validation errors
          if (response.data?.errors) {
            const errors = response.data.errors;
            Object.keys(errors).forEach(key => {
              toast.error(`${key}: ${errors[key]}`, {
                duration: 4000,
              });
            });
          } else {
            toast.error(response.data?.message || 'Validation failed', {
              duration: 4000,
            });
          }
          break;
          
        case 500:
          toast.error('Server error. Please try again later.', {
            duration: 4000,
            icon: '⚠️',
          });
          break;
          
        default:
          toast.error(response.data?.message || 'An error occurred', {
            duration: 4000,
          });
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.', {
        duration: 4000,
        icon: '📡',
      });
    } else {
      toast.error('An unexpected error occurred', {
        duration: 4000,
      });
    }
    
    // IMPORTANT: Reject the promise WITHOUT redirecting
    return Promise.reject(error);
  }
);

// Helper function for DELETE requests (maintains URL param format)
export const deleteWithParams = (url, params = {}) => {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  console.log('🗑️ DELETE Request:', fullUrl);
  
  return api.delete(fullUrl);
};

export default api;