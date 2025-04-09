// src/components/analytics/CategoryBarChart.jsx
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chart.js/auto';

// Register Chart.js components
Chart.register(...registerables);

const CategoryBarChart = ({ data, columnName }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!data || !chartRef.current) return;
    
    // Clean up previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const { valueCounts } = data;
    if (!valueCounts) return;
    
    // Sort data by count (descending)
    const sortedData = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Limit to top 20 categories
    
    const labels = sortedData.map(([label]) => label);
    const counts = sortedData.map(([, count]) => count);
    
    // Create bar chart
    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Count',
          data: counts,
          backgroundColor: 'rgba(93, 92, 222, 0.7)',
          borderColor: 'rgba(93, 92, 222, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `Distribution of ${columnName}`,
            color: '#ffffff',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const pct = data.totalRows > 0 
                  ? ((value / data.totalRows) * 100).toFixed(1) + "%" 
                  : "0%";
                return `Count: ${value} (${pct})`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: '#a0a0b0',
              callback: function(value, index) {
                const label = labels[index];
                // Truncate long labels
                return label.length > 20 ? label.substr(0, 17) + '...' : label;
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count',
              color: '#a0a0b0'
            },
            ticks: {
              color: '#a0a0b0'
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
  }, [data, columnName]);

  return (
    <div className="bar-container">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default CategoryBarChart;