const supabase = require('./supabase.config');

async function testSupabaseConnection() {
  console.log('🔍 Тестирование подключения к Supabase...\n');
  
  try {
    // Тест 1: Проверка подключения
    console.log('1️⃣ Проверка подключения...');
    const { data: testData, error: testError } = await supabase
      .from('brands')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Ошибка подключения:', testError.message);
      return;
    }
    
    console.log('✅ Подключение успешно!\n');
    
    // Тест 2: Получение количества брендов
    console.log('2️⃣ Получение количества брендов...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name');
    
    if (brandsError) {
      console.error('❌ Ошибка получения брендов:', brandsError.message);
    } else {
      console.log(`✅ Найдено брендов: ${brands.length}`);
      console.log('📋 Список брендов:');
      brands.forEach(brand => {
        console.log(`   - ${brand.name} (ID: ${brand.id})`);
      });
    }
    
    console.log('\n');
    
    // Тест 3: Получение количества смартфонов
    console.log('3️⃣ Получение количества смартфонов...');
    const { data: smartphones, error: smartphonesError } = await supabase
      .from('smartphones')
      .select('id, name, brand_id')
      .limit(5);
    
    if (smartphonesError) {
      console.error('❌ Ошибка получения смартфонов:', smartphonesError.message);
    } else {
      console.log(`✅ Найдено смартфонов: ${smartphones.length} (показано первые 5)`);
      console.log('📱 Примеры смартфонов:');
      smartphones.forEach(phone => {
        console.log(`   - ${phone.name} (ID: ${phone.id}, Brand ID: ${phone.brand_id})`);
      });
    }
    
    console.log('\n');
    
    // Тест 4: Получение количества моделей
    console.log('4️⃣ Получение количества моделей...');
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id, name, brand_id')
      .limit(5);
    
    if (modelsError) {
      console.error('❌ Ошибка получения моделей:', modelsError.message);
    } else {
      console.log(`✅ Найдено моделей: ${models.length} (показано первые 5)`);
      console.log('📋 Примеры моделей:');
      models.forEach(model => {
        console.log(`   - ${model.name} (ID: ${model.id}, Brand ID: ${model.brand_id})`);
      });
    }
    
    console.log('\n');
    
    // Тест 5: Проверка связей между таблицами
    console.log('5️⃣ Проверка связей между таблицами...');
    const { data: joinedData, error: joinError } = await supabase
      .from('smartphones')
      .select(`
        id,
        name,
        price,
        brands!inner(name),
        models!inner(name)
      `)
      .limit(3);
    
    if (joinError) {
      console.error('❌ Ошибка проверки связей:', joinError.message);
    } else {
      console.log('✅ Связи между таблицами работают корректно!');
      console.log('🔗 Примеры связанных данных:');
      joinedData.forEach(item => {
        console.log(`   - ${item.name} | Бренд: ${item.brands?.name} | Модель: ${item.models?.name} | Цена: ${item.price}`);
      });
    }
    
    console.log('\n🎉 Все тесты завершены!');
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    console.error('Проверьте настройки подключения в supabase.config.js');
  }
}

// Запуск тестов
testSupabaseConnection(); 