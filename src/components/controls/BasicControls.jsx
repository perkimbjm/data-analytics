// src/components/controls/BasicControls.jsx
// Basic chart configuration controls including:
// - Chart type selection
// - Axis mapping
// - Aggregation options
// - Visual customization

import { useData } from '../../context/DataContext';
import { useState, useEffect } from 'react';

const BasicControls = ({ config, updateConfig, updateScoreboardConfig }) => {
  const { parsedData } = useData();
  const [headers, setHeaders] = useState([]);
  
  // Extract column headers on data change
  useEffect(() => {
    if (parsedData && parsedData.length > 0) {
      setHeaders(Object.keys(parsedData[0]));
    }
  }, [parsedData]);
  
  // Toggle aggregation control visibility
  const showAggregationControl = config.autoGroup;
  
  // Determine if scoreboard controls should be shown
  const showScoreboardControls = config.chartType === 'scoreboard';
  
  // Chart types available
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'doughnut', label: 'Doughnut Chart' },
    { value: 'radar', label: 'Radar Chart' },
    { value: 'polarArea', label: 'Polar Area Chart' },
    { value: 'scatter', label: 'Scatter Plot' },    
    { value: 'scoreboard', label: 'Scoreboard' }
  ];
  
  // Aggregation methods
  const aggregationMethods = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'unique', label: 'Unique Count' }
  ];
  
  // Color modes
  const colorModes = [
    { value: 'auto', label: 'Auto (based on categories)' },
    { value: 'theme', label: 'Theme Colors' },
    { value: 'rainbow', label: 'Rainbow' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'cool', label: 'Cool Colors' },
    { value: 'warm', label: 'Warm Colors' }
  ];
  
  // Handle chart type change
  const handleChartTypeChange = (e) => {
    const newChartType = e.target.value;
    updateConfig({ chartType: newChartType });
  };

  return (
    <div className="space-y-4">
      {/* Chart Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Chart Type
        </label>
        <select
          value={config.chartType}
          onChange={handleChartTypeChange}
          className="input-field"
        >
          {chartTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Standard Chart Controls (hidden for scoreboard) */}
      {!showScoreboardControls && (
        <>
          {/* X-Axis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              X-Axis (Categories)
            </label>
            <select
              value={config.xAxis}
              onChange={(e) => updateConfig({ xAxis: e.target.value })}
              className="input-field"
            >
              {headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
          
          {/* Auto Group Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-group"
              checked={config.autoGroup}
              onChange={(e) => updateConfig({ autoGroup: e.target.checked })}
              className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <label htmlFor="auto-group" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Auto-group categorical data
            </label>
          </div>
          
          {/* Y-Axis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Y-Axis (Values)
            </label>
            <select
              value={config.yAxis}
              onChange={(e) => updateConfig({ yAxis: e.target.value })}
              className="input-field"
            >
              {headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
          
          {/* Aggregation Method (shown when auto-group is enabled) */}
          {showAggregationControl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aggregation Method
              </label>
              <select
                value={config.aggregation}
                onChange={(e) => updateConfig({ aggregation: e.target.value })}
                className="input-field"
              >
                {aggregationMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Data Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Limit
            </label>
            <input
              type="number"
              min="1"
              value={config.limit}
              onChange={(e) => updateConfig({ limit: parseInt(e.target.value) || 10 })}
              className="input-field"
            />
          </div>
        </>
      )}
      
      {/* Scoreboard Controls */}
      {showScoreboardControls && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold">Scoreboard Settings</h3>
          
          {/* Group By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group By
            </label>
            <select
              value={config.scoreboardConfig.groupBy}
              onChange={(e) => updateScoreboardConfig({ groupBy: e.target.value })}
              className="input-field"
            >
              {headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
          
          {/* Aggregate Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aggregate Column
            </label>
            <select
              value={config.scoreboardConfig.valueColumn}
              onChange={(e) => updateScoreboardConfig({ valueColumn: e.target.value })}
              className="input-field"
            >
              {headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
          
          {/* Aggregation Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aggregation Method
            </label>
            <select
              value={config.scoreboardConfig.aggregation}
              onChange={(e) => updateScoreboardConfig({ aggregation: e.target.value })}
              className="input-field"
            >
              {aggregationMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort Order
            </label>
            <select
              value={config.scoreboardConfig.sortOrder}
              onChange={(e) => updateScoreboardConfig({ sortOrder: e.target.value })}
              className="input-field"
            >
              <option value="desc">Highest to Lowest</option>
              <option value="asc">Lowest to Highest</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Color Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color Mode
        </label>
        <select
          value={config.colorMode}
          onChange={(e) => updateConfig({ colorMode: e.target.value })}
          className="input-field"
        >
          {colorModes.map(mode => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BasicControls;