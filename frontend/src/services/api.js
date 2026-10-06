import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password }),
};

// Student Services
export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (formData) =>
    api.post('/students', formData, {
      headers: {
        'Content-Type': formData instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    }),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  registerFace: (id, payload) =>
    api.post(`/students/${id}/face`, payload, {
      headers: {
        'Content-Type': payload instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    }),
};

// Attendance Services
export const attendanceService = {
  recognizeFrame: (image_base64) => api.post('/attendance/recognize', { image_base64 }),
  markManual: (payload) => api.post('/attendance/manual', payload),
  getRecords: (params) => api.get('/attendance', { params }),
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  getByStudent: (id) => api.get(`/attendance/student/${id}`),
};

// Dashboard Services
export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

// Reports Services
export const reportsService = {
  getData: (params) => api.get('/reports', { params }),
  getCSVUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `/api/reports/csv?${query}`;
  },
  getPDFUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `/api/reports/pdf?${query}`;
  },
};

// Settings Services
export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export default api;
