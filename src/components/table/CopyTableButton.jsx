// src/components/table/CopyTableButton.jsx
import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const CopyTableButton = ({ data, visibleColumns, label = "Copy Table" }) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  
  const copyToClipboard = async () => {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to copy');
      }
      
      // Filter data to only include visible columns
      let filteredData = data;
      if (visibleColumns && visibleColumns.length > 0) {
        filteredData = data.map(row => {
          const filteredRow = {};
          visibleColumns.forEach(col => {
            filteredRow[col] = row[col];
          });
          return filteredRow;
        });
      }
      
      // Get headers
      const headers = Object.keys(filteredData[0]);
      
      // Create HTML table
      let tableHtml = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">\n';
      
      // Add header row
      tableHtml += '<thead>\n<tr>\n';
      headers.forEach(header => {
        tableHtml += `<th>${header}</th>\n`;
      });
      tableHtml += '</tr>\n</thead>\n<tbody>\n';
      
      // Add data rows
      filteredData.forEach(row => {
        tableHtml += '<tr>\n';
        headers.forEach(header => {
          const value = row[header];
          tableHtml += `<td>${value !== null && value !== undefined ? value : ''}</td>\n`;
        });
        tableHtml += '</tr>\n';
      });
      
      tableHtml += '</tbody>\n</table>';
      
      // Also create plain text version as fallback
      let textTable = '';
      
      // Add header row
      textTable += headers.join('\t') + '\n';
      
      // Add data rows
      filteredData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return value !== null && value !== undefined ? value : '';
        });
        textTable += values.join('\t') + '\n';
      });
      
      // Create clipboard data with both HTML and text
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([tableHtml], { type: 'text/html' }),
        'text/plain': new Blob([textTable], { type: 'text/plain' })
      });
      
      // Copy to clipboard
      await navigator.clipboard.write([clipboardItem]);
      
      // Show success state
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying table:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <button 
      onClick={copyToClipboard} 
      className="copy-button"
      title={error ? error : copied ? "Copied!" : "Copy table to clipboard"}
    >
      {copied ? (
        <>
          <FiCheck className="copy-icon success" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <FiCopy className="copy-icon" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default CopyTableButton;