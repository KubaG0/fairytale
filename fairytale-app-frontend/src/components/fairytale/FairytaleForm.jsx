import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { fairytaleService } from '../../services/api';

const FairytaleForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    
    try {
      // Konwersja czasu z minut na sekundy
      const fairytaleData = {
        ...data,
        duration: parseInt(data.duration)
      };
      
      await fairytaleService.generateFairytale(fairytaleData);
      navigate('/moje-bajki');
    } catch (error) {
      setApiError(error.response?.data?.message || 'Wystąpił błąd podczas generowania bajki');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Generuj nową bajkę</h2>
      
      {apiError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {apiError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Krótka informacja o rodzaju bajki
          </label>
          <textarea
            id="description"
            rows="4"
            className="input"
            placeholder="Np. Bajka o przyjaźni, bajka o pomaganiu innym, bajka o odwadze..."
            {...register('description', { 
              required: 'Opis bajki jest wymagany',
              minLength: {
                value: 10,
                message: 'Opis powinien zawierać co najmniej 10 znaków'
              }
            })}
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="characters" className="block text-sm font-medium text-gray-700 mb-1">
            Główni bohaterowie
          </label>
          <input
            id="characters"
            type="text"
            className="input"
            placeholder="Np. Zuzia i jej pies Puszek, rycerz Mikołaj, wróżka Liliana..."
            {...register('characters', { 
              required: 'Bohaterowie są wymagani',
              minLength: {
                value: 3,
                message: 'Podaj co najmniej jednego bohatera'
              }
            })}
          />
          {errors.characters && (
            <p className="mt-1 text-sm text-red-600">{errors.characters.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Czas trwania (w sekundach)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="duration"
              min="10"
              max="180"
              step="10"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              {...register('duration', { 
                required: 'Czas trwania jest wymagany',
                min: {
                  value: 10,
                  message: 'Minimalny czas to 10 sekund'
                },
                max: {
                  value: 180,
                  message: 'Maksymalny czas to 3 minuty'
                }
              })}
            />
            <span className="text-gray-700 w-16 text-right">
              {Math.floor(parseInt(register('duration').value || 90) / 60)}:{(parseInt(register('duration').value || 90) % 60).toString().padStart(2, '0')}
            </span>
          </div>
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Generowanie...' : 'Generuj bajkę'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FairytaleForm;