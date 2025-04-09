// src/components/table/Pagination.jsx
import { useData } from '../../context/DataContext';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = () => {
  const { displayData, pagination, setPagination } = useData();
  const { currentPage, rowsPerPage, totalPages } = pagination;
  
  const startItem = displayData?.length ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * rowsPerPage, displayData?.length || 0);
  
  const handlePageChange = (page) => {
    setPagination({ currentPage: page });
  };
  
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button 
            key={i} 
            onClick={() => handlePageChange(i)}
            className={`page-button ${currentPage === i ? 'active' : ''}`}
          >
            {i}
          </button>
        );
      }
    } else {
      // Always show first page
      pages.push(
        <button 
          key={1} 
          onClick={() => handlePageChange(1)}
          className={`page-button ${currentPage === 1 ? 'active' : ''}`}
        >
          1
        </button>
      );
      
      // Calculate middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, startPage + 2);
      
      if (currentPage > 3) {
        pages.push(<span key="ellipsis1" className="px-1">...</span>);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button 
            key={i} 
            onClick={() => handlePageChange(i)}
            className={`page-button ${currentPage === i ? 'active' : ''}`}
          >
            {i}
          </button>
        );
      }
      
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-1">...</span>);
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(
          <button 
            key={totalPages} 
            onClick={() => handlePageChange(totalPages)}
            className={`page-button ${currentPage === totalPages ? 'active' : ''}`}
          >
            {totalPages}
          </button>
        );
      }
    }
    
    return pages;
  };

  return (
    <div className="pagination">
      <div className="text-sm text-gray-400">
        Showing {startItem} to {endItem} of {displayData?.length || 0} entries
      </div>
      
      <div className="pagination-controls">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="page-button opacity-80"
        >
          Previous
        </button>
        
        <div className="flex">
          {renderPageNumbers()}
        </div>
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || !displayData?.length}
          className="page-button opacity-80"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;