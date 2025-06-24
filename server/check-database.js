const supabase = require('./supabase.config');

async function checkDatabaseStructure() {
  console.log('🔍 Проверка структуры базы данных в Supabase...\n');
  
  try {
    // Проверка таблицы brands
    console.log('1️⃣ Проверка таблицы brands...');
    const { data: brandsData, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .limit(1);
    
    if (brandsError) {
      console.error('❌ Таблица brands не найдена или недоступна:', brandsError.message);
    } else {
      console.log('✅ Таблица brands существует');
      console.log('📊 Структура данных:', Object.keys(brandsData[0] || {}));
    }
    
    console.log('\n');
    
    // Проверка таблицы models
    console.log('2️⃣ Проверка таблицы models...');
    const { data: modelsData, error: modelsError } = await supabase
      .from('models')
      .select('*')
      .limit(1);
    
    if (modelsError) {
      console.error('❌ Таблица models не найдена или недоступна:', modelsError.message);
    } else {
      console.log('✅ Таблица models существует');
      console.log('📊 Структура данных:', Object.keys(modelsData[0] || {}));
    }
    
    console.log('\n');
    
    // Проверка таблицы smartphones
    console.log('3️⃣ Проверка таблицы smartphones...');
    const { data: smartphonesData, error: smartphonesError } = await supabase
      .from('smartphones')
      .select('*')
      .limit(1);
    
    if (smartphonesError) {
      console.error('❌ Таблица smartphones не найдена или недоступна:', smartphonesError.message);
    } else {
      console.log('✅ Таблица smartphones существует');
      console.log('📊 Структура данных:', Object.keys(smartphonesData[0] || {}));
    }
    
    console.log('\n');
    
    // Проверка связей
    console.log('4️⃣ Проверка связей между таблицами...');
    const { data: relationsData, error: relationsError } = await supabase
      .from('smartphones')
      .select(`
        id,
        name,
        brand_id,
        model_id,
        brands!inner(id, name),
        models!inner(id, name)
      `)
      .limit(1);
    
    if (relationsError) {
      console.error('❌ Проблемы со связями между таблицами:', relationsError.message);
    } else {
      console.log('✅ Связи между таблицами работают корректно');
      if (relationsData.length > 0) {
        const item = relationsData[0];
        console.log(`📱 Пример: ${item.name} -> Бренд: ${item.brands?.name}, Модель: ${item.models?.name}`);
      }
    }
    
    console.log('\n');
    
    // Статистика
    console.log('5️⃣ Статистика базы данных...');
    
    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    const { count: modelsCount } = await supabase
      .from('models')
      .select('*', { count: 'exact', head: true });
    
    const { count: smartphonesCount } = await supabase
      .from('smartphones')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Брендов: ${brandsCount || 0}`);
    console.log(`📊 Моделей: ${modelsCount || 0}`);
    console.log(`📊 Смартфонов: ${smartphonesCount || 0}`);
    
    console.log('\n🎉 Проверка структуры завершена!');
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    console.error('Проверьте настройки подключения и структуру базы данных');
  }
}

// Запуск проверки
checkDatabaseStructure(); 