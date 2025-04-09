// src/components/table/DataTable.jsx

import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import TableHeader from './TableHeader';
import Pagination from './Pagination';
import { FiArrowDown, FiArrowUp, FiRefreshCw } from 'react-icons/fi';

const DataTable = ({ onRowClick }) => {
  const { 
    displayData, 
    pagination,
    sorting,
    setSorting,
    setFilters,
    filters = {}
  } = useData();
  
  const { currentPage, rowsPerPage } = pagination;
  
  // Calculate which slice of data to show based on pagination
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, displayData?.length || 0);
  const paginatedData = displayData?.slice(startIdx, endIdx) || [];
  
  // Get column headers from data
  const headers = displayData && displayData.length > 0 
    ? Object.keys(displayData[0]) 
    : [];
  
  // Handle row click if needed
  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };
  
  // Format cell value based on data type
  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Format date strings
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Format numbers with thousands separators
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    // Format booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // For all other types, convert to string
    return String(value);
  };
  
  // Return a class for the cell based on data type
  const getCellClass = (value) => {
    if (value === null || value === undefined) {
      return 'text-gray-400 italic';
    }
    
    if (typeof value === 'number') {
      return 'text-right font-mono';
    }
    
    if (typeof value === 'boolean') {
      return 'text-center';
    }
    
    return '';
  };

  // Handle reset all filters
  const handleResetFilters = () => {
    setFilters({});
  };
  
  // Tambahkan console.log untuk debugging
  console.log('Current filters:', filters);
  
  // Perbaiki pengecekan hasActiveFilters
  const hasActiveFilters = filters && typeof filters === 'object' && Object.keys(filters).length > 0;

  return (
    <div className="w-full overflow-x-auto">
      {/* Tambahkan console.log untuk debugging */}
      {console.log('hasActiveFilters:', hasActiveFilters)}
      
      {hasActiveFilters && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Reset Semua Filter</span>
          </button>
        </div>
      )}
      
      <table className="data-table">
        <TableHeader
          headers={headers}
          sorting={sorting}
          onSort={setSorting}
          filters={filters}      // pastikan ini diteruskan ke TableHeader
          setFilters={setFilters}
        />
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td 
                colSpan={headers.length || 1} 
                className="text-center py-10 text-gray-500 dark:text-gray-400"
              >
                No data available
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                onClick={() => handleRowClick(row)}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                  ${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                `}
              >
                {headers.map((header) => (
                  <td 
                    key={`${rowIndex}-${header}`}
                    className={getCellClass(row[header])}
                  >
                    {formatCellValue(row[header])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      <Pagination />
    </div>
  );
};

export default DataTable;