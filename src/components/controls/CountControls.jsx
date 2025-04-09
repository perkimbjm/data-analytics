// src/components/controls/CountControls.jsx
import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useChartSettings } from '../../context/ChartSettingsContext';

const CountControls = () => {
  const { parsedData, setFilteredData } = useData();
  const { updateChartSettings } = useChartSettings();
  const [countSettings, setCountSettings] = useState({
    countColumn: '',
    sortOrder: 'desc',
    limitCount: 10
  });
  
  // Get column headers from data
  const headers = parsedData && parsedData.length > 0 
    ? Object.keys(parsedData[0]) 
    : [];
  
  // Set initial column value if empty
  useEffect(() => {
    if (headers.length > 0 && !countSettings.countColumn) {
      const defaultColumn = headers.find(h => typeof parsedData[0][h] !== 'number') || headers[0];
      
      setCountSettings(prev => ({
        ...prev,
        countColumn: defaultColumn
      }));
    }
  }, [headers]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCountSettings(prev => ({
      ...prev,
      [name]: name === 'limitCount' ? parseInt(value) : value
    }));
  };
  
  const applyCount = () => {
    if (!parsedData || parsedData.length === 0) return;
    
    const { countColumn, sortOrder, limitCount } = countSettings;
    
    // Count occurrences of each value
    const counts = {};
    parsedData.forEach(row => {
      const value = String(row[countColumn] || '');
      counts[value] = (counts[value] || 0) + 1;
    });
    
    // Convert to array format
    let result = Object.entries(counts).map(([value, count]) => ({
      [countColumn]: value,
      Count: count
    }));
    
    // Sort results
    if (sortOrder === 'desc') {
      result.sort((a, b) => b.Count - a.Count);
    } else if (sortOrder === 'asc') {
      result.sort((a, b) => a.Count - b.Count);
    } else if (sortOrder === 'alpha') {
      result.sort((a, b) => a[countColumn].localeCompare(b[countColumn]));
    }
    
    // Apply limit
    if (limitCount > 0) {
      result = result.slice(0, limitCount);
    }
    
    // Update chart settings to match the count data
    updateChartSettings({
      xAxis: countColumn,
      yAxis: 'Count',
      autoGroup: false // Since we're pre-counting the data
    });
    
    // Update filtered data with count result
    setFilteredData(result);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Count Values In</label>
        <select
          name="countColumn"
          value={countSettings.countColumn}
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
        <label className="block text-sm font-medium mb-1">Sort Count</label>
        <select
          name="sortOrder"
          value={countSettings.sortOrder}
          onChange={handleChange}
          className="input-field"
        >
          <option value="desc">Highest to Lowest</option>
          <option value="asc">Lowest to Highest</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </div>
      
      <div className="input-container">
        <label className="block text-sm font-medium mb-0">Show Top</label>
        <input
          type="number"
          name="limitCount"
          min="1"
          max="100"
          value={countSettings.limitCount}
          onChange={handleChange}
          className="input-field max-w-[80px]"
        />
      </div>
      
      <button 
        onClick={applyCount}
        className="btn-process mt-4"
      >
        Apply Count
      </button>
    </div>
  );
};

export default CountControls;