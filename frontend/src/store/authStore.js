import { create } from 'zustand';
import api from '../api/api'; // ✅ use your configured axios instance
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token, isAuthenticated: !!token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // ✅ use api.post() for backend routes
  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', payload);
      toast.success('Registered. Check email for OTP.');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed');
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      toast.success('OTP sent to email');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async ({ email, otp }) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      set({ user: data.user });
      get().setToken(data.token);
      toast.success('Logged in successfully');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.msg || 'OTP verification failed');
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));

export default useAuthStore;
