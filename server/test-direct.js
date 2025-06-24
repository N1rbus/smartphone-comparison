const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Глобально устанавливаем fetch для Node.js
global.fetch = fetch;

console.log('🔍 Прямой тест подключения к Supabase...\n');

// Ваши реальные данные
const supabaseUrl = 'https://fkcopkuekbrnqctzzvgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY29wa3Vla2JybnFjdHp6dmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk2NzAsImV4cCI6MjA2NTk0NTY3MH0.f_wC9L79MQAj4LCxYXcm73MG_RUzkvwZWsq0pgM-1go';

console.log('1️⃣ Создание клиента Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('2️⃣ Тестирование подключения...');
async function testConnection() {
  try {
    console.log('Попытка подключения к таблице brands...');
    const { data, error } = await supabase
      .from('brands')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Ошибка:', error.message);
      console.error('Детали ошибки:', error);
    } else {
      console.log('✅ Подключение успешно!');
      console.log('📊 Данные:', data);
    }
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
  }
}

testConnection(); 