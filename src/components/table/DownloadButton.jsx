// src/components/table/DownloadButton.jsx
import { useState, useRef, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import ExcelJS from 'exceljs';

const DownloadButton = ({ data, visibleColumns, filename = 'data_export' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter data to only include visible columns
  const getFilteredData = () => {
    if (!visibleColumns || visibleColumns.length === 0 || !data) return data;
    
    return data.map(row => {
      const filteredRow = {};
      visibleColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });
  };

  // Download as CSV
  const downloadCSV = () => {
    try {
      setDownloading(true);
      setError(null);
      
      const filteredData = getFilteredData();
      if (!filteredData || filteredData.length === 0) {
        throw new Error('No data to export');
      }
      
      // Get headers
      const headers = Object.keys(filteredData[0]);
      
      // Create CSV content
      const csvRows = [];
      
      // Add header row
      csvRows.push(headers.join(','));
      
      // Add data rows
      filteredData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          const valueStr = value === null || value === undefined ? '' : String(value);
          // Escape commas and quotes
          return valueStr.includes(',') || valueStr.includes('"') 
            ? `"${valueStr.replace(/"/g, '""')}"` 
            : valueStr;
        });
        csvRows.push(values.join(','));
      });
      
      // Create CSV string
      const csvString = csvRows.join('\n');
      
      // Create downloadable link
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowDropdown(false);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Download as Excel (XLSX)
  const downloadXLSX = async () => {
    try {
      setDownloading(true);
      setError(null);

      const filteredData = getFilteredData();
      if (!filteredData || filteredData.length === 0) {
        throw new Error('No data to export');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      worksheet.columns = visibleColumns.map(col => ({ header: col, key: col }));
      filteredData.forEach(row => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowDropdown(false);
    } catch (err) {
      console.error('Error downloading Excel:', err);
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Download as JSON
  const downloadJSON = () => {
    try {
      setDownloading(true);
      setError(null);
      
      const filteredData = getFilteredData();
      if (!filteredData || filteredData.length === 0) {
        throw new Error('No data to export');
      }
      
      // Create JSON string
      const jsonString = JSON.stringify(filteredData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowDropdown(false);
    } catch (err) {
      console.error('Error downloading JSON:', err);
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button Download */}
      <button
        className="btn-primary"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FiDownload />
        Download
      </button>

      {/* Dropdown */}
      <div className={`dropdown-container ${showDropdown ? 'dropdown-active' : ''}`}>
        <ul className="py-1">
          <li>
            <button className="dropdown-item"  onClick={downloadCSV}>
              .csv CSV File
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={downloadXLSX}>
              .xlsx Excel File
            </button>
          </li>
          <li>
            <button className="dropdown-item"  onClick={downloadJSON}>
              .json JSON File
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DownloadButton;