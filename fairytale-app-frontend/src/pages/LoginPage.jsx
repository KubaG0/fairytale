import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error: authError, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Podaj prawidłowy adres email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setApiError('');
    
    try {
      await login(formData);
      navigate('/generator');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Wystąpił błąd podczas logowania');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Logowanie</h1>
        <p className="text-gray-600">
          Zaloguj się, aby korzystać z Bajkowego Generatora
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {(apiError || authError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {apiError || authError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="twoj@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Twoje hasło"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Zapamiętaj mnie
              </label>
            </div>
            
            <button 
              type="button"
              onClick={() => alert('Funkcja w przygotowaniu')}
              className="text-sm text-primary hover:underline"
            >
              Zapomniałeś hasła?
            </button>
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
            disabled={loading}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
      </div>
      
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Nie masz jeszcze konta?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;