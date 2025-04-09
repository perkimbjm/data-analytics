// src/components/analytics/HistogramChart.jsx
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chart.js/auto';

// Register Chart.js components
Chart.register(...registerables);

const HistogramChart = ({ data, columnName, formatNumber }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!data || !data.values || data.values.length === 0 || !chartRef.current) return;
    
    // Clean up previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const values = [...data.values].sort((a, b) => a - b);
    
    // Calculate optimal bin count - use Freedman-Diaconis rule for more robust binning
    const n = values.length;
    const q75 = values[Math.floor(n * 0.75)];
    const q25 = values[Math.floor(n * 0.25)];
    const iqr = q75 - q25;
    
    // Calculate bin width and count
    const h = 2 * iqr * Math.pow(n, -1/3);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Ensure we have a reasonable bin count (between 5 and 50)
    let binCount = Math.ceil(range / (h || 1));
    binCount = Math.max(5, Math.min(50, binCount)); 
    
    const binWidth = range / binCount;
    
    // Initialize bins and count values
    const bins = Array(binCount).fill(0);
    const binStarts = Array(binCount).fill(0).map((_, i) => min + i * binWidth);
    
    // Count values in each bin
    values.forEach(val => {
      // Special case for the maximum value
      if (val === max) {
        bins[binCount - 1]++;
        return;
      }
      
      const binIndex = Math.floor((val - min) / binWidth);
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex]++;
      }
    });
    
    // Create labels for bins
    const labels = binStarts.map((start, i) => {
      const end = i < binCount - 1 ? binStarts[i + 1] : max;
      // Format numbers to be more readable
      const formatFn = formatNumber || (num => num.toLocaleString());
      return `${formatFn(start)} - ${formatFn(end)}`;
    });
    
    // Create histogram
    const ctx = chartRef.current.getContext('2d');
    
    // Calculate normal distribution curve (bell curve) if enough data points
    let normalDistributionData = [];
    if (values.length > 30) { // Only show for sufficiently large datasets
      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      // Calculate normal distribution points for each bin midpoint
      normalDistributionData = binStarts.map((start, i) => {
        const end = i < binCount - 1 ? binStarts[i + 1] : max;
        const x = (start + end) / 2;
        
        // Normal probability density function
        const normPdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                        Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        
        // Scale to match histogram height (area under curve should match histogram)
        return normPdf * values.length * binWidth;
      });
    }
    
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Frequency',
            data: bins,
            backgroundColor: 'rgba(93, 92, 222, 0.7)',
            borderColor: 'rgba(93, 92, 222, 1)',
            borderWidth: 1,
            barPercentage: 0.95,
            categoryPercentage: 1
          },
          // Add normal distribution curve if available
          ...(normalDistributionData.length > 0 ? [{
            type: 'line',
            label: 'Normal Distribution',
            data: normalDistributionData,
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
          }] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: normalDistributionData.length > 0,
            labels: {
              color: '#ffffff'
            }
          },
          title: {
            display: true,
            text: `Distribution of ${columnName}`,
            color: '#ffffff',
            font: {
              size: 14
            }
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                return `Count: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency',
              color: '#a0a0b0'
            },
            ticks: {
              color: '#a0a0b0'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            title: {
              display: true,
              text: columnName,
              color: '#a0a0b0'
            },
            ticks: {
              color: '#a0a0b0',
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, columnName, formatNumber]);

  return (
    <div className="histogram-container">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default HistogramChart;