const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require('crypto');
const supabase = require('./supabase.config');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Функция для повторных попыток с экспоненциальной задержкой
const retryWithBackoff = async (operation, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isNetworkError = error.code === 'ECONNRESET' || 
                            error.code === 'ENOTFOUND' || 
                            error.code === 'ETIMEDOUT' ||
                            error.message.includes('ECONNRESET') ||
                            error.message.includes('fetch failed');
      
      if (isNetworkError && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️ Попытка ${attempt} не удалась (${error.code || error.message}). Повтор через ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Улучшенная функция для выполнения Supabase запросов с повторными попытками
const executeSupabaseQuery = async (queryFn, operationName = 'Supabase query') => {
  try {
    return await retryWithBackoff(async () => {
      const result = await queryFn();
      if (result.error) {
        throw new Error(`Supabase error: ${result.error.message}`);
      }
      return result;
    });
  } catch (error) {
    console.error(`❌ Ошибка ${operationName}:`, {
      message: error.message,
      details: error.stack,
      code: error.code,
      hint: error.hint || '',
    });
    throw error;
  }
};

// Настройка загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла'));
    }
  }
});

// Middleware для проверки JWT и получения пользователя
const getUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Недействительный токен или сессия истекла' });
  }

  req.user = user;
  next();
};

// 1. Получение всех брендов
app.get("/brands", async (req, res) => {
  try {
    const { data } = await executeSupabaseQuery(
      () => supabase.from('brands').select('id, name'),
      'получения брендов'
    );
    
    res.json(data);
  } catch (error) {
    console.error("❌ Ошибка получения брендов:", {
      message: error.message,
      code: error.code,
      hint: error.hint || '',
    });
    res.status(500).json({ 
      error: "Ошибка подключения к базе данных", 
      details: error.message,
      code: error.code 
    });
  }
});

