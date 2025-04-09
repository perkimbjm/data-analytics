// src/components/charts/ScoreboardCards.jsx
import { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useChartSettings } from '../../context/ChartSettingsContext';

const ScoreboardCards = () => {
  const { displayData } = useData();
  const { chartSettings } = useChartSettings();
  const [scoreboardData, setScoreboardData] = useState([]);
  
  useEffect(() => {
    if (!displayData || !chartSettings.xAxis || !chartSettings.yAxis) return;
    
    // Process data for scoreboard
    const xAxis = chartSettings.xAxis;
    const yAxis = chartSettings.yAxis;
    const limit = Math.min(parseInt(chartSettings.limit) || 20, 5);
    
    // Sort data by y-axis value in descending order
    const sorted = [...displayData].sort((a, b) => {
      const valueA = Number(a[yAxis] || 0);
      const valueB = Number(b[yAxis] || 0);
      return valueB - valueA; // Descending order
    });
    
    // Take top N items
    const topItems = sorted.slice(0, limit);
    
    setScoreboardData(topItems);
  }, [displayData, chartSettings]);
  
  // Format display values
  const formatValue = (value) => {
    if (typeof value === 'number') {
      // Format numbers with thousands separators
      return value.toLocaleString(undefined, {
        maximumFractionDigits: 2
      });
    }
    return value;
  };
  
  // Get color for rank
  // Get medal for top ranks
  const getRankMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  return (
    <div className="overflow-y">
      {scoreboardData.map((item, index) => (
        <div 
          key={index}
          className={`scoreboard-card border h-full overflow-hidden`}
        >
          <div className={`text-3xl font-bold`}>
            {getRankMedal(index) && (
              <span className="text-4xl mr-2">{getRankMedal(index)}</span>
            )}
            {formatValue(item[chartSettings.yAxis])}
          </div>
          
          <div className="text-xs opacity-70 mb-1">
            {chartSettings.yAxis}
          </div>
          
          <div className="text-sm font-medium truncate" title={String(item[chartSettings.xAxis])}>
            {item[chartSettings.xAxis]}
          </div>
        </div>
      ))}
      
      {scoreboardData.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-400">
          No data available for scoreboard
        </div>
      )}
    </div>
  );
};

export default ScoreboardCards;