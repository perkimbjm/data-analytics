// src/components/charts/ChartDisplay.jsx
import { useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Chart, registerables } from 'chart.js';
import { FiDownload } from 'react-icons/fi';
import FullscreenButton from '../common/FullscreenButton';

// Register Chart.js components
Chart.register(...registerables);

// Gunakan custom hook untuk mengakses context
import { useChartSettings } from '../../context/ChartSettingsContext';
import ScoreboardCards from './ScoreboardCards';

const ChartDisplay = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);
  const { displayData } = useData();
  
  // Menggunakan custom hook daripada useContext langsung
  const { chartSettings, updateTrigger } = useChartSettings();

  const processDataWithAggregation = (data, settings) => {
    const { xAxis, yAxis, autoGroup, aggregation } = settings;
    
    if (!autoGroup || !data || data.length === 0) {
      return { 
        labels: data.map(item => String(item[xAxis] || '')),
        values: data.map(item => Number(item[yAxis] || 0))
      };
    }
    
    // Group data by X-Axis values
    const groups = {};
    data.forEach(item => {
      const key = String(item[xAxis] || '');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    const labels = Object.keys(groups);
    const values = labels.map(label => {
      const groupData = groups[label];
      const numValues = groupData.map(item => Number(item[yAxis] || 0));
      
      switch (aggregation) {
        case 'sum':
          return numValues.reduce((a, b) => a + b, 0);
        case 'avg':
          return numValues.length ? numValues.reduce((a, b) => a + b, 0) / numValues.length : 0;
        case 'count':
          return groupData.length;
        case 'min':
          return numValues.length ? Math.min(...numValues) : 0;
        case 'max':
          return numValues.length ? Math.max(...numValues) : 0;
        case 'unique':
          return new Set(numValues).size;
        default:
          return numValues.reduce((a, b) => a + b, 0);
      }
    });
    
    // Tambahkan logika untuk scatterplot
    if (settings.chartType === 'scatter') {
      return {
        labels: data.map(item => String(item[xAxis] || '')),
        values: data.map(item => ({
          x: Number(item[xAxis] || 0),
          y: Number(item[yAxis] || 0)
        }))
      };
    }
    
    return { labels, values };
  };
  
  // Resize chart on container size change
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current; // Simpan referensi ke element
    const resizeObserver = new ResizeObserver(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    });
    
    resizeObserver.observe(container);
    
    return () => {
      if (container) { // Periksa apakah container masih ada
        resizeObserver.unobserve(container);
      }
    };
  }, []);
  
  // Update chart when settings change
  useEffect(() => {
    if (!displayData || !chartRef.current || !chartSettings.xAxis || !chartSettings.yAxis) return;
    
    // Clean up previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare data based on settings
    const { chartType, xAxis, yAxis, autoGroup, aggregation, limit, colorMode } = chartSettings;
    
    // Process data according to settings
    let chartData = [...displayData];
    
    // Apply limit for pie charts
    if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
      chartData = chartData.slice(0, parseInt(limit) || 10);
    }
    
    // Process data with grouping and aggregation
    const { labels, values } = processDataWithAggregation(chartData, chartSettings);
    
    // Set chart title based on aggregation
    let titleText = `${yAxis} by ${xAxis}`;
    if (autoGroup && aggregation) {
      titleText = `${aggregation.toUpperCase()} of ${yAxis} by ${xAxis}`;
    }
    
    // Get chart colors based on colorMode
    const colors = getChartColors(colorMode || 'auto', labels.length);
    
    // Create chart
    const ctx = chartRef.current.getContext('2d');
    
    const effectiveChartType = chartType === 'scoreboard' ? 'bar' : chartType;
    const total = values.reduce((sum, value) => sum + (isNaN(value) ? 0 : value), 0);

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#a0a0b0'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#a0a0b0',
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            autoSkipPadding: 4,
            font: {
              size: 10
            }
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#ffffff'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y || context.parsed || 0;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.dataset.label}: ${value.toLocaleString()} (${percentage}%)`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            size: 13
          },
          bodyFont: {
            size: 12
          },
          padding: 10,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        },
        title: {
          display: true,
          text: titleText,
          color: '#ffffff',
          font: {
            size: 16
          }
        }
      }
    };

    // Modify tooltip for pie, doughnut, or polarArea charts
    if (['pie', 'doughnut', 'polarArea'].includes(effectiveChartType)) {
      options.plugins.tooltip.callbacks.label = function(context) {
        const value = context.parsed;
        const label = context.label;
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return `${label}: ${value.toLocaleString()} (${percentage}%)`;
      };
    }

    chartInstance.current = new Chart(ctx, {
      type: effectiveChartType || 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: autoGroup ? `${aggregation} of ${yAxis}` : yAxis,
          data: values,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderWidth: 1
        }]
      },
      options: options
    });
    
  }, [displayData, chartSettings, updateTrigger]);

  const getChartColors = (mode, count) => {
    // Prepare result
    const baseColors = {
      backgroundColor: [],
      borderColor: []
    };
    
    // Generate colors based on mode
    switch (mode) {
      case 'theme':
        // Use the current theme colors
        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        for (let i = 0; i < count; i++) {
          const opacity = 0.3 + (0.7 * i / Math.max(count, 1));
          baseColors.backgroundColor.push(`${themeColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
          baseColors.borderColor.push(themeColor);
        }
        break;
        
      case 'rainbow':
        // Classic rainbow colors
        for (let i = 0; i < count; i++) {
          const hue = i * (360 / count);
          baseColors.backgroundColor.push(`hsla(${hue}, 80%, 60%, 0.7)`);
          baseColors.borderColor.push(`hsl(${hue}, 80%, 50%)`);
        }
        break;
        
      case 'pastel':
        // Soft pastel colors
        for (let i = 0; i < count; i++) {
          const hue = i * (360 / count);
          baseColors.backgroundColor.push(`hsla(${hue}, 70%, 80%, 0.7)`);
          baseColors.borderColor.push(`hsl(${hue}, 70%, 60%)`);
        }
        break;
        
      case 'cool':
        // Cool blues and greens
        for (let i = 0; i < count; i++) {
          const hue = 180 + i * (60 / count); // From 180 (cyan) to 240 (blue)
          baseColors.backgroundColor.push(`hsla(${hue}, 70%, 60%, 0.7)`);
          baseColors.borderColor.push(`hsl(${hue}, 70%, 50%)`);
        }
        break;
        
      case 'warm':
        // Warm reds and yellows
        for (let i = 0; i < count; i++) {
          const hue = i * (60 / count); // From 0 (red) to 60 (yellow)
          baseColors.backgroundColor.push(`hsla(${hue}, 80%, 60%, 0.7)`);
          baseColors.borderColor.push(`hsl(${hue}, 80%, 50%)`);
        }
        break;
        
      case 'auto':
      default:
        // Auto colors - a wide spectrum
        for (let i = 0; i < count; i++) {
          const hue = i * (360 / Math.max(count, 1));
          baseColors.backgroundColor.push(`hsla(${hue}, 75%, 60%, 0.7)`);
          baseColors.borderColor.push(`hsl(${hue}, 75%, 50%)`);
        }
    }
    
    return baseColors;
  };
  
  const exportChart = () => {
    if (!chartRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = chartRef.current.toDataURL('image/png');
    link.click();
  };

  const chartContainerRef = useRef(null);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        
        <button 
          onClick={exportChart}
          className="export-button"
        >
          <FiDownload />
          Export PNG
        </button>
      </div>
      <div className="fullscreen-container" ref={chartContainerRef}>
      <FullscreenButton targetRef={chartContainerRef} />

      <div className="chart-area" ref={containerRef}>
        {chartSettings.chartType === 'scoreboard' ? (
          <ScoreboardCards />
        ) : (
          <canvas ref={chartRef}></canvas>
        )}
      </div>
      </div>
    </div>
  );
};

export default ChartDisplay;