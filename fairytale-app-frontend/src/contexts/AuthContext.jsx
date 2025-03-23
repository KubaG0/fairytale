import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sprawdzenie stanu autoryzacji przy ładowaniu
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Sprawdź czy mamy token
        if (authService.isAuthenticated()) {
          // Pobierz dane użytkownika z localStorage
          const userData = authService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error("Błąd podczas sprawdzania autoryzacji:", err);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Logowanie
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas logowania');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Rejestracja
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas rejestracji');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Wylogowanie
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: authService.isAuthenticated()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};