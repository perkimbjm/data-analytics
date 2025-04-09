// src/context/ChartSettingsContext.jsx
import { createContext, useContext, useState } from 'react';

// Default settings
const defaultSettings = {
  chartType: 'bar',
  xAxis: '',
  yAxis: '',
  autoGroup: false,
  aggregation: 'sum',
  limit: 10,
  colorMode: 'auto'
};

// Export langsung contextnya
export const ChartSettingsContext = createContext();

export const ChartSettingsProvider = ({ children }) => {
  const [chartSettings, setChartSettings] = useState(defaultSettings);
  
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  const updateChartSettings = (newSettings) => {
    setChartSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    // Trigger chart update
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <ChartSettingsContext.Provider value={{ 
      chartSettings, 
      updateChartSettings,
      updateTrigger,
      setUpdateTrigger
    }}>
      {children}
    </ChartSettingsContext.Provider>
  );
};

export const useChartSettings = () => useContext(ChartSettingsContext);