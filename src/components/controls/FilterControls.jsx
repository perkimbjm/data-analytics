// src/components/controls/FilterControls.jsx
import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { FiPlus, FiX } from 'react-icons/fi';

const FilterControls = () => {
  const { parsedData, setFilteredData } = useData();
  const [filters, setFilters] = useState([{
    column: '',
    operator: 'eq',
    value: '',
    id: Date.now()
  }]);
  
  // Get column headers from data
  const headers = parsedData && parsedData.length > 0 
    ? Object.keys(parsedData[0]) 
    : [];
  
  // Set initial column value if empty
  useEffect(() => {
    if (headers.length > 0 && filters.some(f => !f.column)) {
      setFilters(prev => prev.map(filter => 
        filter.column ? filter : { ...filter, column: headers[0] }
      ));
    }
  }, [headers]);
  
  const operators = [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'gt', label: 'greater than' },
    { value: 'lt', label: 'less than' },
    { value: 'gte', label: 'greater than or equal' },
    { value: 'lte', label: 'less than or equal' },
    { value: 'contains', label: 'contains' },
    { value: 'starts', label: 'starts with' },
    { value: 'ends', label: 'ends with' }
  ];
  
  const handleFilterChange = (id, field, value) => {
    setFilters(prev => prev.map(filter => 
      filter.id === id ? { ...filter, [field]: value } : filter
    ));
  };
  
  const addFilter = () => {
    setFilters(prev => [
      ...prev, 
      {
        column: headers[0] || '',
        operator: 'eq',
        value: '',
        id: Date.now()
      }
    ]);
  };
  
  const removeFilter = (id) => {
    setFilters(prev => prev.filter(filter => filter.id !== id));
  };
  
  const applyFilters = () => {
    if (!parsedData) return;
    
    // Filter data based on all conditions
    const filtered = parsedData.filter(row => {
      return filters.every(filter => {
        if (!filter.column || filter.value === '') return true;
        
        const value = row[filter.column];
        const filterValue = filter.value;
        
        // Try to convert to number for numeric comparisons
        const numericValue = parseFloat(filterValue);
        const isNumericComparison = !isNaN(numericValue) && typeof value === 'number';
        
        switch (filter.operator) {
          case 'eq':
            return isNumericComparison ? value === numericValue : String(value) === filterValue;
          case 'neq':
            return isNumericComparison ? value !== numericValue : String(value) !== filterValue;
          case 'gt':
            return isNumericComparison && value > numericValue;
          case 'lt':
            return isNumericComparison && value < numericValue;
          case 'gte':
            return isNumericComparison && value >= numericValue;
          case 'lte':
            return isNumericComparison && value <= numericValue;
          case 'contains':
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
          case 'starts':
            return String(value).toLowerCase().startsWith(filterValue.toLowerCase());
          case 'ends':
            return String(value).toLowerCase().endsWith(filterValue.toLowerCase());
          default:
            return true;
        }
      });
    });
    
    setFilteredData(filtered);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Filter Conditions</h3>
        <button 
          onClick={addFilter}
          className="flex items-center text-sm bg-primary text-white px-2 py-1 rounded hover:bg-primary-hover transition-colors"
        >
          <FiPlus className="mr-1" /> Add Filter
        </button>
      </div>
      
      <div className="space-y-3">
        {filters.map(filter => (
          <div key={filter.id} className="flex flex-wrap gap-2 items-center pb-3 border-b border-gray-700">
            <select
              value={filter.column}
              onChange={e => handleFilterChange(filter.id, 'column', e.target.value)}
              className="input-field min-w-[120px] max-w-[150px]"
            >
              {headers.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
            
            <select
              value={filter.operator}
              onChange={e => handleFilterChange(filter.id, 'operator', e.target.value)}
              className="input-field min-w-[120px] max-w-[150px]"
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            
            <input
              type="text"
              value={filter.value}
              onChange={e => handleFilterChange(filter.id, 'value', e.target.value)}
              placeholder="Value"
              className="input-field flex-grow"
            />
            
            <button 
              onClick={() => removeFilter(filter.id)}
              className="text-red-500 hover:text-red-400 p-1"
              title="Remove filter"
            >
              <FiX size={18} />
            </button>
          </div>
        ))}
      </div>
      
      <button 
        onClick={applyFilters}
        className="btn-process mt-4"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterControls;