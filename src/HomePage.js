import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Button,
  TextField,
  Modal,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  InputAdornment,
  FormControl,
  Select,
  InputLabel,
  MenuItem as MuiMenuItem,
  Autocomplete,
  Slider,
  styled,
  keyframes,
  Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Compare as CompareIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Person as PersonIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  Search as SearchIcon,
  ExitToApp as ExitToAppIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminPanelIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from './components/LanguageSwitcher'; // Компонент смены языка
import axios from './axios.config';
import { Global } from '@emotion/react';
import { keyframes as muiSystemKeyframes } from '@mui/system';
import { supabase } from './supabaseClient'; // Import supabase client

// Анимация для плавного появления
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Анимация shake
const shake = muiSystemKeyframes`
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-8px); }
  40%, 60% { transform: translateX(8px); }
`;

// Стилизация блока поиска и фильтрации
const SearchAndFilterBox = styled(Box)(({ theme }) => ({
  marginTop: '64px',
  padding: theme.spacing(2),
  borderRadius: 4,
  boxShadow: 4, // Возвращаем тень
  backgroundColor: (theme) => // Возвращаем фон
    theme.palette.mode === 'dark'
      ? 'rgba(40,40,40,0.85)'
      : 'rgba(255,255,255,0.85)',
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: 'center',
  gap: { xs: 2, md: 3 },
  animation: 'fadeIn 0.7s',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
}));

// Стилизация контейнера с карточками смартфонов
const SmartphoneCardsContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

