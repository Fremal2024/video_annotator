import axios from 'axios';
import { authService } from './auth';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : '/api',
  timeout: 300000, // 5 minutes — allows for slow renders and large uploads
});

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 without logging out during uploads
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Only force logout for auth-level failures, not video/upload errors
    if (status === 401 && !url.includes('/videos/')) {
      authService.logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Video service
// ---------------------------------------------------------------------------
export const videoService = {
  // --- Videos ---
  uploadVideo: (formData, onUploadProgress) =>
    api.post('/videos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),

  getVideos: () => api.get('/videos/'),

  getVideo: (id) => api.get(`/videos/${id}/`),

  deleteVideo: (id) => api.delete(`/videos/${id}/`),

  // --- Clips ---
  addClip: (videoId, clip) =>
    api.post(`/videos/${videoId}/add_clip/`, clip),

  updateClip: (videoId, clipId, clip) =>
    api.post(`/videos/${videoId}/update_clip/`, {
      clip_id: clipId,
      ...clip,
    }),

  deleteClip: (videoId, clipId) =>
    api.post(`/videos/${videoId}/delete_clip/`, { clip_id: clipId }),

  autoAnnotate: (videoId) =>
    api.post(`/videos/${videoId}/auto_annotate/`),

  // --- Profile ---
  getProfile: () => api.get('/profile/'),

  updateProfile: (data) =>
    api.patch('/profile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (oldPw, newPw) =>
    api.post('/profile/change-password/', {
      old_password: oldPw,
      new_password: newPw,
    }),

  deleteAccount: () => api.delete('/profile/delete/'),

  // --- Billing ---
  upgradePlan: (plan, card) =>
    api.post('/profile/upgrade/', {
      plan,
      card_number: card.number,
    }),

  cancelPlan: () => api.post('/profile/cancel/'),
};

export default api;