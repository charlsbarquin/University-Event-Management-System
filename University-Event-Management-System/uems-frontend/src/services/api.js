// uems-frontend/src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

// ✅ UPDATED FOR RENDER: Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('🌐 API Configuration:');
console.log('Environment:', import.meta.env.MODE);
console.log('API Base URL:', API_BASE_URL);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
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
    if (config.url?.includes('/upload/') || config.url?.includes('/api/upload')) {
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
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    }
    
    // Show success toast for non-GET requests
    if (response.config.method !== 'GET' && response.data?.message) {
      toast.success(response.data.message, {
        duration: 3000,
        position: 'top-right',
      });
    }
    
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    const response = error.response;
    const duration = originalRequest?.metadata ? Date.now() - originalRequest.metadata.startTime : 0;
    
    if (import.meta.env.DEV) {
      console.group('🚨 API Error');
      console.log('URL:', originalRequest?.url);
      console.log('Method:', originalRequest?.method);
      console.log('Status:', response?.status);
      console.log('Duration:', duration + 'ms');
      console.log('Error:', error.message);
      if (response?.data) {
        console.log('Response Data:', response.data);
      }
      console.groupEnd();
    }
    
    // Handle different error types
    if (response) {
      switch (response.status) {
        case 400:
          toast.error(response.data?.message || 'Bad request. Please check your input.', {
            duration: 4000,
            position: 'top-right',
          });
          break;
          
        case 401:
          // CRITICAL: NO REDIRECTS - Just show toast
          if (import.meta.env.DEV) {
            console.warn('⚠️ 401 Detected - NO REDIRECT', originalRequest?.url);
          }
          
          // Only show toast if not already on login page
          const isLoginPage = window.location.pathname.includes('/login');
          const isAuthRequest = originalRequest?.url.includes('/auth');
          
          if (!isLoginPage && !isAuthRequest) {
            toast.error('Your session has expired. Please login again.', {
              duration: 4000,
              icon: '🔒',
              position: 'top-right',
            });
            
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action.', {
            duration: 4000,
            icon: '🚫',
            position: 'top-right',
          });
          break;
          
        case 404:
          toast.error('The requested resource was not found.', {
            duration: 3000,
            position: 'top-right',
          });
          break;
          
        case 422:
          // Validation errors
          if (response.data?.errors) {
            const errors = response.data.errors;
            Object.keys(errors).forEach(key => {
              toast.error(`${key}: ${errors[key]}`, {
                duration: 4000,
                position: 'top-right',
              });
            });
          } else {
            toast.error(response.data?.message || 'Validation failed', {
              duration: 4000,
              position: 'top-right',
            });
          }
          break;
          
        case 429:
          toast.error('Too many requests. Please wait a moment before trying again.', {
            duration: 5000,
            icon: '⏱️',
            position: 'top-right',
          });
          break;
          
        case 500:
          toast.error('Server error. Please try again later.', {
            duration: 4000,
            icon: '⚠️',
            position: 'top-right',
          });
          break;
          
        default:
          toast.error(response.data?.message || 'An error occurred', {
            duration: 4000,
            position: 'top-right',
          });
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection and try again.', {
        duration: 4000,
        icon: '⏰',
        position: 'top-right',
      });
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your internet connection.', {
        duration: 4000,
        icon: '📡',
        position: 'top-right',
      });
    } else {
      toast.error('An unexpected error occurred', {
        duration: 4000,
        position: 'top-right',
      });
    }
    
    // IMPORTANT: Reject the promise WITHOUT redirecting
    return Promise.reject(error);
  }
);

// Helper function for DELETE requests
export const deleteWithParams = (url, params = {}) => {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  if (import.meta.env.DEV) {
    console.log('🗑️ DELETE Request:', fullUrl);
  }
  
  return api.delete(fullUrl);
};

// Helper function for file uploads
export const uploadFile = async (url, formData, onUploadProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress,
    timeout: 60000, // 60 seconds for file uploads
  });
};

// ✅ FIXED: Helper function for image URLs (HANDLES ALL FORMATS)
export const getImageUrl = (filename) => {
  if (!filename) {
    console.log('❌ getImageUrl: No filename provided');
    return null;
  }
  
  console.log('🔍 getImageUrl input:', filename);
  
  // If it's already a full URL, return as is
  if (filename.startsWith('http')) {
    console.log('✅ Already full URL:', filename);
    return filename;
  }
  
  // Handle paths that start with /uploads/ (from database)
  if (filename.startsWith('/uploads/')) {
    const pathWithoutSlash = filename.startsWith('/') ? filename.substring(1) : filename;
    const fullUrl = `http://localhost:5000/${pathWithoutSlash}`;
    console.log('✅ Generated from /uploads/ path:', fullUrl);
    return fullUrl;
  }
  
  // Handle just filenames (legacy format)
  let folder = 'event-images'; // default
  
  if (filename.includes('banner') || filename.includes('event-banner')) {
    folder = 'event-banners';
  } else if (filename.includes('video') || filename.includes('event-video')) {
    folder = 'event-videos';
  } else if (filename.includes('media')) {
    folder = 'event-media'; // if you have this folder
  }
  
  // Extract just the filename from any path
  const justFilename = filename.split('/').pop();
  const fullUrl = `http://localhost:5000/uploads/${folder}/${justFilename}`;
  
  console.log('✅ Generated from filename:', fullUrl);
  return fullUrl;
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return {
      healthy: true,
      data: response.data,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
};

// Test CORS function
export const testCors = async () => {
  try {
    const response = await api.get('/test-cors');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export default api;