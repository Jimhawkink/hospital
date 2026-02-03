// src/api/axiosInstance.ts
import axios from 'axios';

// Debug: Log environment info
console.log('🔧 Environment check:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  currentURL: window.location.origin
});

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔧 Axios instance created with baseURL:', api.defaults.baseURL);

// Request interceptor for adding auth tokens, etc.
api.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common HTTP errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;