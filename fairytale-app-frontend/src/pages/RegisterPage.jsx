import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error: authError, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
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
    
    if (!formData.name) {
      newErrors.name = 'Imię jest wymagane';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Podaj prawidłowy adres email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Hasło musi mieć co najmniej 8 znaków';
    }
    
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Hasła muszą być identyczne';
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
      // Pomijamy passwordConfirm przy wysyłaniu do API
      const { passwordConfirm, ...userData } = formData;
      await register(userData);
      navigate('/generator');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Wystąpił błąd podczas rejestracji');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Rejestracja</h1>
        <p className="text-gray-600">
          Utwórz konto, aby generować i zapisywać swoje bajki
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Imię
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Twoje imię"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          
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
              placeholder="Minimum 8 znaków"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
              Powtórz hasło
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Powtórz hasło"
            />
            {errors.passwordConfirm && (
              <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
            disabled={loading}
          >
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>
      </div>
      
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Masz już konto?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;