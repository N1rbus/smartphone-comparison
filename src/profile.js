import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  IconButton,
  Box,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  AppBar,
  Avatar,
  Grid,
  Paper,
  Tab,
  Tabs,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert as MuiAlert,
  Modal
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Compare as CompareIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Home as HomeIcon,
  History as HistoryIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminPanelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from './components/LanguageSwitcher';
import axios from './axios.config';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import { supabase } from './supabaseClient';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '20px 0' }}>
      {value === index && children}
    </div>
  );
}

function Profile({ user, updateUser, isDarkMode, toggleTheme, comparisonList, setComparisonList }) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || ""
  });
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutSnackbar, setShowLogoutSnackbar] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  // 监听用户数据变化
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || ""
      });
    }
  }, [user]);

  // Загрузка истории сравнений при открытии вкладки "История"
  useEffect(() => {
    if (tabValue === 1 && user?.id) {
      setHistoryLoading(true);
      axios.get(`/api/user-comparisons`)
        .then(res => {
          // Группируем сравнения по времени (или другому признаку, если есть)
          // Предполагаем, что сервер возвращает массив сравнений, где каждое сравнение — это массив устройств
          // Если сервер возвращает просто список устройств, нужно доработать сервер
          // Для примера: res.data = [{devices: [phone1, phone2], created_at: ...}, ...]
          setHistory(res.data.slice(0, 3)); // только последние 3 сравнения
        })
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [tabValue, user]);

  // Загрузка избранного при открытии вкладки
  useEffect(() => {
    if (tabValue === 2 && user?.id) {
      setFavoritesLoading(true);
      axios.get(`/api/user-favorites`)
        .then(res => setFavorites(res.data))
        .catch(() => setFavorites([]))
        .finally(() => setFavoritesLoading(false));
    }
  }, [tabValue, user]);

  // 保存用户信息
  const handleSave = async () => {
    try {
      setLoading(true);
      if (!formData.name || !formData.email) {
        setError("Пожалуйста, заполните все обязательные поля.");
        return;
      }

      console.log('Отправка данных:', {
        name: formData.name,
        email: formData.email
      });

      const response = await axios.post('/api/users/update', {
        name: formData.name,
        email: formData.email
      });

      console.log('Ответ сервера:', response.data);

      if (response.data.success) {
        if (typeof updateUser === 'function') {
          updateUser(response.data.user);
        }
      setEditMode(false);
      setError(null);
      } else {
        setError(response.data.message || "Ошибка сохранения данных");
      }
    } catch (error) {
      console.error("Полная информация об ошибке:", error);
      setError(error.response?.data?.message || "Ошибка сохранения данных. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Пароли не совпадают!');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw new Error(error.message || 'Ошибка смены пароля');
      }
      
      setPasswordChangeSuccess('Пароль успешно обновлен!');
      setNewPassword('');
      setConfirmNewPassword('');
      
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordChangeSuccess('');
      }, 2000);

    } catch (error) {
      setPasswordChangeError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutSnackbar(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
      }
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
    setDrawerOpen(open);
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }));
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(formData.avatar, croppedAreaPixels);
      const formDataToSend = new FormData();
      formDataToSend.append('avatar', croppedImage, 'avatar.jpg');
      const response = await axios.post('/api/users/upload-avatar', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          avatar: response.data.avatarUrl
        }));
        if (typeof updateUser === 'function') {
          updateUser({ ...user, avatar: response.data.avatarUrl });
        }
        setError(null);
      } else {
        setError(response.data.message || "Ошибка при загрузке фото");
      }
    } catch (error) {
      console.error("Ошибка при загрузке фото:", error, error.response);
      setError(error.response?.data?.message || "Ошибка при загрузке фото");
    } finally {
      setShowCropper(false);
    }
  };

  const getCroppedImg = (src, pixelCrop) => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = src;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg');
      };
    });
  };

  // Вычисляем полный путь к аватару
  const avatarUrl = formData.avatar
    ? formData.avatar.startsWith('http')
      ? formData.avatar
      : `http://localhost:5000/${formData.avatar}`
    : '';

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

  if (!user) {
    return <Typography>{t('common.login')}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ backgroundColor: "primary.main", color: "white" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src="/logo.svg"
            alt="Логотип"
            sx={{ height: "50px", cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <LanguageSwitcher />
          </Box>
        </Toolbar>
      </AppBar>
      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          <Box>
            <List>
              <ListItem button onClick={() => navigate("/")}> 
                <ListItemIcon><HomeIcon /></ListItemIcon>
                <ListItemText primary={t('common.home')} />
              </ListItem>
              <Divider />
              <ListItem button onClick={() => navigate("/compare")}> 
                <ListItemIcon><CompareIcon /></ListItemIcon>
                <ListItemText primary={t('profile.tabs.compare')} />
              </ListItem>
              {user && user.role === 'admin' && (
                <ListItem button onClick={() => navigate("/admin")}>
                  <ListItemIcon><AdminPanelIcon /></ListItemIcon>
                  <ListItemText primary={t("common.adminPanel")} />
                </ListItem>
              )}
            </List>
          </Box>
          <Box>
            <Divider />
            <List>
              <ListItem button onClick={handleLogout} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><ExitToAppIcon /></ListItemIcon>
                <ListItemText primary={t('profile.tabs.logout')} />
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>
      {/* Основной контент */}
      <Container sx={{ py: 4, pt: 10, maxWidth: 1200 }}>
        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover .avatar-overlay': {
                        opacity: 1
                      }
                    }}
                    onClick={handleAvatarClick}
                  >
                    <Avatar
                      src={avatarUrl}
                      sx={{
                        width: 120,
                        height: 120,
                        mx: 'auto',
                        mb: 2
                      }}
                    />
                    <Box
                      className="avatar-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <PhotoCameraIcon sx={{ color: 'white', fontSize: 40 }} />
                    </Box>
                  </Box>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Box>
                <Typography variant="h5" gutterBottom>
                  {formData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formData.email}
        </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
          <CardContent>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label={t('profile.tabs.profile')} />
                  <Tab label={t('profile.tabs.history')} />
                  <Tab label={t('profile.tabs.favorites')} />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
            {editMode ? (
              <form>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                <TextField
                  label={t('profile.profile.name')}
                  variant="outlined"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                        </Grid>
                        <Grid item xs={12}>
                <TextField
                  label={t('profile.profile.email')}
                  variant="outlined"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleSave}
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        >
                  {t('profile.profile.save')}
                </Button>
                        <Button variant="outlined" onClick={() => {
                          setFormData({
                            name: user.name,
                            email: user.email,
                            avatar: user.avatar || ""
                          });
                          setEditMode(false);
                        }}>
                  {t('profile.profile.cancel')}
                </Button>
                      </Box>
                    </form>
                  ) : (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" color="text.secondary">
                            {t('profile.profile.name')}
                          </Typography>
                          <Typography variant="body1">{formData.name}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" color="text.secondary">
                            {t('profile.profile.email')}
                          </Typography>
                          <Typography variant="body1">{formData.email}</Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => setEditMode(true)}
                          startIcon={<EditIcon />}
                        >
                {t('profile.profile.edit')}
              </Button>
                        <Button
                          variant="contained"
                          onClick={() => setPasswordModalOpen(true)}
                          sx={{ ml: 1 }}
                        >
                          {t('profile.profile.changePassword')}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Typography variant="h6" gutterBottom>
                    {t('profile.history.title')}
                  </Typography>
                  {historyLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : history.length === 0 ? (
                    <Typography color="text.secondary">{t('profile.history.empty')}</Typography>
                  ) : (
                    <List>
                      {history.map((comparison, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon><HistoryIcon /></ListItemIcon>
                          <ListItemText
                            primary={Array.isArray(comparison.devices) ? comparison.devices.map(d => d.name).join(' VS ') : 'Нет данных'}
                            secondary={Array.isArray(comparison.devices) ? comparison.devices.map(d => `${d.brand || ''} ${d.price ? `| $${d.price}` : ''}`).join(' VS ') : ''}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Typography variant="h6" gutterBottom>
                    {t('profile.favorites.title')}
                  </Typography>
                  {favoritesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : favorites.length === 0 ? (
                    <Typography color="text.secondary">{t('profile.favorites.empty')}</Typography>
                  ) : (
                    <List>
                      {favorites.map((phone) => (
                        <ListItem key={phone.id}>
                          <ListItemIcon><FavoriteIcon color="error" /></ListItemIcon>
                          <ListItemText
                            primary={phone.name}
                            secondary={`Бренд: ${phone.brand_name || ''} | Цена: ${formatPriceRUB(phone.price)} | Процессор: ${phone.processor || ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </TabPanel>
              </CardContent>
        </Card>
          </Grid>
        </Grid>
      </Container>

      {showCropper && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '80%', height: '80%', position: 'relative' }}>
            <Cropper
              image={formData.avatar}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <button
            onClick={handleCropConfirm}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Подтвердить
          </button>
        </div>
      )}

      {/* Модальное окно выхода */}
      <Dialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        PaperProps={{
          style: {
            backgroundColor: isDarkMode ? '#424242' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            minWidth: '300px',
            textAlign: 'center',
            padding: '20px'
          }
        }}
      >
        <DialogContent>
          <Typography variant="h6" component="div" sx={{ mb: 2 }}>
            {t('common.logoutSuccess')}
          </Typography>
          <CircularProgress size={24} />
        </DialogContent>
      </Dialog>

      {/* Snackbar для успешного выхода */}
      <Snackbar
        open={showLogoutSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={1500}
        onClose={() => setShowLogoutSnackbar(false)}
      >
        <MuiAlert severity="success" sx={{ width: '100%' }}>
          Вы успешно вышли из профиля
        </MuiAlert>
      </Snackbar>

      {/* Модальное окно для смены пароля */}
      <Modal open={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)}>
        <Box sx={{ p: 4, bgcolor: 'background.paper', margin: 'auto', mt: '10%', width: 400, borderRadius: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            {t('profile.password.title')}
          </Typography>
          <form onSubmit={handlePasswordChange}>
            <TextField
              fullWidth
              margin="normal"
              type="password"
              label={t('profile.password.new')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              type="password"
              label={t('profile.password.confirm')}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            {passwordChangeError && <Alert severity="error" sx={{ mt: 2 }}>{passwordChangeError}</Alert>}
            {passwordChangeSuccess && <Alert severity="success" sx={{ mt: 2 }}>{passwordChangeSuccess}</Alert>}
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : t('profile.password.save')}
            </Button>
          </form>
        </Box>
      </Modal>
    </Box>
  );
}

export default Profile;