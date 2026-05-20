// src/utils/api.js — Client HTTP Axios configuré
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur: ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur: gérer les erreurs 401 (token expiré / année terminée)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      if (code === 'ANNEE_TERMINEE') {
        localStorage.clear();
        window.location.href = '/login?reason=annee_terminee';
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
