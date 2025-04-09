// src/components/controls/ChartControls.jsx
import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useChartSettings } from '../../context/ChartSettingsContext';
import FilterControls from './FilterControls';
import GroupControls from './GroupByControls';
import CountControls from './CountControls';
import RangeSlider from '../common/RangeSlider';

const ChartControls = () => {
  const { parsedData, setLoading } = useData();
  const { chartSettings, updateChartSettings } = useChartSettings();
  const [activeTab, setActiveTab] = useState('basic');
  
  // Inicialización correcta del estado local - NO usa chartSettings directamente
  const [formSettings, setFormSettings] = useState({
    chartType: 'bar',
    xAxis: '',
    yAxis: '',
    autoGroup: false,
    aggregation: 'sum',
    limit: 10,
    colorMode: 'auto'
  });
  
  // Get column headers from data
  const headers = parsedData && parsedData.length > 0 
    ? Object.keys(parsedData[0]) 
    : [];
  
  // Sincronizar con chartSettings cuando cambia
  useEffect(() => {
    setFormSettings(chartSettings);
  }, [chartSettings]);
  
  // Set default axis values when data changes, pero solo si headers cambia
  useEffect(() => {
    if (headers.length > 0 && (!formSettings.xAxis || !formSettings.yAxis)) {
      const numericColumn = headers.find(h => 
        parsedData && parsedData[0] && typeof parsedData[0][h] === 'number'
      );
      
      const categoricalColumn = headers.find(h => 
        parsedData && parsedData[0] && typeof parsedData[0][h] !== 'number'
      ) || headers[0];
      
      setFormSettings(prev => ({
        ...prev,
        xAxis: prev.xAxis || categoricalColumn || headers[0],
        yAxis: prev.yAxis || numericColumn || headers[0]
      }));
    }
  }, [headers]); // Solo depende de headers, no de parsedData o formSettings
  
  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleUpdateChart = () => {
    setLoading(true);
    
    // Update actual chart settings from form
    updateChartSettings(formSettings);
    
    // Simulate processing time
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };
  
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Dashboard Controls</h2>
      
      {/* Tabs */}
      <div className="tabs-container mb-4">
        <button 
          className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic
        </button>
        <button 
          className={`tab-button ${activeTab === 'filter' ? 'active' : ''}`}
          onClick={() => setActiveTab('filter')}
        >
          Filter
        </button>
        <button 
          className={`tab-button ${activeTab === 'group' ? 'active' : ''}`}
          onClick={() => setActiveTab('group')}
        >
          Group By
        </button>
        <button 
          className={`tab-button ${activeTab === 'count' ? 'active' : ''}`}
          onClick={() => setActiveTab('count')}
        >
          Count
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content mt-4">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <select 
                name="chartType"
                value={formSettings.chartType || ''}
                onChange={handleSettingChange}
                className="input-field"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="doughnut">Doughnut Chart</option>
                <option value="radar">Radar Chart</option>
                <option value="polarArea">Polar Area Chart</option>
                <option value="scoreboard">Scoreboard</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">X-Axis (Categories)</label>
              <select 
                name="xAxis"
                value={formSettings.xAxis || ''}
                onChange={handleSettingChange}
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
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-group"
                name="autoGroup"
                checked={formSettings.autoGroup || false}
                onChange={handleSettingChange}
                className="h-4 w-4 mr-2"
              />
              <label htmlFor="auto-group" className="text-sm">
                Auto-group categorical data
              </label>
            </div>
            
            {formSettings.autoGroup && (
              <div>
                <label className="block text-sm font-medium mb-1">Aggregation Method</label>
                <select 
                  name="aggregation"
                  value={formSettings.aggregation || 'sum'}
                  onChange={handleSettingChange}
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
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Y-Axis (Values)</label>
              <select 
                name="yAxis"
                value={formSettings.yAxis || ''}
                onChange={handleSettingChange}
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
            
            <div className="input-container">
            <RangeSlider
                label="Data Limit"
                min={1}
                max={10000}
                value={formSettings.limit || 10}
                onChange={(value) => handleSettingChange({ 
                  target: { name: 'limit', value, type: 'range' }
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Color Mode</label>
              <select 
                name="colorMode"
                value={formSettings.colorMode || 'auto'}
                onChange={handleSettingChange}
                className="input-field"
              >
                <option value="auto">Auto (based on categories)</option>
                <option value="theme">Theme Colors</option>
                <option value="rainbow">Rainbow</option>
                <option value="pastel">Pastel</option>
                <option value="cool">Cool Colors</option>
                <option value="warm">Warm Colors</option>
              </select>
            </div>
            
            <button 
              className="btn-process mt-4"
              onClick={handleUpdateChart}
            >
              Update Dashboard
            </button>
          </div>
        )}
        
        {/* Other tab content would go here */}
        {activeTab === 'filter' && (
          
            <FilterControls />
          
        )}
        
        {activeTab === 'group' && (
          
            <GroupControls />
          
        )}
        
        {activeTab === 'count' && (
          
            <CountControls />
          
        )}
      </div>
    </div>
  );
};

export default ChartControls;