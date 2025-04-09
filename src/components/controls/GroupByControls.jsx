// src/components/controls/GroupControls.jsx
import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useChartSettings } from '../../context/ChartSettingsContext';

const GroupControls = () => {
  const { parsedData, setFilteredData } = useData();
  const { updateChartSettings } = useChartSettings();
  const [groupSettings, setGroupSettings] = useState({
    groupColumn: '',
    aggregateFunction: 'sum',
    aggregateColumn: '',
    sortBy: 'value',
    sortOrder: 'desc'
  });
  
  // Get column headers from data
  const headers = parsedData && parsedData.length > 0 
    ? Object.keys(parsedData[0]) 
    : [];
  
  // Get numeric columns for aggregation
  const numericColumns = parsedData && parsedData.length > 0 
    ? headers.filter(header => typeof parsedData[0][header] === 'number')
    : [];
  
  // Set initial values when data is loaded
  useEffect(() => {
    if (headers.length > 0 && !groupSettings.groupColumn) {
      const defaultGroupColumn = headers.find(h => typeof parsedData[0][h] !== 'number') || headers[0];
      const defaultAggregateColumn = numericColumns[0] || headers[0];
      
      setGroupSettings(prev => ({
        ...prev,
        groupColumn: defaultGroupColumn,
        aggregateColumn: defaultAggregateColumn
      }));
    }
  }, [headers, numericColumns]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setGroupSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyGrouping = () => {
    if (!parsedData || parsedData.length === 0) return;
    
    const { groupColumn, aggregateFunction, aggregateColumn, sortBy, sortOrder } = groupSettings;
    
    // Group data
    const groups = {};
    parsedData.forEach(row => {
      const key = String(row[groupColumn] || '');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    });
    
    // Aggregate values for each group
    const result = Object.entries(groups).map(([key, rows]) => {
      const aggregatedValue = calculateAggregation(rows, aggregateFunction, aggregateColumn);
      return {
        [groupColumn]: key,
        [`${aggregateFunction}(${aggregateColumn})`]: aggregatedValue,
        count: rows.length
      };
    });
    
    // Sort results
    const sortField = sortBy === 'value' 
      ? `${aggregateFunction}(${aggregateColumn})`
      : sortBy === 'count' ? 'count' : groupColumn;
    
    result.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      return sortOrder === 'asc' 
        ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
        : (valueA > valueB ? -1 : valueA < valueB ? 1 : 0);
    });
    
    // Update chart settings to match the grouped data
    updateChartSettings({
      xAxis: groupColumn,
      yAxis: `${aggregateFunction}(${aggregateColumn})`,
      autoGroup: false // Since we're pre-grouping the data
    });
    
    // Update filtered data with grouped result
    setFilteredData(result);
  };
  
  const calculateAggregation = (rows, func, column) => {
    const values = rows.map(row => Number(row[column] || 0));
    
    switch (func) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'count':
        return rows.length;
      case 'min':
        return values.length ? Math.min(...values) : 0;
      case 'max':
        return values.length ? Math.max(...values) : 0;
      case 'unique':
        return new Set(values).size;
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Group By Column</label>
        <select
          name="groupColumn"
          value={groupSettings.groupColumn}
          onChange={handleChange}
          className="input-field"
        >
          {headers.map(header => (
            <option key={header} value={header}>{header}</option>
          ))}
          {headers.length === 0 && (
            <option value="" disabled>No data available</option>
          )}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Aggregate Function</label>
        <select
          name="aggregateFunction"
          value={groupSettings.aggregateFunction}
          onChange={handleChange}
          className="input-field"
        >
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="count">Count</option>
          <option value="min">Minimum</option>
          <option value="max">Maximum</option>
          <option value="unique">Unique Count</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Aggregate Column</label>
        <select
          name="aggregateColumn"
          value={groupSettings.aggregateColumn}
          onChange={handleChange}
          className="input-field"
        >
          {headers.map(header => (
            <option key={header} value={header}>{header}</option>
          ))}
          {headers.length === 0 && (
            <option value="" disabled>No data available</option>
          )}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Sort By</label>
        <select
          name="sortBy"
          value={groupSettings.sortBy}
          onChange={handleChange}
          className="input-field"
        >
          <option value="value">Aggregated Value</option>
          <option value="count">Count</option>
          <option value="name">Group Name</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Sort Order</label>
        <select
          name="sortOrder"
          value={groupSettings.sortOrder}
          onChange={handleChange}
          className="input-field"
        >
          <option value="desc">Highest to Lowest</option>
          <option value="asc">Lowest to Highest</option>
        </select>
      </div>
      
      <button 
        onClick={applyGrouping}
        className="btn-process mt-4"
      >
        Apply Grouping
      </button>
    </div>
  );
};

export default GroupControls;