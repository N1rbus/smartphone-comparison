require('dotenv').config({ path: './config.env' });

console.log('🔍 Отладка конфигурации...\n');

console.log('1️⃣ Переменные окружения:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'УСТАНОВЛЕН' : 'НЕ УСТАНОВЛЕН');

console.log('\n2️⃣ Проверка файла config.env:');
const fs = require('fs');
try {
  const configContent = fs.readFileSync('./config.env', 'utf8');
  console.log('Содержимое файла config.env:');
  console.log(configContent);
} catch (error) {
  console.error('Ошибка чтения config.env:', error.message);
}

console.log('\n3️⃣ Проверка текущей директории:');
console.log('Текущая директория:', process.cwd());
console.log('Файлы в директории:', fs.readdirSync('.').filter(f => f.endsWith('.env'))); 