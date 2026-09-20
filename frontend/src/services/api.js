import axios from 'axios';
import { authService } from './auth';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : '/api',
  timeout: 300000, // 5 minutes timeout for video uploads
});

// Attach the JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors — but don't log out during /videos/ requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Only force logout for auth requests, not video/upload errors
    if (status === 401 && !url.includes('/videos/')) {
      authService.logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const videoService = {
  uploadVideo: (formData, onUploadProgress) =>
    api.post('/videos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  getVideos: () => api.get('/videos/'),
  getVideo: (id) => api.get(`/videos/${id}/`),
  deleteVideo: (id) => api.delete(`/videos/${id}/`),
  addClip: (videoId, clip) => api.post(`/videos/${videoId}/add_clip/`, clip),
  updateClip: (videoId, clipId, clip) =>
    api.post(`/videos/${videoId}/update_clip/`, { clip_id: clipId, ...clip }),
  deleteClip: (videoId, clipId) =>
    api.post(`/videos/${videoId}/delete_clip/`, { clip_id: clipId }),
  autoAnnotate: (videoId) => api.post(`/videos/${videoId}/auto_annotate/`),
};

export default api;