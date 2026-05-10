// src/contexts/AuthContext.jsx — Gestion globale de l'authentification
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { logout(); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  // Helpers permissions
  const isProf = () => user?.rang === 'professeur';
  const isDelegue = () => user?.rang === 'delegue';
  const isEtudiant = () => user?.rang === 'etudiant';
  const canEdit = () => user?.rang === 'delegue' || user?.rang === 'professeur';
  
  const isOwnFiliere = (filiere_id) => user?.filiere_id === parseInt(filiere_id);
  const isOwnNiveau = (niveau_id) => user?.niveau_id === parseInt(niveau_id);

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      isProf, isDelegue, isEtudiant, canEdit,
      isOwnFiliere, isOwnNiveau
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans AuthProvider');
  return ctx;
};