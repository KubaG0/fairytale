import { useState, useEffect } from 'react';
import { fairytaleService } from '../services/api';

export const useFairytale = () => {
  const [fairytales, setFairytales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pobierz wszystkie bajki użytkownika
  const fetchFairytales = async () => {
    try {
      setLoading(true);
      const response = await fairytaleService.getFairytales();
      setFairytales(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się pobrać bajek');
    } finally {
      setLoading(false);
    }
  };
  
  // Pobierz pojedynczą bajkę
  const getFairytale = async (id) => {
    try {
      setLoading(true);
      const response = await fairytaleService.getFairytale(id);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się pobrać bajki');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Usuń bajkę
  const deleteFairytale = async (id) => {
    try {
      await fairytaleService.deleteFairytale(id);
      // Odśwież listę bajek
      setFairytales(fairytales.filter(fairytale => fairytale.id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się usunąć bajki');
      return false;
    }
  };
  
  // Automatycznie pobierz bajki przy pierwszym renderowaniu
  useEffect(() => {
    fetchFairytales();
  }, []);
  
  return {
    fairytales,
    loading,
    error,
    fetchFairytales,
    getFairytale,
    deleteFairytale
  };
};

export default useFairytale;