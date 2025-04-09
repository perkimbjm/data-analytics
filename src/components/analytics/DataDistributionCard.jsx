import { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { FiArrowRight } from 'react-icons/fi';
import { Chart, registerables } from 'chart.js';
import 'chart.js/auto';
import BoxPlot from './BoxPlot';
import HistogramChart from './HistogramChart';
import CategoryBarChart from './CategoryBarChart';
import CopyChartButton from '../charts/CopyChartButton';

// Register Chart.js components
Chart.register(...registerables);

const DataDistributionCard = () => {
  const { parsedData } = useData();
  const [selectedColumn, setSelectedColumn] = useState('');
  const [columnType, setColumnType] = useState(''); // 'numeric', 'categorical'
  const [statistics, setStatistics] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const barChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const boxPlotRef = useRef(null);
  const histogramChartRef = useRef(null);

  
  // Available columns from data
  const columns = parsedData && parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  
  // Initialize first column as default
  useEffect(() => {
    if (columns.length > 0 && !selectedColumn) {
      setSelectedColumn(columns[0]);
    }
  }, [columns]);
  
  // Detect column type and calculate statistics when column changes
  useEffect(() => {
    if (!selectedColumn || !parsedData || parsedData.length === 0) return;
    
    // Detect column type
    const isNumeric = checkIfNumeric(selectedColumn);
    setColumnType(isNumeric ? 'numeric' : 'categorical');
    
    // Calculate statistics based on column type
    if (isNumeric) {
      calculateNumericStatistics(selectedColumn);
    } else {
      calculateCategoricalStatistics(selectedColumn);
    }
  }, [selectedColumn, parsedData]);
  
  // Check if column contains numeric data
  const checkIfNumeric = (column) => {
    // Check at least 80% of non-empty values are numeric
    const values = parsedData.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
    const numericCount = values.filter(val => !isNaN(Number(val))).length;
    return numericCount / values.length >= 0.8;
  };
  
  // Calculate statistics for numeric data
  const calculateNumericStatistics = (column) => {
    // Extract numeric values, converting strings to numbers if needed
    const values = parsedData
      .map(row => {
        const val = row[column];
        return val !== null && val !== undefined && val !== '' ? Number(val) : null;
      })
      .filter(val => val !== null && !isNaN(val))
      .sort((a, b) => a - b);
    
    if (values.length === 0) {
      setStatistics({
        totalRows: parsedData.length,
        emptyValues: parsedData.length,
        uniqueValues: 0
      });
      return;
    }
    
    // Calculate basic statistics
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    
    // Calculate median
    const midIndex = Math.floor(values.length / 2);
    const median = values.length % 2 === 0 
      ? (values[midIndex - 1] + values[midIndex]) / 2
      : values[midIndex];
    
    // Calculate mode
    const valueCounts = {};
    values.forEach(val => {
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    });
    
    let mode = null;
    let maxCount = 0;
    Object.entries(valueCounts).forEach(([val, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mode = Number(val);
      }
    });
    
    // Count unique values and empty values
    const uniqueValues = new Set(values).size;
    const emptyValues = parsedData.length - values.length;
    
    // Calculate quartiles for boxplot
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    
    // Calculate outliers (values outside 1.5 * IQR)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(val => val < lowerBound || val > upperBound);
    
    setStatistics({
      totalRows: parsedData.length,
      emptyValues,
      uniqueValues,
      sum,
      mean,
      median,
      mode,
      min,
      max,
      q1,
      q3,
      iqr,
      outliers: outliers.length,
      values // Save values for visualization
    });
    

  };
  
  // Calculate statistics for categorical data
  const calculateCategoricalStatistics = (column) => {
    // Extract values
    const allValues = parsedData.map(row => row[column]);
    const values = allValues.filter(val => val !== null && val !== undefined && val !== '');
    
    // Count occurrences of each value
    const valueCounts = {};
    values.forEach(val => {
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    });
    
    // Find mode (most common value)
    let mode = null;
    let maxCount = 0;
    Object.entries(valueCounts).forEach(([val, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mode = val;
      }
    });
    
    // Count unique values and empty values
    const uniqueValues = Object.keys(valueCounts).length;
    const emptyValues = parsedData.length - values.length;
    
    setStatistics({
      totalRows: parsedData.length,
      emptyValues,
      uniqueValues,
      mode,
      valueCounts // Save counts for visualization
    });
    
    // Create bar chart for categorical data
    createBarChart(valueCounts);
  };
  
  
  // Create bar chart for categorical data
  const createBarChart = (valueCounts) => {
    if (!valueCounts || !barChartRef.current) return;
    
    // Clean up previous chart
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }
    
    // Sort data by count (descending)
    const sortedData = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Limit to top 20 categories
    
    const labels = sortedData.map(([label]) => label);
    const counts = sortedData.map(([, count]) => count);
    
    // Create bar chart
    const ctx = barChartRef.current.getContext('2d');
    
    barChartInstance.current = new Chart(ctx, {
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
            text: `Distribution of ${selectedColumn}`,
            color: '#ffffff',
            font: {
              size: 14
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: '#a0a0b0'
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
  };
  
  const handleAnalyzeClick = () => {
    setShowDetails(true);
  };
  
  const handleColumnChange = (e) => {
    setSelectedColumn(e.target.value);
    setShowDetails(false); // Reset details view when column changes
  };
  
  // Format number for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    
    // Check if it's an integer
    if (Number.isInteger(num)) {
      return num.toLocaleString();
    }
    
    // For float, limit to 2 decimal places
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Data Distribution Analysis</h2>
      
      <div className="flex-column gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-grow">
            <select
              value={selectedColumn}
              onChange={handleColumnChange}
              className="input-field"
            >
              {columns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleAnalyzeClick}
            className="btn-process flex items-center gap-2 whitespace-nowrap"
            disabled={!selectedColumn}
          >
            <span>Analyze</span>
            <FiArrowRight />
          </button>
        </div>
        
        {showDetails && statistics && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-4 mb-6">
              {/* Basic stats (common for both types) */}
              <div className="stat-card">
                <div className="text-sm text-gray-400">Jumlah Baris Data</div>
                <div className="text-xl font-semibold">{formatNumber(statistics.totalRows)}</div>
              </div>
              
              <div className="stat-card">
                <div className="text-sm text-gray-400">Data Bernilai Kosong</div>
                <div className="text-xl font-semibold">{formatNumber(statistics.emptyValues)}</div>
                <div className="text-xs text-gray-500">
                  ({(statistics.emptyValues / statistics.totalRows * 100).toFixed(1)}%)
                </div>
              </div>
              
              <div className="stat-card">
                <div className="text-sm text-gray-400">Nilai yang Unik</div>
                <div className="text-xl font-semibold">{formatNumber(statistics.uniqueValues)}</div>
              </div>
              
              {/* Numeric specific stats */}
              {columnType === 'numeric' && (
                <>
                  <div className="stat-card">
                    <div className="text-sm text-gray-400">Sum</div>
                    <div className="text-xl font-semibold">{formatNumber(statistics.sum)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="text-sm text-gray-400">Mean (Rata-rata)</div>
                    <div className="text-xl font-semibold">{formatNumber(statistics.mean)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="text-sm text-gray-400">Median</div>
                    <div className="text-xl font-semibold">{formatNumber(statistics.median)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="text-sm text-gray-400">Modus</div>
                    <div className="text-xl font-semibold">{formatNumber(statistics.mode)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="text-sm text-gray-400">Minimum</div>
                    <div className="text-xl font-semibold">{formatNumber(statistics.min)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="text-sm text-gray-400">Maximum</div>
                    <div className="text-xl font-semibold">{formatNumber(statistics.max)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="text-sm text-gray-400">Outliers</div>
                    <div className="text-xl font-semibold">{formatNumber(statistics.outliers)}</div>
                  </div>
                </>
              )}
              
              {/* Categorical specific stats */}
              {columnType === 'categorical' && (
                <div className="stat-card">
                  <div className="text-sm text-gray-400">Nilai Mayoritas</div>
                  <div className="text-xl font-semibold truncate" title={statistics.mode}>
                    {statistics.mode}
                  </div>
                  <div className="text-xs text-gray-500">
                    Count: {statistics.valueCounts[statistics.mode]}
                  </div>
                </div>
              )}
            </div>
            
            {/* Visualizations */}
            <div className="flex flex-wrap gap-4 histogram">
              {/* For numeric data: Histogram and Boxplot */}
              {columnType === 'numeric' && (
                <>
                  <div className="visualization-card">
                    <h3 className="text-sm font-medium mb-2">Histogram</h3>
                    <div className="chart-controls">
                      <CopyChartButton chartRef={histogramChartRef} label="Copy Chart" />
                    </div>
                    <div className="h-64">
                      <HistogramChart
                        data={{ values: statistics.values }}
                        columnName={selectedColumn}
                        formatNumber={formatNumber}
                        ref={histogramChartRef}
                      />
                    </div>
                  </div>
                  
                  <div className="visualization-card">
                    <h3 className="text-sm font-medium mb-2">Box Plot</h3>
                    <div className="chart-controls">
                      <CopyChartButton chartRef={boxPlotRef} label="Copy Chart" /> 
                    </div>
                    <div className="h-64 boxplot-container">
                    {columnType === 'numeric' && statistics && statistics.min !== undefined && statistics.q1 !== undefined && (
                        <BoxPlot data={statistics} columnName={selectedColumn}  />
                    )}
                    </div>
                  </div>
                </>
              )}
              
              {/* For categorical data: Bar Chart */}
              {columnType === 'categorical' && (
                <div className="visualization-card col-span-1 xl:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Category Distribution</h3>
                    <div className="chart-controls">
                      <CopyChartButton chartRef={barChartRef} label="Copy Chart" />
                    </div>
                  </div>
                  <div className="h-96 bar-container">
                    <CategoryBarChart 
                      data={statistics} 
                      columnName={selectedColumn} 
                      ref={barChartRef}
                    />
                  </div>                  
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDistributionCard;