// src/components/table/TableHeader.jsx
import { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { 
  FiChevronDown, 
  FiChevronUp, 
  FiFilter, 
  FiCheck, 
  FiX,
  FiSearch,
  FiArrowDown,
  FiArrowUp,
  FiMoreVertical,
  FiAlertCircle
} from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import FilterPortal from '../common/FilterPortal';

const TableHeader = ({ headers, visibleColumns }) => {
  const { 
    parsedData, 
    displayData, 
    setDisplayData, 
    setFilteredData, 
    filteredData,
    columnFilters,
    setColumnFilters
  } = useData();
  
  const { showToast } = useToast();
  
  const [activeSort, setActiveSort] = useState({ column: null, direction: null });
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeFilterTab, setActiveFilterTab] = useState('values');
  const [filters, setFilters] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const [conditions, setConditions] = useState({
    type: 'equals',
    value: ''
  });
  
  const filterMenuRef = useRef(null);
  
  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setActiveFilter(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Calculate unique values for all columns
  useEffect(() => {
    if (!parsedData) return;
    
    const result = {};
    
    headers.forEach(header => {
      // Get unique values with counts
      const valueMap = {};
      parsedData.forEach(row => {
        const value = String(row[header] || '');
        valueMap[value] = (valueMap[value] || 0) + 1;
      });
      
      // Sort values alphabetically or numerically
      const values = Object.keys(valueMap);
      if (values.every(v => !isNaN(Number(v)))) {
        // Numeric sort
        values.sort((a, b) => Number(a) - Number(b));
      } else {
        // Alphabetic sort
        values.sort();
      }
      
      result[header] = values.map(value => ({
        value,
        count: valueMap[value],
        selected: true
      }));
    });
    
    // Set unique values only if they have changed
    setUniqueValues(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(result)) {
        return result;
      }
      return prev; // Return previous state if no change
    });
  }, [parsedData, headers]);
  
  // Apply filters when they change
  useEffect(() => {
    if (!parsedData || Object.keys(filters).length === 0) {
      // Reset to original data if no filters
      setFilteredData(parsedData);
      return;
    }
    
    // Apply all active filters
    const filtered = parsedData.filter(row => {
      return Object.entries(filters).every(([column, filter]) => {
        const rowValue = row[column];
        
        if (filter.type === 'values') {
          // Standard value filter
          return filter.values.includes(String(rowValue || ''));
        } else if (filter.type === 'condition') {
          // Condition filter
          const { condition, value } = filter;
          
          // Handle numeric comparisons
          const numericValue = Number(value);
          const rowNumericValue = Number(rowValue);
          const isNumeric = !isNaN(numericValue) && !isNaN(rowNumericValue);
          
          switch (condition) {
            case 'equals':
              return isNumeric 
                ? rowNumericValue === numericValue 
                : String(rowValue) === value;
            case 'not_equals':
              return isNumeric 
                ? rowNumericValue !== numericValue 
                : String(rowValue) !== value;
            case 'greater_than':
              return isNumeric && rowNumericValue > numericValue;
            case 'less_than':
              return isNumeric && rowNumericValue < numericValue;
            case 'greater_than_or_equal':
              return isNumeric && rowNumericValue >= numericValue;
            case 'less_than_or_equal':
              return isNumeric && rowNumericValue <= numericValue;
            case 'contains':
              return String(rowValue).toLowerCase().includes(value.toLowerCase());
            case 'not_contains':
              return !String(rowValue).toLowerCase().includes(value.toLowerCase());
            case 'starts_with':
              return String(rowValue).toLowerCase().startsWith(value.toLowerCase());
            case 'ends_with':
              return String(rowValue).toLowerCase().endsWith(value.toLowerCase());
            case 'empty':
              return rowValue === '' || rowValue === null || rowValue === undefined;
            case 'not_empty':
              return rowValue !== '' && rowValue !== null && rowValue !== undefined;
            default:
              return true;
          }
        }
        
        return true;
      });
    });
    
    setFilteredData(filtered);
    
    // Notify the user about applied filter
    if (filtered.length !== parsedData.length) {
      showToast({
        type: 'info',
        message: `Filter applied: ${filtered.length} of ${parsedData.length} rows match filter criteria`,
        duration: 3000
      });
    }
  }, [filters, parsedData]);
  
  // Apply sort when it changes
  useEffect(() => {
    if (!filteredData || !activeSort.column) {
      return;
    }
    
    const sorted = [...filteredData].sort((a, b) => {
      const valueA = a[activeSort.column];
      const valueB = b[activeSort.column];
      
      // Determine if we're comparing numbers
      const isNumeric = typeof valueA === 'number' && typeof valueB === 'number';
      
      let result;
      if (isNumeric) {
        result = valueA - valueB;
      } else {
        // String comparison
        const strA = String(valueA || '').toLowerCase();
        const strB = String(valueB || '').toLowerCase();
        result = strA.localeCompare(strB);
      }
      
      return activeSort.direction === 'asc' ? result : -result;
    });
    
    setDisplayData(sorted);
    
    // Notify user
    if (activeSort.column) {
      showToast({
        type: 'info',
        message: `Data sorted by ${activeSort.column} (${activeSort.direction === 'asc' ? 'ascending' : 'descending'})`,
        duration: 2000
      });
    }
  }, [activeSort, filteredData]);
  
  const handleSort = (column) => {
    setActiveFilter(null); // Close any open filter
    
    // Toggle sort direction
    if (activeSort.column === column) {
      if (activeSort.direction === 'asc') {
        setActiveSort({ column, direction: 'desc' });
      } else if (activeSort.direction === 'desc') {
        setActiveSort({ column: null, direction: null });
      } else {
        setActiveSort({ column, direction: 'asc' });
      }
    } else {
      setActiveSort({ column, direction: 'asc' });
    }
  };

  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0 });
  
  const toggleFilter = (column, event) => {
    event.stopPropagation();
    
    // Jika akan membuka filter, hitung posisinya
    if (activeFilter !== column) {
      // Get position data
      let rect = event.currentTarget.getBoundingClientRect();
      
      // Calculate best position for filter popup
      let top = rect.bottom;
      let left = Math.max(10, rect.left + window.scrollX - 250); // Adjust for centering

      // Check if we're in fullscreen mode
    if (document.fullscreenElement) {
      // In fullscreen, we need to adjust for the fullscreenElement's position
      top = rect.bottom;
      left = rect.left - 100;
    }
    
     
      setFilterPosition({ top, left });
      setSearchFilter('');
      setActiveFilterTab('values');
      setConditions({ type: 'equals', value: '' });
    }
    
    setActiveFilter(activeFilter === column ? null : column);
  };
  
  const handleFilterToggle = (column, value, isSelected) => {
    setUniqueValues(prev => {
      const newUniqueValues = { ...prev };
      return {
        ...newUniqueValues,
        [column]: newUniqueValues[column].map(item => 
          item.value === value ? { ...item, selected: !isSelected } : item
        )
      };
    });
  };
  
  const toggleSelectAll = (column, selectAll) => {
    setUniqueValues(prev => {
      const newUniqueValues = { ...prev };
      
      // Set all values to selectAll
      newUniqueValues[column] = newUniqueValues[column].map(item => 
        ({ ...item, selected: selectAll })
      );
      
      return newUniqueValues;
    });
  };
  
  const applyValueFilter = (column) => {
    const selectedValues = uniqueValues[column]
      .filter(item => item.selected)
      .map(item => item.value);
    
    if (selectedValues.length === uniqueValues[column].length) {
      // Jika semua nilai dipilih, hapus filter
      const newFilters = { ...filters };
      delete newFilters[column];
      setFilters(newFilters);
      
      // Reset status filter untuk kolom ini
      const newColumnFilters = { ...columnFilters };
      delete newColumnFilters[column];
      setColumnFilters(newColumnFilters);
    } else {
      // Terapkan filter dengan nilai yang dipilih
      setFilters(prev => ({
        ...prev,
        [column]: {
          type: 'values',
          values: selectedValues
        }
      }));
      
      // Set status filter aktif untuk kolom ini
      setColumnFilters(prev => ({
        ...prev,
        [column]: true
      }));
    }
    
    setActiveFilter(null);
  };
  
  const applyConditionFilter = (column) => {
    if (['empty', 'not_empty'].includes(conditions.type) || conditions.value) {
      // Terapkan filter kondisi
      setFilters(prev => ({
        ...prev,
        [column]: {
          type: 'condition',
          condition: conditions.type,
          value: conditions.value
        }
      }));
      
      // Set status filter aktif untuk kolom ini
      setColumnFilters(prev => ({
        ...prev,
        [column]: true
      }));
    }
    
    setActiveFilter(null);
  };
  
  const clearFilter = (column) => {
    // Hapus filter untuk kolom ini
    const newFilters = { ...filters };
    delete newFilters[column];
    setFilters(newFilters);
    
    // Reset status filter untuk kolom ini
    const newColumnFilters = { ...columnFilters };
    delete newColumnFilters[column];
    setColumnFilters(newColumnFilters);
    
    // Reset nilai yang dipilih
    if (uniqueValues[column]) {
      setUniqueValues(prev => ({
        ...prev,
        [column]: prev[column].map(item => ({ ...item, selected: true }))
      }));
    }
    
    // Reset kondisi
    setConditions({
      type: 'equals',
      value: ''
    });
    
    setActiveFilter(null);
  };
  
  // Get all currently selected values for a column
  const getSelectedCount = (column) => {
    if (!uniqueValues[column]) return 0;
    return uniqueValues[column].filter(item => item.selected).length;
  };
  
  // Check if filter is active for a column
  const isFilterActive = (column) => {
    return column in filters;
  };
  
  // Filter unique values based on search term
  const getFilteredUniqueValues = (column) => {
    if (!uniqueValues[column]) return [];
    
    if (!searchFilter) return uniqueValues[column];
    
    return uniqueValues[column].filter(item => 
      item.value.toLowerCase().includes(searchFilter.toLowerCase())
    );
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Functions to handle dragging
const handleMouseDown = (e) => {
  if (e.target.closest('.filter-content') || e.target.closest('button')) {
    return; // Don't start drag if clicking on content or buttons
  }
  
  setIsDragging(true);
  const rect = filterMenuRef.current.getBoundingClientRect();
  setDragOffset({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  });
};

const handleMouseMove = (e) => {
  if (!isDragging) return;
  
  // Calculate new position
  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;
  
  // Get viewport dimensions
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  
  // Get menu dimensions
  const menuWidth = filterMenuRef.current.offsetWidth;
  const menuHeight = filterMenuRef.current.offsetHeight;
  
  // Constrain to viewport
  const constrainedX = Math.min(Math.max(0, x), viewportWidth - menuWidth);
  const constrainedY = Math.min(Math.max(0, y), viewportHeight - menuHeight);
  
  setFilterPosition({
    left: constrainedX,
    top: constrainedY
  });
};

const handleMouseUp = () => {
  setIsDragging(false);
};

// Add event listeners for mouse movement
useEffect(() => {
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  } else {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDragging, dragOffset]);

  return (
    <thead>
      <tr>
        {headers.map((header) =>
        visibleColumns[header] ?
        (
          <th key={header} className="relative">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => handleSort(header)}
            >
              <span className="mr-2">{header}</span>
              
              {/* Sort indicator */}
              {activeSort.column === header && (
                activeSort.direction === 'asc' 
                  ? <FiArrowUp className="size-4" /> 
                  : <FiArrowDown className="size-4" />
              )}
              
              {/* Filter button with indicator */}
              <button 
                className="ml-auto p-1 rounded-full hover:bg-gray-700 relative filter-indicator"
                onClick={(e) => toggleFilter(header, e)}
                aria-label={`Filter ${header}`}
              >
                {columnFilters[header] ? ( // Cek status filter
                  <div className="filter-indicator active">
                    <FiFilter className="w-3.5 h-3.5 text-primary" />
                  </div>
                ) : (
                  <FiMoreVertical className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            
            {/* Filter dropdown */}
            <FilterPortal isOpen={activeFilter === header}>
              <div className="filter-backdrop" onClick={() => setActiveFilter(null)}></div>
              <div 
                ref={filterMenuRef}
                className="filter-menu"
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  top: filterPosition.top + 'px',
                  left: filterPosition.left + 'px'
                }}
              >
                <div className="filter-header">
                  <span className="font-medium">Filter by {header}</span>
                  <button 
                    onClick={() => setActiveFilter(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX />
                  </button>
                </div>
                
                <div className="filter-tabs">
                  <button 
                    className={`filter-tab ${activeFilterTab === 'values' ? 'active' : ''}`}
                    onClick={() => setActiveFilterTab('values')}
                  >
                    Values
                  </button>
                  <button 
                    className={`filter-tab ${activeFilterTab === 'condition' ? 'active' : ''}`}
                    onClick={() => setActiveFilterTab('condition')}
                  >
                    Condition
                  </button>
                </div>
                
                <div className="filter-menu-content">
                  {activeFilterTab === 'values' && (
                    <>
                    <div className="filter-search">
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search values"
                        className="filter-search-input"
                      />
                      <FiSearch className="filter-search-icon" />
                    </div>
                    
                    <div className="filter-header" style={{ padding: '6px 16px' }}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSelectAll(header, true)}
                          className="filter-button filter-button-secondary text-xs"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => toggleSelectAll(header, false)}
                          className="filter-button filter-button-secondary text-xs"
                        >
                          Clear
                        </button>
                      </div>
                      
                      <span className="text-xs text-gray-400">
                        {getSelectedCount(header)}/{uniqueValues[header]?.length || 0} selected
                      </span>
                    </div>
                    
                    <div className="filter-items">
                      {getFilteredUniqueValues(header)?.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                          No matching values
                        </div>
                      ) : (
                        getFilteredUniqueValues(header)?.map((item, index) => (
                          <div 
                            key={index} 
                            className="filter-item"
                            onClick={() => handleFilterToggle(header, item.value, item.selected)}
                          >
                            <div className={`filter-checkbox ${item.selected ? 'checked' : ''}`}>
                              {item.selected && <FiCheck className="w-3 h-3 text-white" />}
                            </div>
                            <span className="filter-label">
                              {item.value === '' ? '(Blank)' : item.value}
                            </span>
                            <span className="filter-count">
                              {item.count}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="filter-actions">
                      <button
                        onClick={() => clearFilter(header)}
                        className="filter-button filter-button-secondary"
                      >
                        Clear Filter
                      </button>
                      <button
                        onClick={() => applyValueFilter(header)}
                        className="filter-button filter-button-primary"
                      >
                        Apply
                      </button>
                    </div>
                  </>
                  )}
                  
                  {activeFilterTab === 'condition' && (
                    <div className="filter-condition">
                    <div className="filter-title">Filter by condition</div>
                    
                    <div className="filter-condition-row">
                      <select 
                        className="input-field"
                        value={conditions.type}
                        onChange={(e) => setConditions(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not equals</option>
                        <option value="greater_than">Greater than</option>
                        <option value="less_than">Less than</option>
                        <option value="greater_than_or_equal">Greater than or equal</option>
                        <option value="less_than_or_equal">Less than or equal</option>
                        <option value="contains">Contains</option>
                        <option value="not_contains">Does not contain</option>
                        <option value="starts_with">Starts with</option>
                        <option value="ends_with">Ends with</option>
                        <option value="empty">Is empty</option>
                        <option value="not_empty">Is not empty</option>
                      </select>
                    </div>
                    
                    {!['empty', 'not_empty'].includes(conditions.type) && (
                      <div className="filter-condition-row">
                        <input 
                          type="text"
                          className="input-field"
                          placeholder="Enter a value"
                          value={conditions.value}
                          onChange={(e) => setConditions(prev => ({ ...prev, value: e.target.value }))}
                        />
                      </div>
                    )}
                    
                    <div className="filter-actions" style={{ marginTop: '12px', paddingLeft: 0, paddingRight: 0 }}>
                      <button
                        onClick={() => clearFilter(header)}
                        className="filter-button filter-button-secondary"
                      >
                        Clear Filter
                      </button>
                      <button
                        onClick={() => applyConditionFilter(header)}
                        className="filter-button filter-button-primary"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </FilterPortal>
  
          </th> ) : null
        )}
      </tr>
    </thead>
  );
};

export default TableHeader;