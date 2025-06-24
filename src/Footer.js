// src/Footer.js
import React from "react";
import { Box, Typography, Toolbar, AppBar } from "@mui/material";
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <AppBar position="static" color="primary" sx={{ mt: "auto" }}>
      <Toolbar>
        <Typography variant="body2" color="inherit" sx={{ flexGrow: 1 }}>
          © 2025 Smartphone Comparison
        </Typography>
        <Typography variant="body2" color="inherit">
          {t('footer.rights')}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Footer;