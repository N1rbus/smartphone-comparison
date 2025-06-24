import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "./theme";

// Добавляем глобальные стили для html, body и #root
const GlobalStyles = () => (
  <CssBaseline enableColorScheme>
    <style>{`
      html, body, #root {
        height: 100%;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
    `}</style>
  </CssBaseline>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ThemeProvider theme={lightTheme}> {/* Используйте нужную тему */}
      <GlobalStyles /> {/* Применяем глобальные стили */}
      <App />
    </ThemeProvider>
  </BrowserRouter>
);