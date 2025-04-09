// src/components/layout/Header.jsx
import { FiSun, FiMoon, FiRefreshCw  } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
  const { theme, setTheme, darkMode, toggleDarkMode } = useTheme();

  const themes = [
    { id: 'indigo', color: '#5D5CDE', name: 'Indigo' },
    { id: 'teal', color: '#14B8A6', name: 'Teal' },
    { id: 'amber', color: '#F59E0B', name: 'Amber' },
    { id: 'rose', color: '#F43F5E', name: 'Rose' },
    { id: 'emerald', color: '#10B981', name: 'Emerald' }
  ];

  const resetDashboard = () => {
    if (window.confirm('Are you sure you want to reset the dashboard?')) {
      window.location.reload();
    }
  };

  return (
    <div className="header-container">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>Dashboard Generator</h1>

        <div className="flex items-center">
        <button
          onClick={resetDashboard}
          className="px-3 py-1 rounded text-sm mr-3 reset-button"
          title="Reset Dashboard"
        >
          <FiRefreshCw className="mr-2" />
          Reset
        </button>


          <button
            onClick={toggleDarkMode}
            className="ml-3 px-3 py-1 rounded-full text-white"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
        </div>
      
      <div className="flex items-center gap-4">
        {/* Theme selector */}
        <div className="theme-selector">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`theme-option ${theme === t.id ? 'active' : ''} mr-3`}
              style={{ backgroundColor: t.color }}
              onClick={() => setTheme(t.id)}
              title={t.name}
              aria-label={`Set ${t.name} theme`}
            />
          ))}
        </div>
        
        

      </div>
    </div>
  );
};

export default Header;