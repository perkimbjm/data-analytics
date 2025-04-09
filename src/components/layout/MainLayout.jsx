// src/components/layout/MainLayout.jsx
// Main layout component that structures the application
// Includes header, sidebar (if needed), and main content area
// Handles responsive design for mobile and desktop

import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import Header from './Header';
import { useTheme } from '../../context/ThemeContext';


const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode } = useTheme();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex-column min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <Header />
        
        {/* Mobile menu button - only shows on small screens */}
        <div className="lg:hidden fixed top-4 right-4 z-20">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? 
              <FiX className="w-6 h-6 text-gray-800 dark:text-gray-200" /> : 
              <FiMenu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            }
          </button>
        </div>
        
        <div className="flex flex-1">
          {/* Sidebar - for larger applications that need it */}
          {/* You can uncomment this if your app requires a sidebar navigation */}
          {/*
          <aside className={`
            fixed lg:sticky top-0 left-0 z-10
            w-64 h-screen lg:h-auto
            transition-transform duration-300 ease-in-out
            bg-white dark:bg-gray-800 shadow-md
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="p-4 h-full overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">Navigation</h2>
              <nav className="space-y-2">
                <a href="#" className="block py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  Dashboard
                </a>
                <a href="#" className="block py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  Settings
                </a>
              </nav>
            </div>
          </aside>
          */}
          
          {/* Main content area */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="container mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              CSV/XLSX Dashboard Generator &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
        
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MainLayout;