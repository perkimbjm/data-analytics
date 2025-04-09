// src/components/theme/ThemeSelector.jsx
// Theme selector component that allows users to choose between different color themes
// It also includes the dark/light mode toggle

import { useState, useRef, useEffect } from 'react';
import { FiSun, FiMoon, FiChevronDown } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const ThemeSelector = () => {
  const { theme, setTheme, darkMode, toggleDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  const themes = [
    { id: 'indigo', color: '#5D5CDE', name: 'Indigo' },
    { id: 'teal', color: '#14B8A6', name: 'Teal' },
    { id: 'amber', color: '#F59E0B', name: 'Amber' },
    { id: 'rose', color: '#F43F5E', name: 'Rose' },
    { id: 'emerald', color: '#10B981', name: 'Emerald' }
  ];
  
  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };
  
  return (
    <div className="flex items-center gap-4">
      {/* Theme dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium"
          aria-label="Select theme"
        >
          <span 
            className="size-4 rounded-full" 
            style={{ backgroundColor: currentTheme.color }}
          />
          <span className="hidden sm:inline">{currentTheme.name}</span>
          <FiChevronDown className="size-4" />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 py-1 border border-gray-200 dark:border-gray-700">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`
                  w-full text-left px-4 py-2 flex items-center gap-2
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${theme === t.id ? 'bg-gray-100 dark:bg-gray-700' : ''}
                `}
              >
                <span 
                  className="size-4 rounded-full" 
                  style={{ backgroundColor: t.color }}
                />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className={`
          p-2 rounded-full transition-colors duration-200
          ${darkMode ? 
            'bg-gray-700 text-yellow-300' : 
            'bg-gray-200 text-gray-800'
          }
        `}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? 
          <FiSun className="w-5 h-5" /> : 
          <FiMoon className="w-5 h-5" />
        }
      </button>
    </div>
  );
};

export default ThemeSelector;