const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // отдача статики для аватаров

// Настройка соединения с MySQL
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // Укажите пароль, если он установлен
  database: "smartphone_db",
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

// 1. Получение всех брендов
app.get("/brands", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT id, name FROM brands");
    res.json(rows);
  } catch (error) {
    console.error("Ошибка получения брендов:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. Получение всех устройств
app.get("/devices", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
        s.id, 
        s.name,
        s.price, 
        s.processor, 
        s.image_url, 
        s.brand_id, 
        s.model_id, 
        b.name AS brand_name, 
        m.name AS model_name,
        s.release_date,
        s.battery, 
        s.screen, 
        s.os, 
        s.cameras, 
        s.ram, 
        s.storage, 
        s.screen_type, 
        s.refresh_rate, 
        s.resolution, 
        s.weight, 
        s.body_material, 
        s.water_resistance, 
        s.wireless_charging, 
        s.fast_charging, 
        s.main_camera_resolution, 
        s.main_camera_aperture, 
        s.front_camera_resolution, 
        s.front_camera_aperture, 
        s.5g_support, 
        s.fingerprint_scanner, 
        s.nfc, 
        s.microsd_slot, 
        s.colors, 
        s.warranty, 
        s.battery_type, 
        s.stereo_speakers, 
        s.headphone_jack, 
        s.connectivity, 
        s.dimensions, 
        s.special_features, 
        s.screen_special_features, 
        s.sound_special_features, 
        s.wired_charging, 
        s.wireless_charging_power, 
        s.name_hash,
        s.ppi, 
        s.aspect_ratio, 
        s.brightness_contrast,
        s.cpu_multicore_benchmark,
        s.cpu_singlecore_benchmark,
        s.gpu_benchmark,
        s.gaming_fps_average,
        s.gaming_fps_min
      FROM smartphones s
      JOIN brands b ON s.brand_id = b.id
      JOIN models m ON s.model_id = m.id AND m.brand_id = b.id
      ORDER BY s.name
    `);
    res.json(rows);
  } catch (error) {
    console.error("Ошибка получения устройств:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. Получение устройств по бренду (по ID бренда)
app.get("/devices/by-brand/:brandId", async (req, res) => {
  try {
    const { brandId } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
        s.id, 
        s.name,
        s.price, 
        s.processor, 
        s.image_url, 
        b.name AS brand_name, 
        m.name AS model_name,
        s.release_date,
        s.battery, 
        s.screen, 
        s.os, 
        s.cameras, 
        s.ram, 
        s.storage, 
        s.screen_type, 
        s.refresh_rate, 
        s.resolution, 
        s.weight, 
        s.body_material, 
        s.water_resistance, 
        s.wireless_charging, 
        s.fast_charging, 
        s.main_camera_resolution, 
        s.main_camera_aperture, 
        s.front_camera_resolution, 
        s.front_camera_aperture, 
        s.5g_support, 
        s.fingerprint_scanner, 
        s.nfc, 
        s.microsd_slot, 
        s.colors, 
        s.warranty, 
        s.battery_type, 
        s.stereo_speakers, 
        s.headphone_jack, 
        s.connectivity, 
        s.dimensions, 
        s.special_features, 
        s.screen_special_features, 
        s.sound_special_features, 
        s.wired_charging, 
        s.wireless_charging_power, 
        s.name_hash,
        s.ppi, 
        s.aspect_ratio, 
        s.brightness_contrast,
        s.cpu_multicore_benchmark,
        s.cpu_singlecore_benchmark,
        s.gpu_benchmark,
        s.gaming_fps_average,
        s.gaming_fps_min
      FROM smartphones s
      JOIN brands b ON s.brand_id = b.id
      JOIN models m ON s.model_id = m.id AND m.brand_id = b.id
      WHERE b.id = ?
      ORDER BY s.name
    `, [brandId]);
    res.json(rows);
  } catch (error) {
    console.error("Ошибка получения устройств по бренду:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Получение моделей по бренду
app.get('/models', async (req, res) => {
  const { brand_id } = req.query;
  try {
    const connection = await mysql.createConnection(dbConfig);
    let rows;
    if (brand_id) {
      [rows] = await connection.execute('SELECT id, name FROM models WHERE brand_id = ?', [brand_id]);
    } else {
      [rows] = await connection.execute('SELECT id, name FROM models');
    }
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения моделей:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Регистрация
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, password]
    );
    res.json({ 
      success: true, 
      user: { 
        id: result.insertId,
        email: email,
        role: 'user'
      } 
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Логин
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (rows.length > 0) {
      res.json({ 
        success: true, 
        user: { 
          id: rows[0].id,
          email: rows[0].email,
          name: rows[0].name,
          avatar: rows[0].avatar,
          role: rows[0].role
        } 
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Сохранение сравнений пользователя (теперь сохраняет каждую группу сравнений отдельно)
app.post('/api/user-comparisons', async (req, res) => {
  const { userId, deviceIds } = req.body;
  if (!userId || !deviceIds || !Array.isArray(deviceIds)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    // Генерируем уникальный идентификатор группы сравнения
    const comparisonGroup = Date.now().toString() + '-' + Math.floor(Math.random() * 1000000);

    // Добавляем новую группу сравнения
    for (const deviceId of deviceIds) {
      await connection.execute(
        'INSERT INTO user_comparisons (user_id, device_id, comparison_group, created_at) VALUES (?, ?, ?, NOW())',
        [userId, deviceId, comparisonGroup]
      );
    }

    // Оставляем только 3 последних группы сравнений, остальные удаляем
    const [groups] = await connection.execute(
      `SELECT comparison_group, MAX(created_at) as last_time
       FROM user_comparisons
       WHERE user_id = ?
       GROUP BY comparison_group
       ORDER BY last_time DESC`,
      [userId]
    );
    if (groups.length > 3) {
      const groupsToDelete = groups.slice(3).map(g => g.comparison_group);
      if (groupsToDelete.length > 0) {
        await connection.execute(
          `DELETE FROM user_comparisons WHERE user_id = ? AND comparison_group IN (${groupsToDelete.map(() => '?').join(',')})`,
          [userId, ...groupsToDelete]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user comparisons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение истории сравнений пользователя (возвращает последние 3 группы сравнений)
app.get('/api/user-comparisons', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    // Получаем последние 3 группы сравнений
    const [groups] = await connection.execute(
      `SELECT comparison_group, MAX(created_at) as last_time
       FROM user_comparisons
       WHERE user_id = ?
       GROUP BY comparison_group
       ORDER BY last_time DESC
       LIMIT 3`,
      [userId]
    );

    // Для каждой группы получаем устройства
    const result = [];
    for (const group of groups) {
      const [devices] = await connection.execute(
        `SELECT 
          d.id, 
          d.brand_id,
          d.model_id,
          d.name,
          d.price, 
          d.image_url, 
          d.processor, 
          d.battery, 
          d.screen, 
          d.os, 
          d.cameras, 
          d.ram, 
          d.storage, 
          d.screen_type, 
          d.refresh_rate, 
          d.resolution, 
          d.weight, 
          d.body_material, 
          d.water_resistance, 
          d.wireless_charging, 
          d.fast_charging, 
          d.main_camera_resolution, 
          d.main_camera_aperture, 
          d.front_camera_resolution, 
          d.front_camera_aperture, 
          d.5g_support, 
          d.fingerprint_scanner, 
          d.nfc, 
          d.microsd_slot, 
          d.colors, 
          d.release_date, 
          d.warranty, 
          d.battery_type, 
          d.stereo_speakers, 
          d.headphone_jack, 
          d.connectivity, 
          d.dimensions, 
          d.special_features, 
          d.screen_special_features, 
          d.sound_special_features, 
          d.wired_charging, 
          d.wireless_charging_power, 
          d.name_hash,
          d.ppi, 
          d.aspect_ratio, 
          d.brightness_contrast, 
          d.cpu_multicore_benchmark, 
          d.cpu_singlecore_benchmark, 
          d.gpu_benchmark, 
          d.gaming_fps_average, 
          d.gaming_fps_min 
         FROM user_comparisons uc
         JOIN smartphones d ON uc.device_id = d.id
         WHERE uc.user_id = ? AND uc.comparison_group = ?
         ORDER BY d.name`,
        [userId, group.comparison_group]
      );
      result.push({ devices, created_at: group.last_time });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching user comparisons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Смена пароля
app.post('/api/users/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.body.userId; // Предполагается, что userId передается в запросе

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Необходимо указать текущий и новый пароль' 
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Проверяем текущий пароль
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ? AND password = ?',
      [userId, currentPassword]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверный текущий пароль' 
      });
    }

    // Обновляем пароль
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, userId]
    );

    res.json({ 
      success: true, 
      message: 'Пароль успешно изменен' 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при смене пароля' 
    });
  }
});

// Загрузка аватара
app.post('/api/users/upload-avatar', upload.single('avatar'), async (req, res) => {
  const userId = req.body.userId; // Предполагается, что userId передается в запросе
  const file = req.file;

  if (!userId || !file) {
    return res.status(400).json({ 
      success: false, 
      message: 'Необходимо указать пользователя и файл' 
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Получаем текущий аватар
    const [rows] = await connection.execute(
      'SELECT avatar FROM users WHERE id = ?',
      [userId]
    );

    // Если есть старый аватар, удаляем его
    if (rows[0]?.avatar) {
      const oldAvatarPath = path.join(__dirname, rows[0].avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Обновляем путь к аватару в базе данных
    const avatarPath = `uploads/${file.filename}`;
    await connection.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, userId]
    );

    res.json({ 
      success: true, 
      message: 'Аватар успешно загружен',
      avatarUrl: avatarPath
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при загрузке аватара' 
    });
  }
});

// Обновление данных пользователя
app.post('/api/users/update', async (req, res) => {
  console.log('Получен запрос на обновление пользователя:', req.body);
  
  const { id, name, email } = req.body;
  
  // Преобразуем undefined в null
  const safeId = id ?? null;
  const safeName = name ?? null;
  const safeEmail = email ?? null;

  if (!safeId || !safeName || !safeEmail) {
    console.log('Отсутствуют обязательные поля:', { id, name, email });
    return res.status(400).json({ 
      success: false, 
      message: 'Необходимо указать ID пользователя, имя и email' 
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Подключение к базе данных установлено');
    
    // Проверяем, не занят ли email другим пользователем
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [safeEmail, safeId]
    );

    if (existingUsers.length > 0) {
      console.log('Email уже используется:', safeEmail);
      return res.status(400).json({ 
        success: false, 
        message: 'Этот email уже используется другим пользователем' 
      });
    }

    // Обновляем данные пользователя
    const [result] = await connection.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [safeName, safeEmail, safeId]
    );

    console.log('Результат обновления:', result);

    if (result.affectedRows === 0) {
      console.log('Пользователь не найден:', safeId);
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }

    // Получаем обновленные данные пользователя
    const [updatedUser] = await connection.execute(
      'SELECT id, name, email, avatar, role FROM users WHERE id = ?',
      [safeId]
    );

    console.log('Обновленные данные пользователя:', updatedUser[0]);

    res.json({ 
      success: true, 
      message: 'Данные успешно обновлены',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении данных: ' + error.message 
    });
  }
});

// Получить избранное пользователя
app.get('/api/user-favorites', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT d.* FROM user_favorites uf JOIN smartphones d ON uf.device_id = d.id WHERE uf.user_id = ? ORDER BY uf.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавить/удалить смартфон в избранное
app.post('/api/user-favorites', async (req, res) => {
  const { userId, deviceId, action } = req.body;
  if (!userId || !deviceId || !['add', 'remove'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    if (action === 'add') {
      await connection.execute(
        'INSERT IGNORE INTO user_favorites (user_id, device_id) VALUES (?, ?)',
        [userId, deviceId]
      );
    } else {
      await connection.execute(
        'DELETE FROM user_favorites WHERE user_id = ? AND device_id = ?',
        [userId, deviceId]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавить смартфон
app.post("/devices", async (req, res) => {
  const { name, price, brand_id, model_id, processor, image_url, release_date } = req.body;
  if (!name || !price || !brand_id) {
    return res.status(400).json({ error: "Не заполнены обязательные поля" });
  }
  try {
    const name_hash = crypto.createHash('md5').update(name).digest('hex');
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO smartphones (name, name_hash, price, brand_id, model_id, processor, image_url, release_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, name_hash, price, brand_id, model_id, processor, image_url, release_date]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка добавления смартфона:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Редактировать смартфон
app.put("/devices/:id", async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  delete data.id;
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) data[key] = null;
  });
  if (data.name) {
    data.name_hash = crypto.createHash('md5').update(data.name).digest('hex');
  }
  const fields = Object.keys(data);
  const values = Object.values(data);
  if (fields.length === 0) {
    return res.status(400).json({ error: "Нет данных для обновления" });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const setClause = fields.map(f => `${f}=?`).join(', ');
    await connection.execute(
      `UPDATE smartphones SET ${setClause} WHERE id=?`,
      [...values, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка редактирования смартфона:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Загрузка файла
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Нет файла' });
  }
  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url });
});

// Добавить бренд
app.post('/brands', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Не указано имя бренда' });
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('INSERT INTO brands (name) VALUES (?)', [name]);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Ошибка добавления бренда:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить модель
app.post('/models', async (req, res) => {
  const { name, brand_id } = req.body;
  if (!name || !brand_id) return res.status(400).json({ error: 'Не указаны имя модели или бренд' });
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('INSERT INTO models (name, brand_id) VALUES (?, ?)', [name, brand_id]);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Ошибка добавления модели:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});