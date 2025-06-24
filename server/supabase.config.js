const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Глобально устанавливаем fetch для Node.js
global.fetch = fetch;

// Ваши реальные данные из Supabase
const supabaseUrl = 'https://fkcopkuekbrnqctzzvgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY29wa3Vla2JybnFjdHp6dmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk2NzAsImV4cCI6MjA2NTk0NTY3MH0.f_wC9L79MQAj4LCxYXcm73MG_RUzkvwZWsq0pgM-1go';

console.log('✅ Supabase конфигурация загружена');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'smartphone-comparison-server'
    }
  },
  db: {
    schema: 'public'
  }
});

module.exports = supabase; 