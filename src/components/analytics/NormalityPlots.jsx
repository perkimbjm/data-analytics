// src/components/analytics/NormalityPlots.jsx
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chart.js/auto';
import CopyChartButton from '../charts/CopyChartButton';

// Register Chart.js components
Chart.register(...registerables);

const NormalityPlots = ({ 
  data, 
  qqPlotData, 
  dataType, 
  columnName, 
  isNormal,
  histogramId,
  qqPlotId
}) => {
  const histogramRef = useRef(null);
  const qqPlotRef = useRef(null);
  const histogramInstance = useRef(null);
  const qqPlotInstance = useRef(null);
  
  // Create histogram with normal curve overlay
  useEffect(() => {
    if (!data || data.length === 0 || !histogramRef.current) return;
    
    // Clean up previous chart
    if (histogramInstance.current) {
      histogramInstance.current.destroy();
    }
    
    // Calculate bins
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Calculate bin count using Sturges' formula (adjust for data type)
    let binCount;
    if (dataType === 'discrete') {
      // For discrete data, use unique values as bins
      const uniqueValues = [...new Set(data)].sort((a, b) => a - b);
      binCount = uniqueValues.length;
    } else {
      // For continuous data, use Sturges' formula
      binCount = Math.ceil(Math.log2(data.length) + 1);
      // Limit bin count to a reasonable range
      binCount = Math.max(5, Math.min(30, binCount));
    }
    
    const binWidth = (max - min) / binCount;
    
    // Create histogram bins
    const bins = Array(binCount).fill(0);
    const binStarts = Array(binCount).fill(0).map((_, i) => min + i * binWidth);
    
    // Count values in each bin
    data.forEach(val => {
      if (val === max) {
        // Edge case for maximum value
        bins[binCount - 1]++;
      } else {
        const binIndex = Math.floor((val - min) / binWidth);
        if (binIndex >= 0 && binIndex < binCount) {
          bins[binIndex]++;
        }
      }
    });
    
    // Create labels for bins
    const labels = binStarts.map((start, i) => {
      const end = i < binCount - 1 ? binStarts[i + 1] : max;
      return `${start.toFixed(1)} - ${end.toFixed(1)}`;
    });
    
    // Calculate normal distribution curve
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );
    
    const normalCurve = binStarts.map(x => {
      // Calculate normal PDF
      const normalPdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                      Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      
      // Scale to match histogram height
      return normalPdf * data.length * binWidth;
    });
    
    // Create histogram chart
    const ctx = histogramRef.current.getContext('2d');
    
    histogramInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Frequency',
            data: bins,
            backgroundColor: isNormal ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)',
            borderColor: isNormal ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            barPercentage: 1,
            categoryPercentage: 1
          },
          {
            type: 'line',
            label: 'Normal Distribution',
            data: normalCurve,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            cubicInterpolationMode: 'monotone',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#a0a0b0'
            }
          },
          title: {
            display: true,
            text: `Histogram of ${columnName} with Normal Curve`,
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
                if (context.datasetIndex === 0) {
                  return `Count: ${context.raw}`;
                } else {
                  return `Normal Density: ${context.raw.toFixed(2)}`;
                }
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
      if (histogramInstance.current) {
        histogramInstance.current.destroy();
      }
    };
  }, [data, dataType, columnName, isNormal]);
  
  // Create Q-Q plot
  useEffect(() => {
    if (!qqPlotData || !qqPlotRef.current) return;
    
    // Clean up previous chart
    if (qqPlotInstance.current) {
      qqPlotInstance.current.destroy();
    }
    
    const { theoretical, sample, linePoints } = qqPlotData;
    
    // Create Q-Q plot
    const ctx = qqPlotRef.current.getContext('2d');
    
    qqPlotInstance.current = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Q-Q Plot Points',
            data: theoretical.map((x, i) => ({ x, y: sample[i] })),
            backgroundColor: isNormal ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)',
            borderColor: isNormal ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            type: 'line',
            label: 'Reference Line',
            data: linePoints.map(point => ({ x: point.x, y: point.y })),
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#a0a0b0'
            }
          },
          title: {
            display: true,
            text: `Q-Q Plot for ${columnName}`,
            color: '#ffffff',
            font: {
              size: 14
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Theoretical: ${context.parsed.x.toFixed(2)}, Sample: ${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Sample Quantiles',
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
              text: 'Theoretical Quantiles',
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
      if (qqPlotInstance.current) {
        qqPlotInstance.current.destroy();
      }
    };
  }, [qqPlotData, columnName, isNormal]);

  return (
    <div className="normality-plots-container">
      <div className="normality-plot-card">
        <div className="normality-plot-header">
          <h4 className="normality-plot-title">Histogram with Normal Curve</h4>
          <CopyChartButton targetId={histogramId} label="Copy Chart" />
        </div>
        <div className="normality-plot-body">
          <canvas ref={histogramRef} id={histogramId}></canvas>
        </div>
      </div>
      
      <div className="normality-plot-card">
        <div className="normality-plot-header">
          <h4 className="normality-plot-title">Q-Q Plot</h4>
          <CopyChartButton targetId={qqPlotId} label="Copy Chart" />
        </div>
        <div className="normality-plot-body">
          <canvas ref={qqPlotRef} id={qqPlotId}></canvas>
        </div>
        <div className="normality-plot-help">
          <p>Jika titik-titik mengikuti garis referensi mengindikasikan distribusi normal</p>
        </div>
      </div>
    </div>
  );
};

export default NormalityPlots;