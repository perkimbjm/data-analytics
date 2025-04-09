// Tambahkan di FullscreenButton.jsx
import { useState, useEffect } from 'react';
import { FiMaximize, FiMinimize } from 'react-icons/fi';

const FullscreenButton = ({ targetRef, title }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, []);
    
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (targetRef.current.requestFullscreen) {
          targetRef.current.requestFullscreen();
        } else if (targetRef.current.webkitRequestFullscreen) {
          targetRef.current.webkitRequestFullscreen();
        } else if (targetRef.current.msRequestFullscreen) {
          targetRef.current.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };
  
    return (
      <button 
        className="fullscreen-button" 
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <FiMinimize /> : <FiMaximize />}
      </button>
    );
  };
  
  export default FullscreenButton;