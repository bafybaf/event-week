import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  company?: string;
  phone?: string;
  profileImage?: string;
  qrCode?: string;
  role: 'participant' | 'speaker' | 'admin' | 'organizer';
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Giriş başarısız');
    }
  },

  async register(userData: Partial<User> & { password: string }): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Kayıt başarısız');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Kullanıcı bilgileri alınamadı');
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await api.post('/auth/refresh-token');
      const { token } = response.data;
      await AsyncStorage.setItem('token', token);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Token yenileme başarısız');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Şifre sıfırlama başarısız');
    }
  },

  async logout(): Promise<void> {
    try {
      const { default: notificationService } = await import('./notificationService');
      await notificationService.unregisterPushToken();
    } catch (error) {
      // Token silinmese bile çıkışa devam et
    }
    await AsyncStorage.clear();
  },

  async getStoredUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      return !!(token && user);
    } catch (error) {
      return false;
    }
  },

  // Validate user by phone number (event is resolved from the user record)
  async validatePhoneUser(phoneNumber: string, eventId?: string) {
    try {
      const response = await api.post('/users/validate-phone', {
        phoneNumber,
        ...(eventId ? { eventId } : {})
      });
      
      // Token'ı kaydet
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Kullanıcı doğrulanamadı');
    }
  },

  // Register new user from mobile
  async registerMobileUser(userData: {
    phoneNumber: string;
    eventId: string;
    firstName: string;
    lastName: string;
    email?: string;
  }) {
    try {
      const response = await api.post('/users/register-mobile', userData);
      
      // Token'ı kaydet
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Kullanıcı kaydedilemedi');
    }
  },
};

export default api;
