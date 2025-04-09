import { useState } from 'react';
import { FiCopy } from 'react-icons/fi';

const CopyChartButton = ({ chartRef, label = 'Copy Chart' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!chartRef || !chartRef.current) return;
    
    try {
      const chartCanvas = chartRef.current;
      const imageData = chartCanvas.toDataURL('image/png');
      
      const blob = await (await fetch(imageData)).blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy chart:', error);
    }
  };

  return (
    <button 
      onClick={handleCopy} 
      className="btn-copy flex items-center gap-2 p-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md"
    >
      <FiCopy />
      {copied ? 'Copied!' : label}
    </button>
  );
};

export default CopyChartButton;