function HomePage({ comparisonList, setComparisonList, isDarkMode, toggleTheme, user, setUser }) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [smartphones, setSmartphones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredSmartphones, setFilteredSmartphones] = useState([]);
  const [sortOption, setSortOption] = useState("name");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' или 'register'
  const [registerError, setRegisterError] = useState(null);
  const adminEmail = 'admin@example.com'; // Укажите email админа из вашей БД
  const [favorites, setFavorites] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalShake, setAuthModalShake] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    brand_id: '',
    processor: '',
    image_url: '',
    release_date: '',
    model_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef();
  const [models, setModels] = useState([]);
  // Новые состояния для модалок бренда и модели
  const [addBrandModalOpen, setAddBrandModalOpen] = useState(false);
  const [addModelModalOpen, setAddModelModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelBrandId, setNewModelBrandId] = useState("");
  const [brandError, setBrandError] = useState("");
  const [modelError, setModelError] = useState("");
  const [brandSuccess, setBrandSuccess] = useState("");
  const [modelSuccess, setModelSuccess] = useState("");

  const navigate = useNavigate();

  // Состояния для полей ввода
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Форматирование даты под язык
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Если формат YYYY-MM
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [year, month] = dateStr.split('-');
      return `${month}.${year}`;
    }
    // Если формат YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month] = dateStr.split('-');
      return `${month}.${year}`;
    }
    return dateStr;
  };

  // Функция для форматирования цены в рублях
  const formatPriceRUB = (price) => {
    if (!price) return t("common.unknown");
    // Если цена уже в рублях или содержит INR, просто убираем лишнее и ставим ₽
    if (typeof price === 'string' && price.includes('INR')) {
      const num = price.replace(/[^\d]/g, '');
      return num ? `${Number(num).toLocaleString('ru-RU')} ₽` : t("common.unknown");
    }
    // Если цена в долларах
    const priceNum = Number(price);
    if (!isNaN(priceNum) && priceNum > 0) {
      const rub = Math.round(priceNum * 90);
      return `${rub.toLocaleString('ru-RU')} ₽`;
    }
    return t("common.unknown");
  };

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandsResponse = await fetch("http://localhost:5000/brands");
        if (!brandsResponse.ok) throw new Error("Ошибка загрузки брендов");
        const brandsData = await brandsResponse.json();
        setBrands(brandsData);

        const devicesResponse = await fetch("http://localhost:5000/devices");
        if (!devicesResponse.ok) throw new Error("Ошибка загрузки устройств");
        const devicesData = await devicesResponse.json();
        setSmartphones(devicesData);
        setFilteredSmartphones(devicesData);
      } catch (error) {
        console.error("Ошибка:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // В начале компонента, после объявления состояний
  useEffect(() => {
    // Синхронизация состояния сравнения с localStorage при загрузке страницы
    const saved = localStorage.getItem('comparisonList');
    setComparisonList(saved ? JSON.parse(saved) : []);
  }, []);

  // Загрузка избранного пользователя
  useEffect(() => {
    if (user && user.id) {
      axios.get(`/api/user-favorites?userId=${user.id}`)
        .then(res => setFavorites(res.data.map(d => d.id)))
        .catch(() => setFavorites([]));
    } else {
      setFavorites([]);
    }
  }, [user]);

  // Обработка поиска и фильтрации
  const handleSearch = debounce((searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase().normalize("NFC");
    const regex = new RegExp(normalizedSearchTerm, "i");

    const filtered = smartphones
      .filter((phone) => {
        // Исправленная фильтрация по бренду с приведением к строке:
        const matchesBrand = !selectedBrand || String(phone.brand_id) === String(selectedBrand.id);
        // Исправляем фильтрацию по цене: правильно парсим число из строки
        let price = Number(phone.price);
        if (typeof phone.price === 'string') {
          const parsedPrice = parseFloat(phone.price.replace(/[^0-9.]/g, ''));
          price = isNaN(parsedPrice) ? 0 : parsedPrice;
        }

        const min = minPrice === '' ? 0 : Number(minPrice);
        // Увеличиваем максимальное значение по умолчанию для фильтрации цен
        const max = maxPrice === '' ? 1000000 : Number(maxPrice);

        // Конвертируем введенные рубли в доллары для сравнения с ценой телефона
        const minDollarsForComparison = min / 90;
        const maxDollarsForComparison = max / 90;

        const matchesPrice = price >= minDollarsForComparison && price <= maxDollarsForComparison;
        const phoneName = phone.name ? phone.name.toLowerCase().normalize("NFC") : "";
        const matchesSearch = regex.test(phoneName);
        const matchesNew = !showNewOnly || phone.isNew;
        const matchesStock = !showInStockOnly || phone.inStock;
        return matchesBrand && matchesPrice && matchesSearch && matchesNew && matchesStock;
      })
      .sort((a, b) => {
        if (sortOption === "name") {
          return a.name.localeCompare(b.name);
        } else if (sortOption === "price_asc") {
          return a.price - b.price;
        } else if (sortOption === "price_desc") {
          return b.price - a.price;
        } else if (sortOption === "date") {
          return new Date(b.date) - new Date(a.date);
        }
        return 0;
      });

    setFilteredSmartphones(filtered);
  }, 300);

  useEffect(() => {
    handleSearch(search);
  }, [selectedBrand, search, sortOption, minPrice, maxPrice, smartphones]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    handleSearch(value);
  };

  const handleBrandChange = async (event, newValue) => {
    const newFormData = { ...formData, brand_id: newValue ? newValue.id : '', model_id: '' };
    setFormData(newFormData);
    setFormErrors(validateForm(newFormData));
    if (newValue && newValue.id) {
      const res = await fetch(`http://localhost:5000/models?brand_id=${newValue.id}`);
      const data = await res.json();
      setModels(data);
    } else {
      setModels([]);
    }
  };

  const handleModelChange = (event, newValue) => {
    const newFormData = { ...formData, model_id: newValue ? newValue.id : '' };
    setFormData(newFormData);
    setFormErrors(validateForm(newFormData));
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const handlePriceRangeChange = (event, newRange) => {
    setPriceRange(newRange);
  };

  const handleCompare = async (phone) => {
    console.log("Attempting to add phone:", phone);
    const isAlreadyAdded = comparisonList.some((p) => p.id === phone.id);
    if (isAlreadyAdded) {
      alert(t("common.alreadyAdded"));
      console.log("Phone already added.");
      return;
    }
    if (comparisonList.length >= 4) {
      alert("Можно сравнить до 4 устройств.");
      console.log("Comparison list is full.");
      return;
    }
    
    const newComparisonList = [...comparisonList, phone];
    console.log("New comparison list before set:", newComparisonList);
    setComparisonList(newComparisonList);
    localStorage.setItem('comparisonList', JSON.stringify(newComparisonList));
    console.log("Comparison list saved to localStorage:", newComparisonList);

    // Сохраняем сравнения в базу данных, если пользователь авторизован
    if (user) {
      try {
        await fetch('http://localhost:5000/api/user-comparisons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            deviceIds: newComparisonList.map(device => device.id)
          })
        });
      } catch (error) {
        console.error('Error saving user comparisons:', error);
      }
    }
  };

  const removeFromComparison = async (phoneId) => {
    console.log("Attempting to remove phone with ID:", phoneId);
    const newComparisonList = comparisonList.filter((p) => p.id !== phoneId);
    console.log("New comparison list after removal:", newComparisonList);
    setComparisonList(newComparisonList);
    localStorage.setItem('comparisonList', JSON.stringify(newComparisonList));
    console.log("Comparison list after removal saved to localStorage:", newComparisonList);

    // Сохраняем изменения в базе данных, если пользователь авторизован
    if (user) {
      try {
        await fetch('http://localhost:5000/api/user-comparisons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            deviceIds: newComparisonList.map(device => device.id)
          })
        });
      } catch (error) {
        console.error('Error saving user comparisons:', error);
      }
    }
  };

  const clearComparisonList = async () => {
    console.log("Attempting to clear comparison list.");
    setComparisonList([]);
    localStorage.removeItem('comparisonList');
    console.log("Comparison list cleared from localStorage.");

    // Очищаем сравнения в базе данных, если пользователь авторизован
    if (user) {
      try {
        await fetch('http://localhost:5000/api/user-comparisons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            deviceIds: []
          })
        });
      } catch (error) {
        console.error('Error clearing user comparisons:', error);
      }
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
    setIsDrawerOpen(open);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollButton(true);
      else setShowScrollButton(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // setUser is now handled by the auth listener in App.js
      handleCloseLogin();
      
      // Перенаправляем в зависимости от роли
      if (data.user.user_metadata?.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/profile");
      }
      
    } catch (error) {
      setLoginError(error.message || t("login.server_error"));
    }
  };

  const handleCloseLogin = () => {
    setLoginModalOpen(false);
    setLoginError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setRegisterError(t("register.passwords_do_not_match"));
      return;
    }
    try {
      setRegisterError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }
      
      handleCloseRegister();
      
      // Показываем сообщение в зависимости от результата
      if (data.user && !data.session) {
        alert('Регистрация почти завершена! Мы отправили ссылку для подтверждения на ваш email.');
      } else {
        alert('Пользователь успешно зарегистрирован!');
      }

    } catch (error) {
      setRegisterError(error.message || t("register.server_error"));
    }
  };

  const handleCloseRegister = () => {
    setLoginModalOpen(false);
    setRegisterError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // Добавить/удалить из избранного
  const toggleFavorite = async (deviceId) => {
    if (!user || !user.id) return;
    const isFav = favorites.includes(deviceId);
    try {
      await axios.post('/api/user-favorites', {
        userId: user.id,
        deviceId,
        action: isFav ? 'remove' : 'add'
      });
      setFavorites((prev) => isFav ? prev.filter(id => id !== deviceId) : [...prev, deviceId]);
    } catch {}
  };

  // Функция для поиска названия бренда по brand_id
  const getBrandName = (brand_id) => {
    const brand = brands.find(b => b.id === brand_id);
    return brand ? brand.name : t("common.unknown");
  };

  // Открыть модалку добавления
  const handleOpenAddModal = () => {
    setFormData({ name: '', price: '', brand_id: '', processor: '', image_url: '', release_date: '', model_id: '' });
    setAddModalOpen(true);
  };
  // Открыть модалку редактирования
  const handleOpenEditModal = async (phone) => {
    setEditPhone(phone);
    setFormData({
      name: phone.name || '',
      price: phone.price || '',
      brand_id: phone.brand_id || '',
      processor: phone.processor || '',
      image_url: phone.image_url || '',
      release_date: phone.release_date || '',
      model_id: phone.model_id || '',
    });
    if (phone.brand_id) {
      const res = await fetch(`http://localhost:5000/models?brand_id=${phone.brand_id}`);
      const data = await res.json();
      setModels(data);
    } else {
      setModels([]);
    }
    setEditModalOpen(true);
  };
  // Закрыть модалки
  const handleCloseAddModal = () => setAddModalOpen(false);
  const handleCloseEditModal = () => setEditModalOpen(false);

  // Валидация формы
  function validateForm(formData) {
    const errors = {};
    if (!formData.name) errors.name = 'Обязательное поле';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) errors.price = 'Введите корректную цену';
    if (!formData.brand_id) errors.brand_id = 'Обязательное поле';
    if (formData.release_date && !/^\d{4}-\d{2}$/.test(formData.release_date)) errors.release_date = 'Некорректная дата (только ГГГГ-ММ)';
    return errors;
  }

  // Обновить handleAddPhone и handleEditPhone:
  const handleAddPhone = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await fetch('http://localhost:5000/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setAddModalOpen(false);
        // обновить список смартфонов
        const devicesResponse = await fetch("http://localhost:5000/devices");
        const devicesData = await devicesResponse.json();
        setSmartphones(devicesData);
        setFilteredSmartphones(devicesData);
      }
    } catch (error) {
      alert('Ошибка при добавлении смартфона');
    }
  };
  const handleEditPhone = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await fetch(`http://localhost:5000/devices/${editPhone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditModalOpen(false);
        // обновить список смартфонов
        const devicesResponse = await fetch("http://localhost:5000/devices");
        const devicesData = await devicesResponse.json();
        setSmartphones(devicesData);
        setFilteredSmartphones(devicesData);
      }
    } catch (error) {
      alert('Ошибка при редактировании смартфона');
    }
  };

  // Загрузка файла
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('http://localhost:5000/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) setFormData({ ...formData, image_url: data.url });
  };

  // Локализация ошибки Email logins are disabled
  useEffect(() => {
    if (loginError && loginError.includes('Email logins are disabled')) {
      setLoginError(i18n.language === 'ru' ? 'Вход по email отключён. Обратитесь к администратору.' : 'Email logins are disabled. Contact administrator.');
    }
  }, [loginError, i18n.language]);

  return (
    <>
      <Global styles={`
        input[type='password']::-ms-reveal,
        input[type='password']::-ms-clear,
        input[type='password']::-webkit-credentials-auto-fill-button,
        input[type='password']::-webkit-input-decoration,
        input[type='password']::-webkit-input-clear-button,
        input[type='password']::-webkit-input-password-toggle-button {
          display: none !important;
        }
      `} />
      <div>
        {/* AppBar */}
        <AppBar position="fixed" sx={{ backgroundColor: "primary.main", color: "white" }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>

            <Box
              component="img"
              src="/logo.svg"
              alt={t("common.logo")}
              sx={{ height: "50px", cursor: "pointer" }}
              onClick={() => navigate("/")}
            />

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton color="inherit" onClick={toggleTheme}>
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <LanguageSwitcher />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
          <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
            <Box>
              <List>
                {user ? (
                  <ListItem button onClick={() => navigate("/profile")}> 
                    <ListItemIcon>
                      <Avatar
                        src={user.avatar && (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000/${user.avatar}`)}
                        alt={user.name || 'A'}
                        sx={{ width: 28, height: 28 }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={t("common.profile")} />
                  </ListItem>
                ) : (
                  <ListItem button onClick={() => setLoginModalOpen(true)}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary={t("common.login")} />
                  </ListItem>
                )}
                <Divider />
                <ListItem button onClick={() => navigate("/compare")}> 
                  <ListItemIcon><CompareIcon /></ListItemIcon>
                  <ListItemText primary={t("common.compare")} />
                </ListItem>
                {user && user.role === 'admin' && (
                  <ListItem button onClick={() => navigate("/admin")}>
                    <ListItemIcon><AdminPanelIcon /></ListItemIcon>
                    <ListItemText primary={t("common.adminPanel")} />
                  </ListItem>
                )}
              </List>
            </Box>
            {user && (
              <Box>
                <Divider />
                <List>
                  <ListItem button onClick={() => { 
                    setUser(null); 
                    setComparisonList([]); // Очищаем список сравнения
                    navigate("/"); 
                  }}>
                    <ListItemIcon><ExitToAppIcon /></ListItemIcon>
                    <ListItemText primary={t("common.logout")} />
                  </ListItem>
                </List>
              </Box>
            )}
          </Box>
        </Drawer>

        {/* Login Modal */}
        <Modal open={isLoginModalOpen} onClose={handleCloseLogin}>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1300,
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}
            onClick={handleCloseLogin}
          >
            <Container
              maxWidth="sm"
              sx={{ py: 4, px: 2, bgcolor: "background.paper", borderRadius: 2, boxShadow: 6 }}
              onClick={e => e.stopPropagation()}
            >
              <Typography variant="h6" id="login-modal-title" sx={{ mb: 2 }}>
                {authMode === 'login' ? t("common.login") : t("common.register")}
              </Typography>
              {authMode === 'login' && loginError && <Alert severity="error">{loginError}</Alert>}
              {authMode === 'register' && registerError && <Alert severity="error">{registerError}</Alert>}
              {authMode === 'login' ? (
                <form onSubmit={handleLogin}>
                  <TextField label={t("common.email")}
                    name="email"
                    type="email"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required />
                  <TextField label={t("common.password")}
                    name="password"
                    type={showLoginPassword ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowLoginPassword((show) => !show)}
                            edge="end"
                            tabIndex={-1}
                            sx={{ color: isDarkMode ? '#fff' : undefined }}
                          >
                            {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>{t("common.login")}</Button>
                  <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    {t("login.no_account")} <Button onClick={() => setAuthMode('register')}>{t("login.register")}</Button>
                  </Typography>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <TextField
                    label={t('common.email')}
                    name="email"
                    type="email"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <TextField
                    label={t('common.password')}
                    name="password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowRegisterPassword((show) => !show)}
                            edge="end"
                            tabIndex={-1}
                            sx={{ color: isDarkMode ? '#fff' : undefined }}
                          >
                            {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label={t('common.confirmPassword')}
                    name="confirm"
                    type={showRegisterConfirm ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowRegisterConfirm((show) => !show)}
                            edge="end"
                            tabIndex={-1}
                            sx={{ color: isDarkMode ? '#fff' : undefined }}
                          >
                            {showRegisterConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>{t('common.register')}</Button>
                  <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    {t('register.have_account')} <Button onClick={() => setAuthMode('login')}>{t('login.login_button')}</Button>
                  </Typography>
                </form>
              )}
            </Container>
          </Box>
        </Modal>

        {/* Модалка для гостей */}
        <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)}>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1400,
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}
            onClick={() => setShowAuthModal(false)}
          >
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 3,
                boxShadow: 8,
                p: 4,
                minWidth: 320,
                textAlign: 'center',
                animation: authModalShake ? `${shake} 0.6s` : 'none',
                cursor: 'pointer',
              }}
              onClick={e => e.stopPropagation()}
            >
              <FavoriteBorderIcon sx={{ fontSize: 48, color: 'error.main', mb: 2, animation: authModalShake ? `${shake} 0.6s` : 'none' }} />
              <Typography variant="h6" sx={{ mb: 2 }}>{t('common.needAuthFavorite')}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={() => { setShowAuthModal(false); setLoginModalOpen(true); }}>{t('common.login')}</Button>
                <Button variant="outlined" color="secondary" onClick={() => { setShowAuthModal(false); setAuthMode('register'); setLoginModalOpen(true); }}>{t('common.register')}</Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Модалка добавления смартфона */}
        <Modal open={addModalOpen} onClose={handleCloseAddModal}>
          <Box sx={{
            p: 4,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 6,
            maxWidth: 400,
            width: '90vw',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <Typography variant="h6" mb={2}>{t('compare.addPhone')}</Typography>
            <form onSubmit={handleAddPhone}>
              <TextField label="Название смартфона *" value={formData.name} onChange={e => {
                const newFormData = { ...formData, name: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" required error={!!formErrors.name} helperText={formErrors.name} />
              <TextField label={t('home.price')} value={formData.price} onChange={e => {
                const newFormData = { ...formData, price: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" required error={!!formErrors.price} helperText={formErrors.price} />
              <Autocomplete
                options={brands}
                getOptionLabel={option => option.name || ''}
                value={brands.find(b => b.id === formData.brand_id) || null}
                onChange={async (event, newValue) => {
                  const newFormData = { ...formData, brand_id: newValue ? newValue.id : '', model_id: '' };
                  setFormData(newFormData);
                  setFormErrors(validateForm(newFormData));
                  if (newValue && newValue.id) {
                    const res = await fetch(`http://localhost:5000/models?brand_id=${newValue.id}`);
                    const data = await res.json();
                    setModels(data);
                  } else {
                    setModels([]);
                  }
                }}
                renderInput={params => (
                  <TextField {...params} label="Бренд *" margin="normal" required error={!!formErrors.brand_id} helperText={formErrors.brand_id} />
                )}
                fullWidth
              />
              <Autocomplete
                options={models}
                getOptionLabel={option => option.name || ''}
                value={models.find(m => m.id === formData.model_id) || null}
                onChange={handleModelChange}
                renderInput={params => (
                  <TextField {...params} label="Модель *" margin="normal" required />
                )}
                fullWidth
              />
              <TextField label={t('home.processor')} value={formData.processor} onChange={e => {
                const newFormData = { ...formData, processor: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" />
              <TextField label="Image URL" value={formData.image_url} onChange={e => {
                const newFormData = { ...formData, image_url: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" />
              <TextField
                label={t('home.releaseDate')}
                type="text"
                placeholder="2024-06"
                value={formData.release_date}
                onChange={e => {
                  const newFormData = { ...formData, release_date: e.target.value };
                  setFormData(newFormData);
                  setFormErrors(validateForm(newFormData));
                }}
                fullWidth
                margin="normal"
                error={!!formErrors.release_date}
                helperText={formErrors.release_date}
              />
              <Button component="label" variant="outlined" fullWidth sx={{ mt: 1 }}>
                Загрузить фото
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
              </Button>
              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Button onClick={handleCloseAddModal}>{t('common.no')}</Button>
                <Button type="submit" variant="contained" disabled={Object.keys(formErrors).length > 0}>{t('common.add')}</Button>
              </Box>
            </form>
          </Box>
        </Modal>

        {/* Модалка редактирования смартфона */}
        <Modal open={editModalOpen} onClose={handleCloseEditModal}>
          <Box sx={{
            p: 4,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 6,
            maxWidth: 400,
            width: '90vw',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <Typography variant="h6" mb={2}>{t('common.edit')}</Typography>
            <form onSubmit={handleEditPhone}>
              <TextField label="Название смартфона *" value={formData.name} onChange={e => {
                const newFormData = { ...formData, name: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" required error={!!formErrors.name} helperText={formErrors.name} />
              <TextField label={t('home.price')} value={formData.price} onChange={e => {
                const newFormData = { ...formData, price: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" required error={!!formErrors.price} helperText={formErrors.price} />
              <Autocomplete
                options={brands}
                getOptionLabel={option => option.name || ''}
                value={brands.find(b => b.id === formData.brand_id) || null}
                onChange={handleBrandChange}
                renderInput={params => (
                  <TextField {...params} label="Бренд *" margin="normal" required error={!!formErrors.brand_id} helperText={formErrors.brand_id} />
                )}
                fullWidth
              />
              <Autocomplete
                options={models}
                getOptionLabel={option => option.name || ''}
                value={models.find(m => m.id === formData.model_id) || null}
                onChange={handleModelChange}
                renderInput={params => (
                  <TextField {...params} label="Модель *" margin="normal" required />
                )}
                fullWidth
              />
              <TextField label={t('home.processor')} value={formData.processor} onChange={e => {
                const newFormData = { ...formData, processor: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" />
              <TextField label="Image URL" value={formData.image_url} onChange={e => {
                const newFormData = { ...formData, image_url: e.target.value };
                setFormData(newFormData);
                setFormErrors(validateForm(newFormData));
              }} fullWidth margin="normal" />
              <TextField
                label={t('home.releaseDate')}
                type="text"
                placeholder="2024-06"
                value={formData.release_date}
                onChange={e => {
                  const newFormData = { ...formData, release_date: e.target.value };
                  setFormData(newFormData);
                  setFormErrors(validateForm(newFormData));
                }}
                fullWidth
                margin="normal"
                error={!!formErrors.release_date}
                helperText={formErrors.release_date}
              />
              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Button onClick={handleCloseEditModal}>{t('common.no')}</Button>
                <Button type="submit" variant="contained" disabled={Object.keys(formErrors).length > 0}>{t('common.save') || 'Сохранить'}</Button>
              </Box>
            </form>
          </Box>
        </Modal>

        {/* Модалка добавления бренда */}
        <Modal open={addBrandModalOpen} onClose={() => { setAddBrandModalOpen(false); setBrandError(""); setBrandSuccess(""); }}>
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 6, maxWidth: 400, width: '90vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: '90vh', overflowY: 'auto' }}>
            <Typography variant="h6" mb={2}>Добавить бренд</Typography>
            <TextField label="Название бренда" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} fullWidth margin="normal" />
            {brandError && <Alert severity="error" sx={{ mt: 1 }}>{brandError}</Alert>}
            {brandSuccess && <Alert severity="success" sx={{ mt: 1 }}>{brandSuccess}</Alert>}
            <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={() => { setAddBrandModalOpen(false); setBrandError(""); setBrandSuccess(""); }}>Отмена</Button>
              <Button variant="contained" onClick={async () => {
                setBrandError(""); setBrandSuccess("");
                if (!newBrandName.trim()) { setBrandError('Введите название бренда'); return; }
                // Проверка на дубль
                if (brands.some(b => b.name.trim().toLowerCase() === newBrandName.trim().toLowerCase())) {
                  setBrandError('Такой бренд уже существует');
                  return;
                }
                try {
                  const res = await fetch('http://localhost:5000/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newBrandName }) });
                  if (res.ok) {
                    setBrandSuccess('Бренд успешно добавлен!');
                    setNewBrandName("");
                    // обновить список брендов
                    const brandsRes = await fetch("http://localhost:5000/brands");
                    setBrands(await brandsRes.json());
                  } else {
                    const data = await res.json();
                    setBrandError(data.error || 'Ошибка при добавлении бренда');
                  }
                } catch (e) { setBrandError('Ошибка сети'); }
              }}>Сохранить</Button>
            </Box>
          </Box>
        </Modal>

        {/* Модалка добавления модели */}
        <Modal open={addModelModalOpen} onClose={() => { setAddModelModalOpen(false); setModelError(""); setModelSuccess(""); }}>
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 6, maxWidth: 400, width: '90vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: '90vh', overflowY: 'auto' }}>
            <Typography variant="h6" mb={2}>Добавить модель</Typography>
            <Autocomplete
              options={brands}
              getOptionLabel={option => option.name || ''}
              value={brands.find(b => b.id === newModelBrandId) || null}
              onChange={async (e, newValue) => {
                setNewModelBrandId(newValue ? newValue.id : "");
                setNewModelName("");
                setModelError("");
                setModelSuccess("");
                if (newValue && newValue.id) {
                  const res = await fetch(`http://localhost:5000/models?brand_id=${newValue.id}`);
                  setModels(await res.json());
                } else {
                  setModels([]);
                }
              }}
              renderInput={params => (
                <TextField {...params} label="Бренд" margin="normal" />
              )}
              fullWidth
            />
            <TextField label="Название модели" value={newModelName} onChange={e => setNewModelName(e.target.value)} fullWidth margin="normal" />
            {modelError && <Alert severity="error" sx={{ mt: 1 }}>{modelError}</Alert>}
            {modelSuccess && <Alert severity="success" sx={{ mt: 1 }}>{modelSuccess}</Alert>}
            <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={() => { setAddModelModalOpen(false); setModelError(""); setModelSuccess(""); }}>Отмена</Button>
              <Button variant="contained" onClick={async () => {
                setModelError(""); setModelSuccess("");
                if (!newModelName.trim() || !newModelBrandId) { setModelError('Заполните все поля'); return; }
                // Проверка на дубль среди моделей выбранного бренда
                if (models.some(m => m.name.trim().toLowerCase() === newModelName.trim().toLowerCase())) {
                  setModelError('Такая модель уже существует');
                  return;
                }
                try {
                  const res = await fetch('http://localhost:5000/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newModelName, brand_id: newModelBrandId }) });
                  if (res.ok) {
                    setModelSuccess('Модель успешно добавлена!');
                    setNewModelName("");
                    // обновить список моделей
                    const modelsRes = await fetch(`http://localhost:5000/models?brand_id=${newModelBrandId}`);
                    setModels(await modelsRes.json());
                  } else {
                    const data = await res.json();
                    setModelError(data.error || 'Ошибка при добавлении модели');
                  }
                } catch (e) { setModelError('Ошибка сети'); }
              }}>Сохранить</Button>
            </Box>
          </Box>
        </Modal>

        {/* Контент страницы */}
        <Container sx={{ py: 4, pt: 8 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Современный фильтр 2024 с новыми кнопками и без слайдера цены */}
          <Box
            sx={{
              mt: 10,
              mb: 5,
              px: { xs: 1, sm: 3 },
              py: 3,
              borderRadius: 4,
              boxShadow: 4,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(40,40,40,0.85)'
                  : 'rgba(255,255,255,0.85)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: { xs: 2, md: 3 },
              animation: 'fadeIn 0.7s',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(-20px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* Поиск */}
            <TextField
              label={t("home.search")}
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              fullWidth
              sx={{
                maxWidth: 220,
                borderRadius: '8px',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearch("")}><CloseIcon /></IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Бренд */}
            <Autocomplete
              options={brands}
              getOptionLabel={option => option.name || ''}
              value={selectedBrand}
              onChange={(event, newValue) => {
                setSelectedBrand(newValue);
                handleSearch(search); // чтобы сразу фильтровать
              }}
              renderInput={params => (
                <TextField {...params} label="Бренд" margin="normal" />
              )}
              sx={{ minWidth: 180, flex: 1 }}
            />

            {/* Диапазон цен */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 240, flexGrow: 1 }}>
              <TextField
                label={t('home.minPrice')}
                variant="outlined"
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value.replace(/[^\d]/g, ''))}
                fullWidth
                sx={{
                  borderRadius: '8px',
                  '& input[type=number]': {
                    WebkitAppearance: 'none', // Для Chrome, Safari, Opera
                    appearance: 'none', // Стандартное свойство
                    margin: 0, // Убираем возможный отступ
                    MozAppearance: 'none', // Добавляем для Firefox
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'transparent',
                  },
                }}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <Typography sx={{ mx: 0.5 }}>-</Typography>
              <TextField
                label={t('home.maxPrice')}
                variant="outlined"
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value.replace(/[^\d]/g, ''))}
                fullWidth
                sx={{
                  borderRadius: '8px',
                  '& input[type=number]': {
                    WebkitAppearance: 'none', // Для Chrome, Safari, Opera
                    appearance: 'none', // Стандартное свойство
                    margin: 0, // Убираем возможный отступ
                    MozAppearance: 'none', // Добавляем для Firefox
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'transparent',
                  },
                }}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>

            {/* Сортировка */}
            <FormControl variant="outlined" sx={{ minWidth: 150, maxWidth: 200, width: '100%', borderRadius: '8px' }}>
              <InputLabel>{t("home.sort")}</InputLabel>
              <Select 
                value={sortOption} 
                onChange={handleSortChange} 
                label={t("home.sort")}
                sx={{
                  backgroundColor: 'transparent',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: '8px',
                  },
                }}
              >
                <MuiMenuItem value="name">{t("home.sortByName")}</MuiMenuItem>
                <MuiMenuItem value="price_asc">{t("home.sortByPriceAsc")}</MuiMenuItem>
                <MuiMenuItem value="price_desc">{t("home.sortByPriceDesc")}</MuiMenuItem>
                <MuiMenuItem value="date">{t("home.sortByDate")}</MuiMenuItem>
              </Select>
            </FormControl>

            {/* Кнопка сброса */}
            <Button
              variant="outlined"
              color="secondary"
              sx={{ height: 48, minWidth: 110, fontWeight: 500, ml: { md: 2 } }}
              onClick={() => {
                setSearch("");
                setSelectedBrand(null);
                setMinPrice('');
                setMaxPrice('');
                setSortOption("name");
              }}
            >
              {t('home.reset')}
            </Button>
          </Box>

          {/* Кнопки для админа */}
          {user && user.role === 'admin' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 10, mb: 2, gap: 2 }}>
              <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ height: 48, minWidth: 170, fontWeight: 500 }} onClick={handleOpenAddModal}>
                {t('compare.addPhone')}
              </Button>
              <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ height: 48, minWidth: 170, fontWeight: 500 }} onClick={() => setAddBrandModalOpen(true)}>
                Добавить бренд
              </Button>
              <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ height: 48, minWidth: 170, fontWeight: 500 }} onClick={() => setAddModelModalOpen(true)}>
                Добавить модель
              </Button>
            </Box>
          )}

          {/* Карточки смартфонов */}
          <SmartphoneCardsContainer>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredSmartphones.slice(0, visibleCount).map((phone) => (
                  <Grid item xs={12} sm={6} md={4} key={phone.id}>
                    <Card
                      sx={{
                        position: 'relative',
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        borderRadius: "12px",
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.02)" },
                      }}
                    >
                      {/* Кнопка редактировать для админа */}
                      {user && user.role === 'admin' && (
                        <IconButton
                          sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: 'rgba(255,255,255,0.8)' }}
                          onClick={() => handleOpenEditModal(phone)}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      <CardMedia
                        component="img"
                        height="180"
                        image={phone.image_url || "/default-image.jpg"}
                        alt={phone.name || "Неизвестное устройство"}
                        sx={{
                          objectFit: "contain",
                          borderRadius: "12px 12px 0 0",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1, p: 2, textAlign: "center" }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                          {phone.name || "Неизвестное устройство"}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                          {t("home.brand")}: {getBrandName(phone.brand_id)}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                          {t("home.price")}: {formatPriceRUB(phone.price)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {t("home.processor")}: {phone.processor}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                          {t("home.releaseDate")}: {formatDate(phone.release_date)}
                        </Typography>
                      </CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleCompare(phone)}
                          disabled={comparisonList.some((p) => p.id === phone.id)}
                          sx={{ flex: 1, mr: 1 }}
                        >
                          {comparisonList.some((p) => p.id === phone.id)
                            ? t("common.alreadyAdded")
                            : t("common.addComparison")}
                        </Button>
                        {comparisonList.some((p) => p.id === phone.id) && (
                          <IconButton
                            onClick={() => removeFromComparison(phone.id)}
                            sx={{ backgroundColor: "error.main", color: "white", "&:hover": { backgroundColor: "error.dark" } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                        <IconButton
                          onClick={() => {
                            if (!user) {
                              setShowAuthModal(true);
                              setAuthModalShake(true);
                              setTimeout(() => setAuthModalShake(false), 600);
                              return;
                            }
                            toggleFavorite(phone.id);
                          }}
                          color={favorites.includes(phone.id) ? 'error' : 'default'}
                        >
                          {favorites.includes(phone.id)
                            ? <FavoriteIcon />
                            : <FavoriteBorderIcon sx={{ color: isDarkMode ? '#888' : undefined }} />}
                        </IconButton>
                      </Box>
                    </Card>                  
                  </Grid>
                ))}
                {visibleCount < filteredSmartphones.length && (
                  <Box display="flex" justifyContent="center" mt={2} width="100%">
                    <Button variant="contained" onClick={() => setVisibleCount(visibleCount + 12)}>
                      Показать ещё
                    </Button>
                  </Box>
                )}
              </Grid>
            )}
          </SmartphoneCardsContainer>

          {/* Кнопка прокрутки вверх */}
          {showScrollButton && (
            <IconButton
              onClick={scrollToTop}
              sx={{
                position: "fixed",
                bottom: 80,
                left: 16,
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": { backgroundColor: "primary.dark" },
                zIndex: 1200,
              }}
            >
              <ArrowUpwardIcon />
            </IconButton>
          )}

          {/* Кнопка перехода к сравнению */}
          {comparisonList.length > 0 && (
            <Box
              sx={{
                position: "fixed",
                bottom: 16,
                right: 16,
                display: "flex",
                gap: 2,
                zIndex: 1000,
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/compare")}
                sx={{ px: 4 }}
              >
                {t("common.goComparison")} ({comparisonList.length})
              </Button>
              <IconButton
                onClick={clearComparisonList}
                sx={{
                  backgroundColor: "error.main",
                  color: "white",
                  "&:hover": { backgroundColor: "error.dark" },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Container>
      </div>
    </>
  );
}

export default HomePage;