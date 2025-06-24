import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import ComparePage from "./ComparePage";
import Profile from "./profile";
import AdminPage from "./AdminPage";
import './i18n';
import Footer from "./Footer"; // Добавляем импорт Footer
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { lightTheme, darkTheme } from "./theme";
import { supabase } from './supabaseClient'; // Import supabase client

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark';
    } catch {
      return false;
    }
  }); // Initialize from localStorage
  const [comparisonList, setComparisonList] = useState([]); // 比较列表
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const updateUser = (newUserData) => {
    setUser(prevUser => ({...prevUser, ...newUserData}));
  };

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <Box flex={1} display="flex" flexDirection="column">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage 
                  comparisonList={comparisonList} 
                  setComparisonList={setComparisonList} 
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  user={user}
                />
              }
            />
            <Route
              path="/compare"
              element={
                <ComparePage 
                  comparisonList={comparisonList} 
                  setComparisonList={setComparisonList} 
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  user={user}
                />
              }
            />
            <Route
              path="/profile"
              element={
                <Profile 
                  user={user} 
                  session={session}
                  updateUser={updateUser} 
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminPage 
                  user={user}
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                />
              }
            />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;