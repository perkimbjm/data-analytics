// src/components/table/ColumnFilter.jsx
import { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { FiSearch, FiCheck } from 'react-icons/fi';

const ColumnFilter = ({ column, onClose }) => {
  const { 
    parsedData, 
    columnFilters, 
    setColumnFilters, 
    setFilteredData 
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState([]);
  const [isNumerical, setIsNumerical] = useState(false);
  const [rangeValues, setRangeValues] = useState({ min: 0, max: 100 });
  const [uniqueValues, setUniqueValues] = useState([]);
  const [minMaxValues, setMinMaxValues] = useState({ min: 0, max: 100 });
  
  const filterRef = useRef(null);
  
  // Detect clicks outside to close the filter popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Initialize filter values based on column data
  useEffect(() => {
    if (!parsedData || !parsedData.length) return;
    
    // Check if column has numerical values
    const hasNumericValues = parsedData.every(row => 
      typeof row[column] === 'number' || 
      (typeof row[column] === 'string' && !isNaN(parseFloat(row[column])))
    );
    
    setIsNumerical(hasNumericValues);
    
    if (hasNumericValues) {
      // Initialize range filter
      const values = parsedData.map(row => {
        if (typeof row[column] === 'number') return row[column];
        return parseFloat(row[column]);
      }).filter(val => !isNaN(val));
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      setMinMaxValues({ min, max });
      setRangeValues({ min, max });
    } else {
      // Initialize value filter
      const values = [...new Set(parsedData.map(row => row[column]))].sort();
      setUniqueValues(values);
      
      // Initialize all values as selected
      setSelectedValues(values);
    }
    
    // Init from existing filter
    if (columnFilters[column]) {
      if (columnFilters[column].type === 'range') {
        setRangeValues(columnFilters[column].values);
      } else if (columnFilters[column].type === 'values') {
        setSelectedValues(columnFilters[column].values);
      }
    }
  }, [parsedData, column, columnFilters]);
  
  const applyFilter = () => {
    let newColumnFilters = { ...columnFilters };
    
    if (isNumerical) {
      // Apply range filter
      newColumnFilters[column] = {
        type: 'range',
        values: rangeValues
      };
    } else {
      // If all values are selected, remove the filter
      if (selectedValues.length === uniqueValues.length) {
        delete newColumnFilters[column];
      } else {
        // Apply values filter
        newColumnFilters[column] = {
          type: 'values',
          values: selectedValues
        };
      }
    }
    
    // Update filters and apply them
    setColumnFilters(newColumnFilters);
    applyAllFilters(newColumnFilters);
    onClose();
  };
  
  const applyAllFilters = (filters) => {
    if (!parsedData) return;
    
    let filtered = [...parsedData];
    
    // Apply all column filters
    Object.entries(filters).forEach(([col, filter]) => {
      if (filter.type === 'range') {
        // Range filter
        filtered = filtered.filter(row => {
          const value = typeof row[col] === 'number' ? 
            row[col] : 
            parseFloat(row[col]);
          
          return value >= filter.values.min && value <= filter.values.max;
        });
      } else if (filter.type === 'values') {
        // Values filter
        filtered = filtered.filter(row => 
          filter.values.includes(row[col])
        );
      }
    });
    
    setFilteredData(filtered);
  };
  
  const handleRangeChange = (type, value) => {
    setRangeValues(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const handleValueToggle = (value) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(prev => prev.filter(v => v !== value));
    } else {
      setSelectedValues(prev => [...prev, value]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedValues.length === uniqueValues.length) {
      setSelectedValues([]);
    } else {
      setSelectedValues([...uniqueValues]);
    }
  };
  
  const filteredUniqueValues = uniqueValues.filter(value => 
    String(value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      ref={filterRef}
      className="absolute top-full left-0 z-10 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg mt-1 p-3"
    >
      {!isNumerical && (
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search values..."
              className="pl-8 pr-3 py-1 text-sm w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border rounded-md"
            />
            <FiSearch className="size-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}
      
      {isNumerical ? (
        // Numeric range filter
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Value Range:</label>
          <div className="flex justify-between text-xs mb-1">
            <span>{rangeValues.min}</span>
            <span>{rangeValues.max}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="range"
              min={minMaxValues.min}
              max={minMaxValues.max}
              value={rangeValues.min}
              onChange={(e) => handleRangeChange('min', parseFloat(e.target.value))}
              className="w-full"
            />
            <input
              type="range"
              min={minMaxValues.min}
              max={minMaxValues.max}
              value={rangeValues.max}
              onChange={(e) => handleRangeChange('max', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      ) : (
        // Value selection filter
        <div className="max-h-40 overflow-y-auto mb-3">
          {filteredUniqueValues.length === 0 ? (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
              No matching values
            </div>
          ) : (
            filteredUniqueValues.map((value, index) => (
              <div key={index} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  id={`value-${index}`}
                  checked={selectedValues.includes(value)}
                  onChange={() => handleValueToggle(value)}
                  className="mr-2"
                />
                <label 
                  htmlFor={`value-${index}`}
                  className="text-xs truncate cursor-pointer"
                >
                  {value}
                </label>
              </div>
            ))
          )}
        </div>
      )}
      
      <div className="flex justify-between">
        {!isNumerical && (
          <button 
            onClick={handleSelectAll}
            className="text-xs text-primary hover:underline flex items-center"
          >
            <FiCheck className="w-3 h-3 mr-1" />
            {selectedValues.length === uniqueValues.length ? 'Unselect All' : 'Select All'}
          </button>
        )}
        <button
          onClick={applyFilter}
          className="ml-auto px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-hover"
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
};

export default ColumnFilter;