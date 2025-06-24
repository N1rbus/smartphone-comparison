import { createTheme } from "@mui/material/styles";

// Светлая тема
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#007bff",
    },
    secondary: {
      main: "#6c757d",
    },
    background: {
      default: "#f8f9fa",
    },
  },
  transitions: {
    duration: {
      enteringScreen: 300, // Время анимации
      leavingScreen: 300,
    },
  },
});

// Тёмная тема
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#007bff",
    },
    secondary: {
      main: "#6c757d",
    },
    background: {
      default: "#121212",
    },
  },
  transitions: {
    duration: {
      enteringScreen: 300, // Время анимации
      leavingScreen: 300,
    },
  },
});

export { lightTheme, darkTheme };