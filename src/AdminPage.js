import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Select,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton,
  AppBar,
  Toolbar
} from "@mui/material";
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Compare as CompareIcon,
  AdminPanelSettings as AdminPanelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

function AdminPage({ user, setUser, isDarkMode, toggleTheme }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Пример пользователей (заменить на fetch с сервера)
  const [users, setUsers] = useState([
    { id: 1, email: "admin@example.com", role: "admin", blocked: false },
    { id: 2, email: "user1@example.com", role: "user", blocked: false },
    { id: 3, email: "user2@example.com", role: "user", blocked: true },
  ]);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "user" });

  if (!user || user.role !== "admin") {
    return <div>Нет доступа</div>;
  }

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
    setIsDrawerOpen(open);
  };

  // Функции управления пользователями
  const handleDelete = (id) => setUsers(users.filter(u => u.id !== id));
  const handleRoleChange = (id, role) => setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  const handleBlockToggle = (id) => setUsers(users.map(u => u.id === id ? { ...u, blocked: !u.blocked } : u));
  const handleAddUser = (e) => {
    e.preventDefault();
    setUsers([...users, { ...newUser, id: Date.now(), blocked: false }]);
    setNewUser({ email: "", password: "", role: "user" });
  };
  const handleLogout = () => {
    setUser(null);
    window.location.href = "/";
  };

  return (
    <>
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
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} role="presentation">
          <Box>
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate("/profile")} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("common.profile")} />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate("/")} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("common.home")} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate("/compare")} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <CompareIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("common.compare")} />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
          <Box>
            <Divider />
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <ExitToAppIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("common.logout")} />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>

      <Container sx={{ py: 4, mt: 8 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Админ-панель</Typography>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>Пользователи</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Роль</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                  <MenuItem value="user">user</MenuItem>
                  <MenuItem value="admin">admin</MenuItem>
                </Select>
              </TableCell>
              <TableCell>{u.blocked ? "Заблокирован" : "Активен"}</TableCell>
              <TableCell>
                <Button size="small" color="error" onClick={() => handleDelete(u.id)}>Удалить</Button>
                <Button size="small" onClick={() => handleBlockToggle(u.id)}>
                  {u.blocked ? "Разблокировать" : "Заблокировать"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box component="form" onSubmit={handleAddUser} sx={{ mt: 4, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField label="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
        <TextField label="Пароль" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
        <Select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
          <MenuItem value="user">user</MenuItem>
          <MenuItem value="admin">admin</MenuItem>
        </Select>
        <Button type="submit" variant="contained">Добавить пользователя</Button>
      </Box>
    </Container>
    </>
  );
}

export default AdminPage; 