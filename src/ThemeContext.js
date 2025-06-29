import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Default to dark mode
    return true;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Apply theme to document body
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? {
      // Dark theme colors
      primary: '#64ffda',
      secondary: '#4cd8b2',
      background: '#0a192f',
      surface: '#112240',
      text: '#ffffff',
      textSecondary: '#8892b0',
      border: 'rgba(100, 255, 218, 0.2)',
      success: '#10b981',
      warning: '#fbbf24',
      error: '#ef4444',
      info: '#3b82f6'
    } : {
      // Light theme colors
      primary: '#1a1a2e',
      secondary: '#16213e',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1a1a2e',
      textSecondary: '#64748b',
      border: 'rgba(26, 26, 46, 0.2)',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#2563eb'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 