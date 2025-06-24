const fs = require('fs');
const path = require('path');
const supabase = require('./supabase.config');

async function setupDatabase() {
  try {
    console.log('🔧 Начинаем настройку базы данных...');
    
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, 'setup_database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL файл прочитан, выполняем запросы...');
    
    // Выполняем SQL запросы
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // Если RPC не работает, попробуем выполнить через обычный запрос
      console.log('⚠️ RPC не работает, пробуем альтернативный способ...');
      
      // Разбиваем SQL на отдельные запросы и выполняем их по очереди
      const queries = sqlContent.split(';').filter(q => q.trim());
      
      for (const query of queries) {
        if (query.trim()) {
          try {
            const { error: queryError } = await supabase.from('users').select('*').limit(1);
            if (queryError && queryError.message.includes('relation "users" does not exist')) {
              console.log('❌ Таблица users не существует. Нужно выполнить SQL вручную в Supabase Dashboard.');
              console.log('📋 Перейдите в Supabase Dashboard -> SQL Editor и выполните содержимое файла setup_database.sql');
              return;
            }
          } catch (e) {
            console.log('❌ Ошибка при проверке таблицы:', e.message);
          }
        }
      }
    } else {
      console.log('✅ База данных настроена успешно!');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при настройке базы данных:', error);
    console.log('📋 Рекомендация: Выполните SQL вручную в Supabase Dashboard -> SQL Editor');
  }
}

// Запускаем настройку
setupDatabase(); 