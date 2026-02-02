// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Add request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hms_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Type guard to check if error is an axios error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 401) {
        localStorage.removeItem("hms_token");
        window.location.href = "/login";
      }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        console.error("Server error:", axiosError.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default api;