// 2. Получение всех устройств (исправленная версия)
app.get("/devices", async (req, res) => {
  try {
    // Сначала получаем смартфоны
    const { data: smartphones } = await executeSupabaseQuery(
      () => supabase.from('smartphones').select('*').order('name'),
      'получения смартфонов'
    );
    
    // Получаем бренды
    const { data: brands } = await executeSupabaseQuery(
      () => supabase.from('brands').select('id, name'),
      'получения брендов'
    );
    
    // Получаем модели
    const { data: models } = await executeSupabaseQuery(
      () => supabase.from('models').select('id, name, brand_id'),
      'получения моделей'
    );
    
    // Создаем словари для быстрого поиска
    const brandsMap = {};
    brands.forEach(brand => {
      brandsMap[brand.id] = brand.name;
    });
    
    const modelsMap = {};
    models.forEach(model => {
      modelsMap[model.id] = model.name;
    });
    
    // Объединяем данные
    const transformedData = smartphones.map(phone => ({
      ...phone,
      brand_name: brandsMap[phone.brand_id] || 'Неизвестный бренд',
      model_name: modelsMap[phone.model_id] || 'Неизвестная модель'
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error("❌ Ошибка получения устройств:", {
      message: error.message,
      code: error.code,
      hint: error.hint || '',
    });
    res.status(500).json({ 
      error: "Ошибка подключения к базе данных", 
      details: error.message,
      code: error.code 
    });
  }
});

// 3. Получение устройств по бренду (исправленная версия)
app.get("/devices/by-brand/:brandId", async (req, res) => {
  try {
    const { brandId } = req.params;
    
    // Получаем смартфоны по бренду
    const { data: smartphones, error: smartphonesError } = await supabase
      .from('smartphones')
      .select('*')
      .eq('brand_id', brandId)
      .order('name');
    
    if (smartphonesError) throw smartphonesError;
    
    // Получаем бренды
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name');
    
    if (brandsError) throw brandsError;
    
    // Получаем модели
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id, name, brand_id');
    
    if (modelsError) throw modelsError;
    
    // Создаем словари для быстрого поиска
    const brandsMap = {};
    brands.forEach(brand => {
      brandsMap[brand.id] = brand.name;
    });
    
    const modelsMap = {};
    models.forEach(model => {
      modelsMap[model.id] = model.name;
    });
    
    // Объединяем данные
    const transformedData = smartphones.map(phone => ({
      ...phone,
      brand_name: brandsMap[phone.brand_id] || 'Неизвестный бренд',
      model_name: modelsMap[phone.model_id] || 'Неизвестная модель'
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error("Ошибка получения устройств по бренду:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Получение всех моделей
app.get("/models", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('id, name, brand_id');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Ошибка получения моделей:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. Получение моделей по бренду
app.get("/models/by-brand/:brandId", async (req, res) => {
  try {
    const { brandId } = req.params;
    const { data, error } = await supabase
      .from('models')
      .select('id, name, brand_id')
      .eq('brand_id', brandId);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Ошибка получения моделей по бренду:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 6. Получение устройства по ID (исправленная версия)
app.get("/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: smartphone, error: smartphoneError } = await supabase
      .from('smartphones')
      .select('*')
      .eq('id', id)
      .single();
    
    if (smartphoneError) throw smartphoneError;
    
    // Получаем бренд
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('name')
      .eq('id', smartphone.brand_id)
      .single();
    
    // Получаем модель
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('name')
      .eq('id', smartphone.model_id)
      .single();
    
    const transformedData = {
      ...smartphone,
      brand_name: brand?.name || 'Неизвестный бренд',
      model_name: model?.name || 'Неизвестная модель'
    };
    
    res.json(transformedData);
  } catch (error) {
    console.error("Ошибка получения устройства:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 7. Поиск устройств (исправленная версия)
app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }
    
    const { data: smartphones, error: smartphonesError } = await supabase
      .from('smartphones')
      .select('id, name, price, processor, image_url, brand_id, model_id')
      .or(`name.ilike.%${query}%, processor.ilike.%${query}%`)
      .limit(10);
    
    if (smartphonesError) throw smartphonesError;
    
    // Получаем бренды
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name');
    
    if (brandsError) throw brandsError;
    
    // Получаем модели
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id, name, brand_id');
    
    if (modelsError) throw modelsError;
    
    // Создаем словари для быстрого поиска
    const brandsMap = {};
    brands.forEach(brand => {
      brandsMap[brand.id] = brand.name;
    });
    
    const modelsMap = {};
    models.forEach(model => {
      modelsMap[model.id] = model.name;
    });
    
    // Объединяем данные
    const transformedData = smartphones.map(phone => ({
      ...phone,
      brand_name: brandsMap[phone.brand_id] || 'Неизвестный бренд',
      model_name: modelsMap[phone.model_id] || 'Неизвестная модель'
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error("Ошибка поиска:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 8. Загрузка изображения
app.post("/upload-image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error("Ошибка загрузки изображения:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 9. Добавление нового устройства
app.post("/devices", async (req, res) => {
  try {
    const deviceData = req.body;
    const { data, error } = await supabase
      .from('smartphones')
      .insert([deviceData])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Ошибка добавления устройства:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 10. Обновление устройства
app.put("/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deviceData = req.body;
    const { data, error } = await supabase
      .from('smartphones')
      .update(deviceData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Ошибка обновления устройства:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 11. Удаление устройства
app.delete("/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('smartphones')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: "Устройство удалено" });
  } catch (error) {
    console.error("Ошибка удаления устройства:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Health check endpoint для диагностики подключения
app.get("/health", async (req, res) => {
  try {
    const startTime = Date.now();
    const { data } = await executeSupabaseQuery(
      () => supabase.from('brands').select('count').limit(1),
      'health check'
    );
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// --- AUTHENTICATION ---

// Регистрация нового пользователя
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Ошибка регистрации в Supabase:', error.message);
      if (error.message.includes('User already registered')) {
        return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      }
      if (error.message.includes('Password should be at least 6 characters')) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
      }
      return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }

    // Если сессии нет, но пользователь создан - значит, требуется подтверждение по почте
    if (data.user && !data.session) {
      return res.status(200).json({ 
        message: 'Регистрация почти завершена! Мы отправили ссылку для подтверждения на ваш email.'
      });
    }

    // Если и пользователь, и сессия есть - значит, авто-подтверждение включено
    res.status(201).json({ 
        message: 'Пользователь успешно зарегистрирован!', 
        user: data.user 
    });

  } catch (error) {
    console.error('Критическая ошибка на сервере:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вход пользователя
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Ошибка входа в Supabase:', error.message);
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }
      return res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
    
    res.status(200).json({
      message: 'Вход выполнен успешно!',
      session: data.session,
      user: data.user
    });

  } catch (error) {
    console.error('Критическая ошибка на сервере:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// --- USER PROFILE API (Protected Routes) ---

// Обновление данных профиля (имя)
app.post('/api/users/update', getUser, async (req, res) => {
  const { id } = req.user;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Имя не может быть пустым' });
  }
  
  try {
    // Обновляем публичную таблицу 'users', а не 'auth.users'
    const { data, error } = await supabase
      .from('users')
      .update({ name: name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления профиля:', error);
      // Это может произойти, если пользователя еще нет в public.users
      if (error.code === 'PGRST116') {
         return res.status(404).json({ success: false, message: 'Профиль пользователя не найден. Возможно, он еще не создан.' });
      }
      throw error;
    }
    
    res.json({ success: true, user: data });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Ошибка сервера при обновлении профиля' });
  }
});

// Загрузка аватара
app.post('/api/users/upload-avatar', getUser, upload.single('avatar'), async (req, res) => {
  const { id } = req.user;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Файл аватара не был загружен' });
  }
  
  const avatarPath = `uploads/${req.file.filename}`;

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ avatar_url: avatarPath })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Возвращаем полный URL для клиента
    const fullAvatarUrl = `${req.protocol}://${req.get('host')}/${avatarPath}`;
    res.json({ success: true, avatarUrl: fullAvatarUrl });

  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при загрузке аватара' });
  }
});


// Получение избранных смартфонов пользователя
app.get('/api/user-favorites', getUser, async (req, res) => {
    const userId = req.user.id;
    try {
        const { data: favorites, error } = await supabase
            .from('user_favorites')
            .select('smartphone_id')
            .eq('user_id', userId);

        if (error) throw error;

        const smartphoneIds = favorites.map(f => f.smartphone_id);
        
        if (smartphoneIds.length === 0) {
            return res.json([]);
        }

        const { data: smartphones, error: phonesError } = await supabase
            .from('smartphones')
            .select(`
                *,
                brand:brands(name),
                model:models(name)
            `)
            .in('id', smartphoneIds);

        if (phonesError) throw phonesError;
        
        const transformedData = smartphones.map(phone => ({
            ...phone,
            brand_name: phone.brand?.name || 'Неизвестный бренд',
            model_name: phone.model?.name || 'Неизвестная модель'
        }));

        res.json(transformedData);
    } catch (error) {
        console.error('Ошибка получения избранного:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение истории сравнений пользователя (заглушка)
app.get('/api/user-comparisons', getUser, async (req, res) => {
    // TODO: Реализовать логику получения истории сравнений из БД
    // Сейчас возвращается пустой массив для демонстрации
    res.json([]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log('Используется Supabase для базы данных');
}); 