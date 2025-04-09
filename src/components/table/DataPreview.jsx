// src/components/table/DataPreview.jsx
import { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { FiSearch, FiRefreshCw, FiColumns, FiX, FiCheck } from 'react-icons/fi';
import Pagination from './Pagination';
import TableHeader from './TableHeader';
import FullscreenButton from '../common/FullscreenButton';
import { useToast } from '../../context/ToastContext';
import SearchBar from './SearchBar';
import DownloadButton from './DownloadButton';

const DataPreview = () => {
  const { 
    displayData, 
    parsedData,
    pagination,
    setPagination,
    searchTerm,
    setSearchTerm,
    setFilteredData,
    setSorting,
    setActiveFilter,
    setColumnFilters
  } = useData();
  
  const { currentPage, rowsPerPage } = pagination;
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});
  const columnMenuRef = useRef(null);

  // Toggle column visibility
    
  // Filter displayData berdasarkan searchTerm
  const filteredData = displayData?.filter(item => {
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, filteredData.length);
  const paginatedData = filteredData.slice(startIdx, endIdx).map(row => {
    const newRow = {};
    Object.keys(row).forEach(header => {
      if (visibleColumns[header]) {
        newRow[header] = row[header]; // Hanya ambil kolom yang terlihat
      }
    });
    return newRow;
  });
  
  // Get column headers
  const headers = parsedData && parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  
  // Handle row per page change
  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = parseInt(e.target.value);
    setPagination({
      rowsPerPage: newRowsPerPage,
      currentPage: 1,
      totalPages: Math.ceil((filteredData.length || 0) / newRowsPerPage)
    });
  };

  const tableContainerRef = useRef(null);

  const { showToast } = useToast();

  // Function to reset all filters and sorting
  const resetTable = () => {
    // Reset to original data
    setFilteredData(parsedData);
    
    // Reset sorting
    setSorting({ column: null, direction: null });
    
    // Reset search
    setSearchTerm('');
    
    // Reset pagination to first page
    setPagination({
      ...pagination,
      currentPage: 1
    });
    
    // Reset all column filters
    setColumnFilters({});

    // Reset filter indicators
    setActiveFilter(null);

    // Show confirmation toast
    showToast({
      type: 'success',
      message: 'Table has been reset to its original state',
      duration: 3000
    });
  };

  // Initialize visible columns when headers change
  useEffect(() => {
    if (parsedData && parsedData.length > 0) {
      const initialVisibleColumns = Object.keys(parsedData[0]).reduce((acc, header) => {
        acc[header] = true; // Semua kolom terlihat secara default
        return acc;
      }, {});
      setVisibleColumns(initialVisibleColumns);
    }
  }, [parsedData]);

  const toggleColumn = (header) => {
    setVisibleColumns(prev => ({
      ...prev,
      [header]: !prev[header]
    }));
  };
  
  // Get filtered headers (only visible ones)
  const getVisibleHeaders = () => {
    if (!headers.length) return [];
    return headers.filter(header => visibleColumns[header]);
  };
  
  // Select/Deselect all columns
  const selectAllColumns = (selectAll) => {
    const newState = {};
    headers.forEach(header => {
      newState[header] = selectAll;
    });
    setVisibleColumns(newState);
  };
  
  // Get column visibility count
  const getVisibleCount = () => {
    return Object.values(visibleColumns).filter(Boolean).length;
  };
  
  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Data Preview</h2>

      <div className="fullscreen-container" ref={tableContainerRef}>
      <FullscreenButton targetRef={tableContainerRef} />
        
        {/* When in fullscreen mode, add a header */}
        <div className="table-fullscreen-controls">
          <div className="fullscreen-title">Data Table</div>
        </div>
        <div className="controls-container mb-4">
          <div className="search-container">
          <SearchBar 
                value={searchTerm}
                onChange={setSearchTerm}
              />
            <FiSearch className="search-icon" />
          </div>
          
          <div className="flex items-center gap-3">
          <button 
              onClick={resetTable}
              className="reset-button"
              title="Reset all filters and sorting"
            >
              <FiRefreshCw className="icon" />
              <span>Reset</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="column-button"
                title="Show/hide columns"
              >
                <FiColumns />
                <span>Columns</span>
              </button>
              
              {showColumnMenu && (
                <div className="column-menu" ref={columnMenuRef}>
                  <div className="column-menu-header">
                    <span className="column-menu-title">Show/Hide Columns</span>
                    <button 
                      onClick={() => setShowColumnMenu(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <FiX />
                    </button>
                  </div>
                  
                  <div className="column-menu-actions">
                    <button 
                      className="column-menu-action"
                      onClick={() => selectAllColumns(true)}
                    >
                      Select All
                    </button>
                    <button 
                      className="column-menu-action"
                      onClick={() => selectAllColumns(false)}
                    >
                      Deselect All
                    </button>
                    <span className="text-xs text-gray-400 ml-auto">
                      {getVisibleCount()}/{Object.keys(parsedData[0] || {}).length}
                    </span>
                  </div>
                  
                  <div className="column-menu-list">
                  {Object.keys(parsedData[0] || {}).map((header) => (
                    <div 
                      key={header} 
                      className="column-menu-item"
                      onClick={() => toggleColumn(header)}
                    >
                      <div className={`filter-checkbox ${visibleColumns[header] ? 'checked' : ''}`}>
                        {visibleColumns[header] && <FiCheck className="w-2 h-2 text-white" />}
                      </div>
                      <span>{header}</span>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <label className="ml-4 text-sm whitespace-nowrap">Rows:</label>
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="input-field w-20"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1000}>1000</option>
              </select>
            </div>

            <DownloadButton 
              data={filteredData} 
              visibleColumns={getVisibleHeaders()}
              filename="dashboard_data"
            />
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">

            <TableHeader headers={headers} visibleColumns={visibleColumns} />

            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={getVisibleCount()} // Gunakan getVisibleCount untuk colspan
                    className="text-center py-10 text-gray-400"
                  >
                    {searchTerm ? 'No data matches your search' : 'No data available'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.keys(row).map((header) => (
                      visibleColumns[header] && ( // Hanya tampilkan sel jika kolom terlihat
                        <td key={`${rowIndex}-${header}`}>{row[header] !== undefined ? row[header] : ''}</td>
                      )
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination />
        </div>
      </div>
  );
};

export default DataPreview;