import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Link,
  Tooltip,
  Modal,
  TextField,
  Alert,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import axios from './axios.config';
import CompareIcon from "@mui/icons-material/Compare";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AddIcon from "@mui/icons-material/Add";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";

// Регистрируем необходимые компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend,
  ChartDataLabels
);

// Функция для форматирования даты (если ее еще нет или нужно обновить)
const formatDate = (dateString) => {
  if (!dateString) return "Неизвестно";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    return "Неизвестно";
  }
};

function ComparePage({ comparisonList, setComparisonList, isDarkMode, toggleTheme, user }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [hideSame, setHideSame] = useState(false);
  const [sortByDiff, setSortByDiff] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [brands, setBrands] = useState([]);

  // Загрузка списка сравнения из localStorage при монтировании компонента
  useEffect(() => {
    const saved = localStorage.getItem('comparisonList');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setComparisonList(parsed);
        }
      } catch {}
    }
    // eslint-disable-next-line
  }, []);

  // Сохранение списка сравнения в localStorage при его изменении
  useEffect(() => {
    localStorage.setItem('comparisonList', JSON.stringify(comparisonList));
    console.log("Saving comparison list to localStorage:", comparisonList);
  }, [comparisonList]);

  // Удаление дубликатов из списка сравнения
  const uniqueComparisonList = comparisonList.filter(
    (phone, index, self) => index === self.findIndex((p) => p.id === phone.id)
  );

  // --- Автоматическое сохранение истории сравнения ---
  useEffect(() => {
    if (user && user.id && uniqueComparisonList.length >= 2 && uniqueComparisonList.length <= 4) {
      axios.post('/api/user-comparisons', {
        userId: user.id,
        deviceIds: uniqueComparisonList.map(phone => phone.id)
      }).catch(() => {});
    }
    // eslint-disable-next-line
  }, [uniqueComparisonList, user]);

  const navigate = useNavigate();

  // Обработчик открытия/закрытия бокового меню
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setIsDrawerOpen(open);
  };

  // Функция для форматирования цены в рублях
  const formatPriceRUB = (price) => {
    if (!price) return t("common.unknown");
    if (typeof price === 'string' && price.includes('INR')) {
      const num = price.replace(/[^\d]/g, '');
      return num ? `${Number(num).toLocaleString('ru-RU')} ₽` : t("common.unknown");
    }
    const priceNum = Number(price);
    if (!isNaN(priceNum) && priceNum > 0) {
      const rub = Math.round(priceNum * 90);
      return `${rub.toLocaleString('ru-RU')} ₽`;
    }
    return t("common.unknown");
  };

  // Обработчик открытия модального окна авторизации
  const handleLogin = () => {
    setLoginModalOpen(true);
    setLoginError(null);
    setAuthMode('login');
  };

  // Обработчик закрытия модального окна авторизации
  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
    setLoginError(null);
    setRegisterError(null);
  };

  // Обработчик отправки формы авторизации
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await axios.post('/login', { email, password });
      if (response.data.success) {
        // Обновляем состояние пользователя (предполагается, что setUser передается из App.js)
        if (typeof setUser === 'function') {
          setUser(response.data.user);
        }
        handleCloseLoginModal();
      } else {
        setLoginError(response.data.message || "Ошибка авторизации");
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || "Ошибка авторизации. Попробуйте позже.");
    }
  };

  // Обработчик отправки формы регистрации
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirm = formData.get('confirm');

    if (password !== confirm) {
      setRegisterError("Пароли не совпадают");
      return;
    }

    try {
      const response = await axios.post('/register', { email, password });
      if (response.data.success) {
        // Обновляем состояние пользователя (предполагается, что setUser передается из App.js)
        if (typeof setUser === 'function') {
          setUser(response.data.user);
        }
        handleCloseLoginModal();
      } else {
        setRegisterError(response.data.message || "Ошибка регистрации");
      }
    } catch (error) {
      setRegisterError(error.response?.data?.message || "Ошибка регистрации. Попробуйте позже.");
    }
  };

  // Функция для вычисления различия (0 — все одинаково, 1 — все разные)
  function getDiffScore(key, phones) {
    const values = phones.map(p => p[key]);
    const unique = Array.from(new Set(values.map(v => v === undefined ? '' : String(v))));
    return unique.length / phones.length;
  }

  // После очистки сравнения:
  const clearComparisonList = async () => {
    setComparisonList([]);
    localStorage.removeItem('comparisonList');
    // ...
  };

  // Загрузка брендов при монтировании
  useEffect(() => {
    fetch("http://localhost:5000/brands").then(r => r.json()).then(setBrands);
  }, []);

  // Открыть модалку массового редактирования
  const handleOpenEditModal = () => {
    setEditData(uniqueComparisonList.map(phone => ({
      id: phone.id,
      brand_id: phone.brand_id,
      price: phone.price,
      processor: phone.processor,
      battery: phone.battery,
      screen: phone.screen,
      name: phone.name
    })));
    setEditModalOpen(true);
    setEditError("");
    setEditSuccess("");
  };

  // Сохранить изменения
  const handleSaveEdit = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      for (const phone of editData) {
        const { id, ...fields } = phone;
        await fetch(`http://localhost:5000/devices/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields)
        });
      }
      setEditSuccess('Изменения сохранены!');
      setEditModalOpen(false);
      window.location.reload();
    } catch (e) {
      setEditError('Ошибка при сохранении изменений');
    } finally {
      setEditLoading(false);
    }
  };

  // --- массив характеристик для сравнения и редактирования ---
  const characteristics = [
    { key: 'brand_id', label: t('compare.brand'), type: 'select', options: brands },
    { key: 'price', label: t('compare.price'), type: 'number' },
    { key: 'processor', label: t('compare.processor'), type: 'text' },
    { key: 'battery', label: t('compare.battery'), type: 'text' },
    { key: 'screen', label: t('compare.screen'), type: 'text' },
    { key: 'os', label: t('compare.os'), type: 'text' },
    { key: 'cameras', label: t('compare.cameras'), type: 'text' },
    { key: 'ram', label: t('compare.ram'), type: 'text' },
    { key: 'storage', label: t('compare.storage'), type: 'text' },
    { key: 'screen_type', label: t('compare.screenType'), type: 'text' },
    { key: 'refresh_rate', label: t('compare.refreshRate'), type: 'text' },
    { key: 'resolution', label: t('compare.resolution'), type: 'text' },
    { key: 'weight', label: t('compare.weight'), type: 'text' },
    { key: 'body_material', label: t('compare.bodyMaterial'), type: 'text' },
    { key: 'water_resistance', label: t('compare.waterResistance'), type: 'boolean' },
    { key: 'wireless_charging', label: t('compare.wirelessCharging'), type: 'boolean' },
    { key: 'fast_charging', label: t('compare.fastCharging'), type: 'boolean' },
    { key: 'main_camera_resolution', label: t('compare.mainCameraResolution'), type: 'text' },
    { key: 'main_camera_aperture', label: t('compare.mainCameraAperture'), type: 'text' },
    { key: 'front_camera_resolution', label: t('compare.frontCameraResolution'), type: 'text' },
    { key: 'front_camera_aperture', label: t('compare.frontCameraAperture'), type: 'text' },
    { key: '5g_support', label: t('compare.5gSupport'), type: 'boolean' },
    { key: 'fingerprint_scanner', label: t('compare.fingerprintScanner'), type: 'boolean' },
    { key: 'nfc', label: t('compare.nfc'), type: 'boolean' },
    { key: 'microsd_slot', label: t('compare.microsdSlot'), type: 'boolean' },
    { key: 'colors', label: t('compare.colors'), type: 'text' },
    { key: 'release_date', label: t('compare.releaseDate'), type: 'text' },
    { key: 'warranty', label: t('compare.warranty'), type: 'text' },
    { key: 'battery_type', label: t('compare.batteryType'), type: 'text' },
    { key: 'stereo_speakers', label: t('compare.stereoSpeakers'), type: 'boolean' },
    { key: 'headphone_jack', label: t('compare.headphoneJack'), type: 'boolean' },
    { key: 'connectivity', label: t('compare.connectivity'), type: 'text' },
    { key: 'dimensions', label: t('compare.dimensions'), type: 'text' },
    { key: 'special_features', label: t('compare.specialFeatures'), type: 'text' },
    { key: 'screen_special_features', label: t('compare.screenSpecialFeatures'), type: 'text' },
    { key: 'sound_special_features', label: t('compare.soundSpecialFeatures'), type: 'text' },
    { key: 'wired_charging', label: t('compare.wiredCharging'), type: 'text' },
    { key: 'wireless_charging_power', label: t('compare.wirelessChargingPower'), type: 'text' },
    { key: 'ppi', label: t('compare.ppi'), type: 'text' },
    { key: 'aspect_ratio', label: t('compare.aspectRatio'), type: 'text' },
    { key: 'brightness_contrast', label: t('compare.brightnessContrast'), type: 'text' },
  ];

  return (
    <>
      {/* Шапка */}
      <Box
        sx={{
          backgroundColor: "primary.main",
          color: "white",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "65px",
          boxShadow: 1,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Иконка меню */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleDrawer(true)}
        >
          <MenuIcon />
        </IconButton>

        {/* Логотип */}
        <Box
          component="img"
          src="/logo.svg"
          alt={t("common.logo")}
          sx={{ height: "50px", cursor: "pointer" }}
          onClick={() => navigate("/")}
        />

        {/* Кнопки переключения темы и языка */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton color="inherit" onClick={toggleTheme}>
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <LanguageSwitcher />
        </Box>
      </Box>

      {/* Боковое меню */}
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {/* Личный кабинет / Войти */}
            {user ? (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate("/profile")} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("common.profile")} />
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogin} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("common.login")} />
                </ListItemButton>
              </ListItem>
            )}
            <Divider />
            {/* Главная страница */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate("/")} sx={{ cursor: 'pointer' }}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary={t("common.home")} />
              </ListItemButton>
            </ListItem>
            {user && user.role === 'admin' && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate("/admin")} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <AdminPanelSettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("common.adminPanel")} />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Модальное окно авторизации */}
      <Modal open={isLoginModalOpen} onClose={handleCloseLoginModal}>
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
          onClick={handleCloseLoginModal}
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
              <form onSubmit={handleLoginSubmit}>
                <TextField label={t("common.email")}
                  name="email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label={t("common.password")}
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="current-password"
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
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                  {t("common.loginButton")}
                </Button>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2">
                    {t('common.noAccount')}{' '}
                    <Button variant="text" onClick={() => { setAuthMode('register'); setLoginError(null); }}>
                      {t('common.registerLink')}
                    </Button>
                  </Typography>
                </Box>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <TextField label={t("common.email")}
                  name="email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label={t("common.password")}
                  name="password"
                  type={showRegisterPassword ? "text" : "password"}
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="new-password"
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
                  label={t("common.confirmPassword")}
                  name="confirm"
                  type={showRegisterConfirm ? "text" : "password"}
                  fullWidth
                  margin="normal"
                  required
                  autoComplete="new-password"
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
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                  {t("common.register")}
                </Button>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2">
                    {t('common.haveAccount')}{' '}
                    <Button variant="text" onClick={() => { setAuthMode('login'); setRegisterError(null); }}>
                      {t('common.loginLink')}
                    </Button>
                  </Typography>
                </Box>
              </form>
            )}
          </Container>
        </Box>
      </Modal>

      {/* Основной контент */}
      <Container sx={{ pt: 6, pb: 8, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Заголовок и пустой список сравнения */}
        {uniqueComparisonList.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ pt: 4, pb: 4, flex: 1 }}>
            <CompareIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom textAlign="center">
              {t("compare.noPhonesSelectedTitle" || "Начните сравнивать смартфоны!")}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
              {t("compare.noPhonesSelectedDescription" || "Добавьте до четырех устройств с главной страницы, чтобы увидеть их различия.")}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/")}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              {t("compare.goToSelection" || "Перейти к выбору смартфонов")}
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {user && user.role === 'admin' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  sx={{ minWidth: 180, fontWeight: 500 }}
                  onClick={handleOpenEditModal}
                >
                  Редактировать характеристики
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: '8px', backgroundColor: 'transparent', boxShadow: 'none', flexGrow: 1 }}>
              <Table aria-label={t("compare.tableLabel")}>
                <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.85)' : 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<DeleteIcon />}
                          onClick={clearComparisonList}
                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                      >
                        {t("compare.clearList")}
                      </Button>
                    </TableCell>
                    {Array.from({ length: 4 }).map((_, index) => {
                      const phone = uniqueComparisonList[index];
                      return (
                        <TableCell align="center" key={phone ? phone.id : `empty-${index}`}
                          sx={{
                            borderBottom: 'none',
                            borderRight: index < 3 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                          }}
                        >
                          {phone ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                              }}
                            >
                              <Box
                                component="img"
                                src={phone.image_url || "/default-image.jpg"}
                                alt={phone.name || "Смартфон"}
                                sx={{
                                  width: 100,
                                  height: 100,
                                  objectFit: 'contain',
                                  borderRadius: '4px',
                                }}
                              />
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {phone.name || t("common.unknown")}
                              </Typography>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => setComparisonList(comparisonList.filter(item => item.id !== phone.id))}
                                sx={{ mt: 1, borderRadius: '8px' }}
                              >
                                {t("common.remove")}
                              </Button>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                              }}
                            >
                              <Box
                                component="img"
                                src="/default-image.jpg"
                                alt={t("compare.add")}
                                sx={{
                                  width: 100,
                                  height: 100,
                                  objectFit: 'contain',
                                  borderRadius: '4px',
                                }}
                              />
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', visibility: 'hidden' }}>
                                &nbsp;
                              </Typography>
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => navigate("/")}
                                sx={{ mt: 1, borderRadius: '8px', textTransform: 'none' }}
                              >
                                {t("compare.add")}
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[ // Массив объектов для динамического отображения характеристик
                    { key: 'brand_name', label: t("compare.brand"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.brandExplanation" },
                    { key: 'price', label: t("compare.price"), formatter: formatPriceRUB, explanationKey: "compare.priceExplanation" },
                    { key: 'processor', label: t("compare.processor"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.processorExplanation" },
                    { key: 'battery', label: t("compare.battery"), formatter: (value) => value ? `${value} mAh` : t("common.unknown"), explanationKey: "compare.batteryExplanation" },
                    { key: 'screen', label: t("compare.screen"), formatter: (value) => value ? `${value} дюймы` : t("common.unknown"), explanationKey: "compare.screenExplanation" },
                    { key: 'os', label: t("compare.os"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.osExplanation" },
                    { key: 'cameras', label: t("compare.cameras"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.camerasExplanation" },
                    { key: 'ram', label: t("compare.ram"), formatter: (value) => value ? `${value} GB` : t("common.unknown"), explanationKey: "compare.ramExplanation" },
                    { key: 'storage', label: t("compare.storage"), formatter: (value) => value ? `${value} GB` : t("common.unknown"), explanationKey: "compare.storageExplanation" },
                    { key: 'screen_type', label: t("compare.screenType"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.screenTypeExplanation" },
                    { key: 'refresh_rate', label: t("compare.refreshRate"), formatter: (value) => value ? `${value} Hz` : t("common.unknown"), explanationKey: "compare.refreshRateExplanation" },
                    { key: 'resolution', label: t("compare.resolution"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.resolutionExplanation" },
                    { key: 'weight', label: t("compare.weight"), formatter: (value) => value ? `${value} g` : t("common.unknown"), explanationKey: "compare.weightExplanation" },
                    { key: 'body_material', label: t("compare.bodyMaterial"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.bodyMaterialExplanation" },
                    { key: 'water_resistance', label: t("compare.waterResistance"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.waterResistanceExplanation" },
                    { key: 'wireless_charging', label: t("compare.wirelessCharging"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.wirelessChargingExplanation" },
                    { key: 'fast_charging', label: t("compare.fastCharging"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.fastChargingExplanation" },
                    { key: 'main_camera_resolution', label: t("compare.mainCameraResolution"), formatter: (value) => value ? `${value} MP` : t("common.unknown"), explanationKey: "compare.mainCameraResolutionExplanation" },
                    { key: 'main_camera_aperture', label: t("compare.mainCameraAperture"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.mainCameraApertureExplanation" },
                    { key: 'front_camera_resolution', label: t("compare.frontCameraResolution"), formatter: (value) => value ? `${value} MP` : t("common.unknown"), explanationKey: "compare.frontCameraResolutionExplanation" },
                    { key: 'front_camera_aperture', label: t("compare.frontCameraAperture"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.frontCameraApertureExplanation" },
                    { key: '5g_support', label: t("compare.5gSupport"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.5gSupportExplanation" },
                    { key: 'fingerprint_scanner', label: t("compare.fingerprintScanner"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.fingerprintScannerExplanation" },
                    { key: 'nfc', label: t("compare.nfc"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.nfcExplanation" },
                    { key: 'microsd_slot', label: t("compare.microsdSlot"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.microsdSlotExplanation" },
                    { key: 'colors', label: t("compare.colors"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.colorsExplanation" },
                    { key: 'release_date', label: t("compare.releaseDate"), formatter: formatDate, explanationKey: "compare.releaseDateExplanation" },
                    { key: 'warranty', label: t("compare.warranty"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.warrantyExplanation" },
                    { key: 'battery_type', label: t("compare.batteryType"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.batteryTypeExplanation" },
                    { key: 'stereo_speakers', label: t("compare.stereoSpeakers"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.stereoSpeakersExplanation" },
                    { key: 'headphone_jack', label: t("compare.headphoneJack"), formatter: (value) => value ? t("common.yes") : t("common.no"), explanationKey: "compare.headphoneJackExplanation" },
                    { key: 'connectivity', label: t("compare.connectivity"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.connectivityExplanation" },
                    { key: 'dimensions', label: t("compare.dimensions"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.dimensionsExplanation" },
                    { key: 'special_features', label: t("compare.specialFeatures"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.specialFeaturesExplanation" },
                    { key: 'screen_special_features', label: t("compare.screenSpecialFeatures"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.screenSpecialFeaturesExplanation" },
                    { key: '', label: t("compare.soundVolumeDb"), formatter: (value) => value ? `${value} dB` : t("common.unknown"), explanationKey: "compare.soundVolumeDbExplanation" },
                    { key: 'sound_special_features', label: t("compare.soundSpecialFeatures"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.soundSpecialFeaturesExplanation" },
                    { key: 'wired_charging', label: t("compare.wiredCharging"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.wiredChargingExplanation" },
                    { key: 'wireless_charging_power', label: t("compare.wirelessChargingPower"), formatter: (value) => value ? `${value} W` : t("common.unknown"), explanationKey: "compare.wirelessChargingPowerExplanation" },
                    { key: 'ppi', label: t("compare.ppi"), formatter: (value) => value ? `${value} PPI` : t("common.unknown"), explanationKey: "compare.ppiExplanation" },
                    { key: 'aspect_ratio', label: t("compare.aspectRatio"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.aspectRatioExplanation" },
                    { key: 'brightness_contrast', label: t("compare.brightnessContrast"), formatter: (value) => value || t("common.unknown"), explanationKey: "compare.brightnessContrastExplanation" },
                  ].map((char) => (
                    <TableRow key={char.key} sx={{ '&:nth-of-type(odd)': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.5)' : 'rgba(255,255,255,0.5)' } }}>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(255, 255, 255, 0.12)', verticalAlign: 'middle' }}>
                        {char.label}
                        {char.explanationKey && (
                          <Tooltip title={t(char.explanationKey)} arrow>
                            <HelpOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      {uniqueComparisonList.map((phone) => (
                        <TableCell align="center" key={phone.id} sx={{ verticalAlign: 'middle' }}>
                          {char.formatter ? char.formatter(phone[char.key]) : (phone[char.key] || "-")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Секция графиков производительности (если есть смартфоны для сравнения) */}
        {uniqueComparisonList.length > 0 && (
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h2" gutterBottom textAlign="center" sx={{ mb: 3 }}>
              {t("compare.benchmarksTitle")}
            </Typography>

            {/* Сводный график производительности */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '8px', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Typography variant="h6" component="h3" gutterBottom>{t("compare.cpuMultiCore")} / {t("compare.cpuSingleCore")} / {t("compare.gpuBenchmark")} <Tooltip title={t("compare.cpuMultiCoreExplanation") + "\n" + t("compare.cpuSingleCoreExplanation") + "\n" + t("compare.gpuBenchmarkExplanation")} arrow><HelpOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} /></Tooltip></Typography>
              <Box sx={{ height: 400, width: '100%' }}>
                <Bar
                  data={{
                    labels: uniqueComparisonList.map(phone => phone.name),
                    datasets: [
                      {
                        label: t("compare.cpuMultiCore"),
                        data: uniqueComparisonList.map(phone => phone.cpu_multicore_benchmark || 0),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: t("compare.cpuSingleCore"),
                        data: uniqueComparisonList.map(phone => phone.cpu_singlecore_benchmark || 0),
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: t("compare.gpuBenchmark"),
                        data: uniqueComparisonList.map(phone => phone.gpu_benchmark || 0),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Красный цвет для GPU
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false },
                      datalabels: {
                        display: true,
                        color: isDarkMode ? '#fff' : '#000',
                        anchor: 'center',
                        align: 'center',
                        formatter: (value) => value.toLocaleString(),
                        clip: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: t("compare.score") },
                      },
                    },
                  }}
                />
              </Box>
            </Paper>

            {/* График FPS в играх */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '8px', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Typography variant="h6" component="h3" gutterBottom>{t("compare.gamingFps")} <Tooltip title={t("compare.gamingFpsExplanation")} arrow><HelpOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} /></Tooltip></Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <Bar
                  data={{
                    labels: uniqueComparisonList.map(phone => phone.name),
                    datasets: [
                      {
                        label: t("compare.averageFps"),
                        data: uniqueComparisonList.map(phone => phone.gaming_fps_average || 0),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: t("compare.minFps"),
                        data: uniqueComparisonList.map(phone => phone.gaming_fps_min || 0),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false },
                      datalabels: {
                        display: true,
                        color: isDarkMode ? '#fff' : '#000',
                        anchor: 'center',
                        align: 'center',
                        formatter: (value) => value.toLocaleString(),
                        clip: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: t("compare.fps") },
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Box>
        )}

        {/* Модалка массового редактирования характеристик */}
        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 6, maxWidth: 1200, width: '98vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: '90vh', overflowY: 'auto' }}>
            <Typography variant="h6" mb={2}>Редактировать характеристики</Typography>
            {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Характеристика</TableCell>
                  {editData.map(phone => (
                    <TableCell key={phone.id} sx={{ fontWeight: 'bold' }}>{phone.name}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {characteristics.map(char => (
                  <TableRow key={char.key}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{char.label}</TableCell>
                    {editData.map((phone, idx) => (
                      <TableCell key={phone.id}>
                        {char.type === 'select' ? (
                          <Select
                            value={phone[char.key] || ''}
                            onChange={e => {
                              const newData = [...editData];
                              newData[idx][char.key] = e.target.value;
                              setEditData(newData);
                            }}
                            size="small"
                            fullWidth
                          >
                            {char.options && char.options.map(opt => (
                              <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                            ))}
                          </Select>
                        ) : char.type === 'boolean' ? (
                          <Checkbox
                            checked={!!phone[char.key]}
                            onChange={e => {
                              const newData = [...editData];
                              newData[idx][char.key] = e.target.checked;
                              setEditData(newData);
                            }}
                          />
                        ) : (
                          <TextField
                            value={phone[char.key] || ''}
                            onChange={e => {
                              const newData = [...editData];
                              newData[idx][char.key] = e.target.value;
                              setEditData(newData);
                            }}
                            size="small"
                            fullWidth
                            type={char.type === 'number' ? 'number' : 'text'}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={() => setEditModalOpen(false)} color="secondary" variant="outlined">Нет</Button>
              <Button onClick={handleSaveEdit} color="primary" variant="contained" disabled={editLoading}>{editLoading ? 'Сохраняю...' : 'Сохранить изменения'}</Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </>
  );
}

export default ComparePage;