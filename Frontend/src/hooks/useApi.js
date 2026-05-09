// src/hooks/useApi.js — Hook personnalisé pour les appels API avec état
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

/**
 * Hook pour charger des données depuis l'API
 * Usage: const { data, loading, error, refetch } = useApi('/etudiants/filiere/1/niveau/1')
 */
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(url, { params: options.params });
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur de chargement';
      setError(msg);
      if (options.showError !== false) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options.params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

/**
 * Hook pour les mutations (POST, PUT, DELETE)
 * Usage: const { mutate, loading } = useMutation()
 */
export const useMutation = () => {
  const [loading, setLoading] = useState(false);

  const mutate = async ({ method = 'post', url, data, successMsg, errorMsg, isFormData = false }) => {
    setLoading(true);
    try {
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const res = await api[method](url, data, config);
      if (successMsg) toast.success(successMsg);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = errorMsg || err.response?.data?.message || 'Erreur';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
};