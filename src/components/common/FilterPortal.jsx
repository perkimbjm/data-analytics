// src/components/common/FilterPortal.jsx
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const FilterPortal = ({ children, isOpen }) => {
  const [portalContainer, setPortalContainer] = useState(null);
  const [isInFullscreen, setIsInFullscreen] = useState(false);

  useEffect(() => {
    const checkFullscreen = () => {
      setIsInFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', checkFullscreen);
    checkFullscreen(); // Initial check
    
    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!portalContainer) return;
    
    if (isInFullscreen && document.fullscreenElement) {
      // Move portal into the fullscreen element if we're in fullscreen
      document.fullscreenElement.appendChild(portalContainer);
    } else {
      // Otherwise keep it in the body
      document.body.appendChild(portalContainer);
    }
    
    return () => {
      try {
        // Clean up - this might fail if parent element is already removed
        if (portalContainer.parentElement) {
          portalContainer.parentElement.removeChild(portalContainer);
        }
      } catch (e) {
        console.error("Error removing portal container:", e);
      }
    };
  }, [portalContainer, isInFullscreen]);
  
  useEffect(() => {
    // Create the portal container on mount
    const el = document.createElement('div');
    el.className = 'filter-portal-container';
    document.body.appendChild(el);
    setPortalContainer(el);
    
    // Clean up on unmount
    return () => {
  try {
    if (el.parentElement === document.body) {
      document.body.removeChild(el);
    }
  } catch (error) {
    console.warn("Error saat menghapus portal container:", error);
  }
};
  }, []);

  
  // Don't render anything if the portal container hasn't been created yet
  // or if the filter isn't open
  if (!portalContainer || !isOpen) return null;
  
  return ReactDOM.createPortal(
    <div>
      {children}
    </div>,
    portalContainer
  );
};

export default FilterPortal;