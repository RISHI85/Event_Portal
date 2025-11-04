import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: 'https://event-portal-5626.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 / expired token
api.interceptors.response.use(
  (res) => {
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.response?.data?.msg || '';
    if (status === 401 || /jwt expired/i.test(msg)) {
      const { logout } = useAuthStore.getState();
      logout();
      // Best-effort redirect for SPA
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
