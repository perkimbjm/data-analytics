// src/components/common/Toast.jsx
import { useEffect, useState } from 'react';
import { FiX, FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';

const Toast = ({ toast }) => {
  const { removeToast } = useToast();
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState(null);
  
  // Get toast title based on type
  const getTitle = () => {
    switch (toast.type) {
      case 'success':
        return toast.title || 'Success';
      case 'error':
        return toast.title || 'Error';
      case 'warning':
        return toast.title || 'Warning';
      case 'info':
      default:
        return toast.title || 'Information';
    }
  };
  
  // Get icon based on toast type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FiCheck className="size-4" />;
      case 'error':
        return <FiAlertCircle className="size-4" />;
      case 'warning':
        return <FiAlertTriangle className="size-4" />;
      case 'info':
      default:
        return <FiInfo className="size-4" />;
    }
  };
  
  // Setup progress timer
  useEffect(() => {
    if (toast.duration === Infinity) return;
    
    // Calculate interval for smooth progress
    const interval = toast.duration / 100;
    
    // Create interval to update progress
    const id = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, interval);
    
    setIntervalId(id);
    
    return () => {
      clearInterval(id);
    };
  }, [toast.duration]);
  
  // Handle close
  const handleClose = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    removeToast(toast.id);
  };

  return (
    <div className={`toast toast-${toast.type} ${toast.exiting ? 'toast-exit' : ''}`}>
      <div className="toast-header">
        <div className={`toast-title`}>
          <div className={`toast-title-icon ${toast.type}`}>
            {getIcon()}
          </div>
          <span>{getTitle()}</span>
        </div>
        <button className="toast-close" onClick={handleClose}>
          <FiX />
        </button>
      </div>
      
      <div className="toast-body">
        {toast.message}
      </div>
      
      {toast.duration !== Infinity && (
        <div className="toast-progress">
          <div 
            className={`toast-progress-bar ${toast.type}`} 
            style={{ 
              width: `${progress}%`,
              transitionDuration: `${toast.duration / 1000}s`
            }} 
          />
        </div>
      )}
    </div>
  );
};

const ToastContainer = () => {
  const { toasts } = useToast();
  
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;