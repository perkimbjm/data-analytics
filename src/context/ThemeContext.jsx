// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Inisialisasi dengan preferensi tersimpan atau default
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'indigo';
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    // Secara default selalu dark mode
    return savedMode !== null ? savedMode === 'true' : true;
  });

  // Update CSS variables ketika tema berubah
  useEffect(() => {
    const themeColors = {
      'indigo': { primary: '#5D5CDE', hover: '#4A49C0' },
      'teal': { primary: '#14B8A6', hover: '#0D9488' },
      'amber': { primary: '#F59E0B', hover: '#D97706' },
      'rose': { primary: '#F43F5E', hover: '#E11D48' },
      'emerald': { primary: '#10B981', hover: '#059669' }
    };
    
    const colors = themeColors[theme] || themeColors.indigo;
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--primary-hover', colors.hover);
    document.documentElement.className = `theme-${theme}`;
    
    // Simpan preferensi tema
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Update class dark mode
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (darkMode) {
      htmlElement.classList.add('dark');
      htmlElement.style.backgroundColor = 'var(--dark-bg)';
      document.body.style.backgroundColor = 'var(--dark-bg)';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
    }
    
    // Simpan preferensi dark mode
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);