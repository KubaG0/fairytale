import axios from 'axios';

// Bazowy URL do API backendu
const API_URL = 'http://localhost:5000/api';

// Tworzenie instancji axios z bazowym URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor do dodawania tokenu do nagłówka
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor do obsługi odpowiedzi i błędów
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jeśli błąd 401 (Unauthorized), wyloguj użytkownika
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serwis obsługi autoryzacji
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  getProfile: () => api.get('/auth/me')
};

// Serwis obsługi bajek
export const fairytaleService = {
  generateFairytale: (fairytaleData) => 
    api.post('/fairytales', fairytaleData),
  
  getFairytales: () => 
    api.get('/fairytales'),
  
  getFairytale: (id) => 
    api.get(`/fairytales/${id}`),
  
  deleteFairytale: (id) => 
    api.delete(`/fairytales/${id}`)
};

export default api;