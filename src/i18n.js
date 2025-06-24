// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import ruTranslation from './locales/ru/translation.json';

i18n
  .use(initReactI18next) // подключаем плагин для React
  .use(LanguageDetector) // подключаем определение языка
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      ru: {
        translation: ruTranslation,
      },
    },
    fallbackLng: 'en', // язык по умолчанию
    detection: {
      order: ['localStorage', 'navigator'], // сохранённый язык или язык браузера
      caches: ['localStorage'], // сохраняем выбранный пользователем язык
    },
    interpolation: {
      escapeValue: false, // не экранируем значения
    },
  });

export default i18n;