import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    handleClose();
  };

  return (
    <>
      {/* Кнопка в виде глобуса */}
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="select language"
        sx={{ fontSize: "1.5rem", padding: "8px" }}
      >
        <PublicIcon />
      </IconButton>

      {/* Выпадающее меню с языками */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 200,
            width: 180,
          },
        }}
      >
        <MenuItem
          onClick={() => changeLanguage('en')}
          sx={{
            fontWeight: i18n.language === 'en' ? 'bold' : 'normal',
            color: i18n.language === 'en' ? 'primary.main' : 'inherit',
            backgroundColor: i18n.language === 'en' ? 'rgba(0, 0, 255, 0.08)' : 'inherit',
          }}
        >
          English
        </MenuItem>
        <MenuItem
          onClick={() => changeLanguage('ru')}
          sx={{
            fontWeight: i18n.language === 'ru' ? 'bold' : 'normal',
            color: i18n.language === 'ru' ? 'primary.main' : 'inherit',
            backgroundColor: i18n.language === 'ru' ? 'rgba(0, 0, 255, 0.08)' : 'inherit',
          }}
        >
          Русский
        </MenuItem>
      </Menu>
    </>
  );
};

export default LanguageSwitcher;