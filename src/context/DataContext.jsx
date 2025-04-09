// src/context/DataContext.jsx
import { createContext, useContext, useState, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
  parsedData: null,
  filteredData: null, 
  displayData: null,
  isLoading: false,
  error: null,
  columnFilters: {}, // Definisikan di sini
  searchTerm: '',
  sorting: {
    column: null,
    direction: 'asc'
  },
  pagination: {
    currentPage: 1,
    rowsPerPage: 10,
    totalPages: 1
  }
};

// Reducer function for data operations
function dataReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_PARSED_DATA':
      return { 
        ...state, 
        parsedData: action.payload,
        filteredData: action.payload,
        displayData: action.payload,
        isLoading: false,
        error: null,
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalPages: Math.ceil(action.payload.length / state.pagination.rowsPerPage)
        }
      };
    case 'SET_FILTERED_DATA':
      return { 
        ...state, 
        filteredData: action.payload,
        displayData: action.payload,
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalPages: Math.ceil(action.payload.length / state.pagination.rowsPerPage)
        }
      };
    case 'SET_DISPLAY_DATA':
      return { 
        ...state, 
        displayData: action.payload,
        pagination: {
          ...state.pagination,
          totalPages: Math.ceil(action.payload.length / state.pagination.rowsPerPage)
        }
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, pagination: { ...state.pagination, currentPage: 1 } };
    case 'SET_COLUMN_FILTERS':
      return { ...state, columnFilters: action.payload };
    case 'SET_SORTING':
      return { ...state, sorting: action.payload };
    case 'SET_PAGINATION':
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
    default:
      return state;
  }
}

// Create context
const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({});

  const setLoading = useCallback((isLoading) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setParsedData = useCallback((data) => {
    dispatch({ type: 'SET_PARSED_DATA', payload: data });
  }, []);

  const setFilteredData = useCallback((data) => {
    dispatch({ 
      type: 'SET_FILTERED_DATA', 
      payload: data 
    });
  }, []);

  const setDisplayData = useCallback((data) => {
    dispatch({ type: 'SET_DISPLAY_DATA', payload: data });
  }, []);

  const setSearchTerm = useCallback((term) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const setColumnFilters = useCallback((filters) => {
    dispatch({ type: 'SET_COLUMN_FILTERS', payload: filters });
  }, []);

  const setSorting = useCallback((sortConfig) => {
    dispatch({ type: 'SET_SORTING', payload: sortConfig });
  }, []);

  const setPagination = useCallback((paginationConfig) => {
    dispatch({ type: 'SET_PAGINATION', payload: paginationConfig });
  }, []);

  return (
    <DataContext.Provider value={{ 
      ...state, 
      setLoading,
      setError,
      setParsedData,
      setFilteredData,
      setDisplayData,
      setSearchTerm,
      setColumnFilters,
      setSorting,
      setPagination,
      filters,
      setFilters,
      activeFilter,
      setActiveFilter
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);