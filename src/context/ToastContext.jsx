// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const showToast = useCallback(({ type, message, title, duration = 5000 }) => {
    const id = Date.now().toString();
    
    // Add new toast
    setToasts(prev => [...prev, { id, type, message, title, duration }]);
    
    // Remove toast after duration
    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, []);
  
  const removeToast = useCallback(id => {
    setToasts(prev => {
      // Find the toast with this id
      const toast = prev.find(t => t.id === id);
      
      if (toast) {
        // Mark it for animation
        toast.exiting = true;
        
        // Set timer to actually remove it after animation
        setTimeout(() => {
          setToasts(current => current.filter(t => t.id !== id));
        }, 300); // Animation duration
        
        return [...prev];
      }
      return prev;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);