import axios from 'axios';
import { supabase } from './supabaseClient'; // Импортируем supabase

// Создаем экземпляр axios с базовым URL
const instance = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем перехватчик запросов для добавления токена авторизации
instance.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обработки ошибок
instance.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios Error:', error);
    if (error.response) {
      // Сервер ответил с кодом ошибки
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // Запрос был отправлен, но нет ответа
      console.error('No response received:', error.request);
    } else {
      // Ошибка при настройке запроса
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance; 