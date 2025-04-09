// src/context/TableContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

const TableContext = createContext();

export const TableProvider = ({ children }) => {
  const { parsedData, setFilteredData } = useData();
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({});
  
  // Active filters state
  const [activeFilters, setActiveFilters] = useState({});
  
  // Sort state
  const [sortState, setSortState] = useState({ column: null, direction: null });
  
  // Initialize visible columns when data changes
  useEffect(() => {
    if (parsedData && parsedData.length > 0) {
      const headers = Object.keys(parsedData[0]);
      const initialState = {};
      
      headers.forEach(header => {
        // Keep existing state if available, otherwise set to true
        initialState[header] = visibleColumns[header] !== undefined 
          ? visibleColumns[header] 
          : true;
      });
      
      setVisibleColumns(initialState);
    }
  }, [parsedData]);
  
  // Reset all table filters and state
  const resetTable = () => {
    // Reset data to original
    if (parsedData) {
      setFilteredData(parsedData);
    }
    
    // Reset active filters
    setActiveFilters({});
    
    // Reset sorting
    setSortState({ column: null, direction: null });
    
    // Make all columns visible
    if (parsedData && parsedData.length > 0) {
      const headers = Object.keys(parsedData[0]);
      const resetColumns = {};
      
      headers.forEach(header => {
        resetColumns[header] = true;
      });
      
      setVisibleColumns(resetColumns);
    }
    
    return true; // Indicate successful reset
  };
  
  // Toggle column visibility
  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  
  // Set all columns visibility
  const setAllColumnsVisibility = (isVisible) => {
    if (parsedData && parsedData.length > 0) {
      const headers = Object.keys(parsedData[0]);
      const newState = {};
      
      headers.forEach(header => {
        newState[header] = isVisible;
      });
      
      setVisibleColumns(newState);
    }
  };
  
  // Get visible columns
  const getVisibleColumns = () => {
    if (!parsedData || parsedData.length === 0) return [];
    
    const headers = Object.keys(parsedData[0]);
    return headers.filter(header => visibleColumns[header] === true);
  };
  
  return (
    <TableContext.Provider value={{
      visibleColumns,
      toggleColumn,
      setAllColumnsVisibility,
      getVisibleColumns,
      activeFilters,
      setActiveFilters,
      sortState,
      setSortState,
      resetTable
    }}>
      {children}
    </TableContext.Provider>
  );
};

export const useTable = () => useContext(TableContext);