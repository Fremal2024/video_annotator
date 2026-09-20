import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '';
const API_URL = `${BASE}/api`;

export const authService = {
  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login/`, {
      username,
      password,
    });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },

  register: async (username, email, password) => {
    const response = await axios.post(`${API_URL}/auth/register/`, {
      username,
      email,
      password,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const response = await axios.get(`${API_URL}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch {
      return null;
    }
  },

  isLoggedIn: () => !!localStorage.getItem('access_token'),

  getToken: () => localStorage.getItem('access_token'),
};