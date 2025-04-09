// src/components/charts/ExportButton.jsx
import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { FiDownload, FiCopy, FiCheck } from 'react-icons/fi';

const ExportButton = ({ chartRef }) => {
  const { displayData } = useData();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Export chart as PNG
  const exportChartAsPNG = () => {
    if (!chartRef || !chartRef.current) return;
    
    try {
      const canvas = chartRef.current;
      const link = document.createElement('a');
      link.download = 'chart-export.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error exporting chart:', error);
      alert('Failed to export chart. Please try again.');
    }
  };
  
  // Export data as CSV
  const exportDataAsCSV = () => {
    if (!displayData || displayData.length === 0) return;
    
    try {
      // Get headers
      const headers = Object.keys(displayData[0]);
      
      // Create CSV content
      const csvRows = [];
      
      // Add header row
      csvRows.push(headers.join(','));
      
      // Add data rows
      displayData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Handle strings with commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        });
        csvRows.push(values.join(','));
      });
      
      // Create CSV string
      const csvString = csvRows.join('\n');
      
      // Create blob and download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'data-export.csv';
      link.click();
      
      setShowDropdown(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };
  
  // Copy data to clipboard
  const copyDataToClipboard = async () => {
    if (!displayData || displayData.length === 0) return;
    
    try {
      // Convert data to JSON string
      const jsonString = JSON.stringify(displayData, null, 2);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(jsonString);
      
      // Show success
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      setShowDropdown(false);
    } catch (error) {
      console.error('Error copying data:', error);
      alert('Failed to copy data. Please try again.');
    }
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="export-button"
      >
        <FiDownload />
        Export
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 bg-[#252642] border border-gray-700 rounded-md shadow-lg z-10 w-40">
          <div className="py-1">
            <button 
              onClick={exportChartAsPNG}
              className="flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-700"
            >
              <FiDownload className="mr-2" />
              Export as PNG
            </button>
            
            <button 
              onClick={exportDataAsCSV}
              className="flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-700"
            >
              <FiDownload className="mr-2" />
              Export as CSV
            </button>
            
            <button 
              onClick={copyDataToClipboard}
              className="flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-700"
            >
              {copied ? (
                <>
                  <FiCheck className="mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <FiCopy className="mr-2" />
                  Copy as JSON
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;