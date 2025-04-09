// src/components/datamerge/JoinResultPreview.jsx
import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';

const JoinResultPreview = ({ data, title }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  
  // Get column headers
  const headers = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  // Initialize filtered data
  useEffect(() => {
    if (data) {
      setFilteredData(data);
    }
  }, [data]);
  
  // Filter data based on search term
  useEffect(() => {
    if (!data) return;
    
    if (!searchTerm.trim()) {
      setFilteredData(data);
    } else {
      const term = searchTerm.toLowerCase();
      const results = data.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(term)
        )
      );
      setFilteredData(results);
    }
    
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchTerm, data]);
  
  // Calculate pagination
  const totalPages = Math.ceil((filteredData?.length || 0) / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, filteredData?.length || 0);
  const paginatedData = filteredData?.slice(startIdx, endIdx) || [];
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = parseInt(e.target.value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">{title || 'Join Result Preview'}</h2>
      
      <div className="controls-container mb-4">
        <div className="search-container">
          <input
            type="search"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
          />
          <FiSearch className="search-icon" />
        </div>
        
        <div className="flex items-center">
          <label className="mr-2 text-sm whitespace-nowrap">Rows:</label>
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
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={headers.length || 1} 
                  className="text-center py-10 text-gray-400"
                >
                  {searchTerm ? 'No data matches your search' : 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header) => (
                    <td key={`${rowIndex}-${header}`}>{row[header] !== undefined ? row[header] : ''}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {filteredData.length > 0 ? startIdx + 1 : 0} to {endIdx} of {filteredData.length} entries
        </div>
        
        <div className="pagination-controls">
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            «
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            ‹
          </button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
            let pageNum;
            
            // Calculate which page numbers to show
            if (totalPages <= 5) {
              pageNum = idx + 1;
            } else if (currentPage <= 3) {
              pageNum = idx + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + idx;
            } else {
              pageNum = currentPage - 2 + idx;
            }
            
            if (pageNum > 0 && pageNum <= totalPages) {
              return (
                <button 
                  key={pageNum} 
                  onClick={() => handlePageChange(pageNum)} 
                  className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            }
            return null;
          })}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            ›
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinResultPreview;