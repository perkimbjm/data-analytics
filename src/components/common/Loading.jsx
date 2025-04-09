// src/components/common/Loading.jsx
import { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';

const Loading = () => {
  const { isLoading } = useData();
  const [loadingText, setLoadingText] = useState('Processing data');
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    if (!isLoading) return;
    
    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    
    // Animated loading text
    const messages = [
      'Processing data',
      'Organizing information',
      'Preparing visualization',
      'Almost there',
      'Crunching numbers',
      'Analyzing patterns',
      'Merging datasets'
    ];
    
    let messageIndex = 0;
    const textInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingText(messages[messageIndex]);
    }, 2000);
    
    return () => {
      clearInterval(dotsInterval);
      clearInterval(textInterval);
    };
  }, [isLoading]);
  
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#252642] rounded-lg p-8 max-w-md w-full flex-column items-center text-center">
        <div className="relative w-20 h-20 mb-5">
          <div className="absolute w-full h-full rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute w-full h-full rounded-full border-4 border-r-primary border-l-primary border-t-transparent border-b-transparent animate-pulse" style={{ animationDuration: '2s' }}></div>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          {loadingText}<span className="w-6 inline-block text-left">{dots}</span>
        </h3>
        
        <p className="text-gray-400">
          Please wait while we prepare your dashboard
        </p>
      </div>
    </div>
  );
};

export default Loading;