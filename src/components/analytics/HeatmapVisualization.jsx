// src/components/analytics/HeatmapVisualization.jsx
import { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { FiInfo, FiX, FiSettings, FiCheck } from 'react-icons/fi';

const HeatmapVisualization = () => {
  const { parsedData } = useData();
  const [columns, setColumns] = useState([]);
  const [columnTypes, setColumnTypes] = useState({});
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [correlationMatrix, setCorrelationMatrix] = useState([]);
  const [maxCorrelation, setMaxCorrelation] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [tempSelectedColumns, setTempSelectedColumns] = useState([]);
  
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const modalRef = useRef(null);
  
  // Initialize available columns when data changes
  useEffect(() => {
    if (!parsedData || parsedData.length === 0) return;
    
    const headers = Object.keys(parsedData[0]);
    setColumns(headers);
    
    // Determine column types (numeric or categorical)
    const types = {};
    
    headers.forEach(header => {
      // Check if column is mostly numeric
      const numericCount = parsedData.filter(row => {
        const value = row[header];
        return typeof value === 'number' || 
               (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '');
      }).length;
      
      types[header] = numericCount / parsedData.length >= 0.7 ? 'numeric' : 'categorical';
    });
    
    setColumnTypes(types);
    
    // Auto-select up to 10 columns for initial selection
    const autoSelect = headers.slice(0, Math.min(10, headers.length));
    setTempSelectedColumns(autoSelect);
  }, [parsedData]);
  
  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowColumnModal(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalRef]);
  
  // Calculate correlation matrix when analyze button is clicked
  const analyzeCorrelation = () => {
    if (!parsedData || tempSelectedColumns.length === 0) return;
    
    // Set the selected columns from temp selection
    setSelectedColumns(tempSelectedColumns);
    setShowColumnModal(false);
    
    // Prepare data structure for correlation matrix
    const matrix = [];
    
    // For each pair of columns
    for (let i = 0; i < tempSelectedColumns.length; i++) {
      const row = [];
      
      for (let j = 0; j < tempSelectedColumns.length; j++) {
        if (i === j) {
          // Perfect correlation with self
          row.push({
            value: 1,
            col1: tempSelectedColumns[i],
            col2: tempSelectedColumns[j]
          });
          continue;
        }
        
        const col1 = tempSelectedColumns[i];
        const col2 = tempSelectedColumns[j];
        
        // Calculate correlation based on column types
        const col1Type = columnTypes[col1];
        const col2Type = columnTypes[col2];
        
        let correlation;
        
        if (col1Type === 'numeric' && col2Type === 'numeric') {
          // Pearson correlation for numeric-numeric
          correlation = calculatePearsonCorrelation(col1, col2);
        } else if (col1Type === 'categorical' && col2Type === 'categorical') {
          // Cramer's V for categorical-categorical
          correlation = calculateCramersV(col1, col2);
        } else {
          // Correlation ratio for mixed types
          correlation = calculateCorrelationRatio(
            col1Type === 'numeric' ? col1 : col2, 
            col1Type === 'categorical' ? col1 : col2
          );
        }
        
        row.push({
          value: correlation,
          col1,
          col2
        });
      }
      
      matrix.push(row);
    }
    
    setCorrelationMatrix(matrix);
    
    // Find maximum absolute correlation for color scaling
    let maxCor = 1;
    const allValues = matrix.flat().map(cell => Math.abs(cell?.value || 0));
    if (allValues.length > 0) {
      maxCor = Math.max(...allValues);
    }
    
    setMaxCorrelation(maxCor);
    setShowHeatmap(true);
  };
  
  // Calculate Pearson correlation for numeric columns
  const calculatePearsonCorrelation = (col1, col2) => {
    // Extract numeric values
    const values = parsedData.map(row => ({
      x: Number(row[col1]),
      y: Number(row[col2])
    })).filter(val => !isNaN(val.x) && !isNaN(val.y));
    
    if (values.length < 2) return 0;
    
    // Calculate means
    const meanX = values.reduce((sum, val) => sum + val.x, 0) / values.length;
    const meanY = values.reduce((sum, val) => sum + val.y, 0) / values.length;
    
    // Calculate correlation
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    values.forEach(val => {
      const xDiff = val.x - meanX;
      const yDiff = val.y - meanY;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    });
    
    if (denomX === 0 || denomY === 0) return 0;
    
    return numerator / Math.sqrt(denomX * denomY);
  };
  
  // Calculate Cramer's V for categorical columns
  const calculateCramersV = (col1, col2) => {
    // Count occurrences of each combination
    const contingencyTable = {};
    const col1Values = new Set();
    const col2Values = new Set();
    
    parsedData.forEach(row => {
      const val1 = String(row[col1] || '');
      const val2 = String(row[col2] || '');
      
      col1Values.add(val1);
      col2Values.add(val2);
      
      const key = `${val1}:${val2}`;
      contingencyTable[key] = (contingencyTable[key] || 0) + 1;
    });
    
    // Convert to array form for chi-square calculation
    const table = [];
    const col1Array = Array.from(col1Values);
    const col2Array = Array.from(col2Values);
    
    col1Array.forEach(val1 => {
      const row = [];
      col2Array.forEach(val2 => {
        const key = `${val1}:${val2}`;
        row.push(contingencyTable[key] || 0);
      });
      table.push(row);
    });
    
    // Calculate chi-square
    const n = parsedData.length;
    const r = col1Array.length;
    const k = col2Array.length;
    
    if (r <= 1 || k <= 1) return 0;
    
    let chiSquare = 0;
    
    // Calculate row and column sums
    const rowSums = table.map(row => row.reduce((sum, val) => sum + val, 0));
    const colSums = col2Array.map((_, j) => 
      table.reduce((sum, row) => sum + row[j], 0)
    );
    
    // Calculate chi-square statistic
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < k; j++) {
        const observed = table[i][j];
        const expected = (rowSums[i] * colSums[j]) / n;
        if (expected > 0) {
          chiSquare += Math.pow(observed - expected, 2) / expected;
        }
      }
    }
    
    // Calculate Cramer's V
    const phi = Math.sqrt(chiSquare / n);
    const cramersV = phi / Math.sqrt(Math.min(r - 1, k - 1));
    
    return isNaN(cramersV) ? 0 : cramersV;
  };
  
  // Calculate correlation ratio for mixed numeric-categorical
  const calculateCorrelationRatio = (numericCol, categoricalCol) => {
    // Group numeric values by category
    const valuesByCategory = {};
    
    parsedData.forEach(row => {
      const numericValue = Number(row[numericCol]);
      const category = String(row[categoricalCol] || '');
      
      if (!isNaN(numericValue)) {
        if (!valuesByCategory[category]) {
          valuesByCategory[category] = [];
        }
        valuesByCategory[category].push(numericValue);
      }
    });
    
    // Calculate overall mean
    const allValues = Object.values(valuesByCategory).flat();
    if (allValues.length === 0) return 0;
    
    const overallMean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    
    // Calculate between-group sum of squares
    let betweenSumSquares = 0;
    Object.entries(valuesByCategory).forEach(([_, values]) => {
      if (values.length > 0) {
        const groupMean = values.reduce((sum, val) => sum + val, 0) / values.length;
        betweenSumSquares += values.length * Math.pow(groupMean - overallMean, 2);
      }
    });
    
    // Calculate total sum of squares
    const totalSumSquares = allValues.reduce((sum, val) => 
      sum + Math.pow(val - overallMean, 2), 0
    );
    
    if (totalSumSquares === 0) return 0;
    
    // Correlation ratio is squared eta
    return Math.sqrt(betweenSumSquares / totalSumSquares);
  };
  
  // Draw heatmap when data or canvas changes
  useEffect(() => {
    if (!showHeatmap || !canvasRef.current || correlationMatrix.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    const n = selectedColumns.length;
    
    // Calculate cell size
    const cellSize = Math.min(
      Math.floor(width / (n + 1)), 
      Math.floor(height / (n + 1))
    );
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set text properties
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw column headers (rotated)
    ctx.save();
    for (let j = 0; j < n; j++) {
      const x = (j + 1) * cellSize + cellSize / 2;
      const y = cellSize / 2;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 4); // Rotate text
      ctx.fillStyle = '#a0a0b0';
      
      // Truncate long column names
      const colName = selectedColumns[j];
      const displayName = colName.length > 10 ? 
        colName.substring(0, 8) + '...' : colName;
      
      ctx.fillText(displayName, 0, 0);
      ctx.restore();
    }
    
    // Draw row headers
    for (let i = 0; i < n; i++) {
      const x = cellSize / 2;
      const y = (i + 1) * cellSize + cellSize / 2;
      
      ctx.fillStyle = '#a0a0b0';
      
      // Truncate long column names
      const colName = selectedColumns[i];
      const displayName = colName.length > 10 ? 
        colName.substring(0, 8) + '...' : colName;
      
      ctx.fillText(displayName, x, y);
    }
    
    // Draw heatmap cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = (j + 1) * cellSize;
        const y = (i + 1) * cellSize;
        
        // Make sure we have valid data for this cell
        const cell = correlationMatrix[i] && correlationMatrix[i][j];
        if (!cell) continue;
        
        const correlation = cell.value;
        
        // Get color based on correlation value
        const color = getCorrelationColor(correlation, maxCorrelation);
        
        // Draw cell
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);
        
        // Draw correlation value
        ctx.fillStyle = Math.abs(correlation) > 0.5 ? 'white' : 'black';
        ctx.fillText(correlation.toFixed(2), x + cellSize / 2, y + cellSize / 2);
      }
    }
    
    // Store cell data for tooltips
    canvas.cellData = {
      cellSize,
      matrix: correlationMatrix,
      columns: selectedColumns
    };
  }, [correlationMatrix, selectedColumns, showHeatmap, maxCorrelation]);
  
  // Get color for correlation value
  const getCorrelationColor = (correlation, maxValue) => {
    // Normalize correlation to [-1, 1] range
    const normalized = correlation / Math.max(maxValue, 1);
    
    // Convert to color
    if (normalized < 0) {
      // Negative correlation - blue scale
      const intensity = Math.round(255 * Math.abs(normalized));
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    } else {
      // Positive correlation - red scale
      const intensity = Math.round(255 * normalized);
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    }
  };
  
  // Handle canvas mouse events for tooltips
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    
    if (!canvas || !tooltip || !canvas.cellData) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const { cellSize, matrix, columns } = canvas.cellData;
    
    // Calculate row and column indices
    const col = Math.floor(x / cellSize) - 1;
    const row = Math.floor(y / cellSize) - 1;
    
    // Show tooltip if mouse is over a cell
    if (row >= 0 && row < columns.length && col >= 0 && col < columns.length) {
      const cell = matrix[row] && matrix[row][col];
      
      if (cell) {
        // Set tooltip content
        tooltip.innerHTML = `
          <div class="font-medium">${cell.col1} × ${cell.col2}</div>
          <div class="text-sm">Correlation: ${cell.value.toFixed(4)}</div>
        `;
        
        // Position tooltip
        tooltip.style.left = `${e.clientX - 800}px`;
        tooltip.style.top = `${e.clientY - 50}px`;
        tooltip.style.display = 'block';
      } else {
        tooltip.style.display = 'none';
      }
    } else {
      tooltip.style.display = 'none';
    }
  };
  
  const handleMouseLeave = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  };
  
  // Toggle column selection
  const toggleColumn = (column) => {
    setTempSelectedColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      } else if (prev.length < 10) {
        return [...prev, column];
      }
      return prev;
    });
  };
  
  // Select/deselect all columns
  const selectAllColumns = (select) => {
    if (select) {
      setTempSelectedColumns(columns);
    } else {
      setTempSelectedColumns([]);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Data Correlation Heatmap</h2>
      
      <div className="flex-column">
        <div className="flex-between">
          <div className="text-sm text-gray-400">
            {showHeatmap ? (
              <span>Showing correlation between {selectedColumns.length} columns</span>
            ) : (
              <span></span>
            )}
          </div>
          
          <button 
            onClick={() => setShowColumnModal(true)}
            className="btn-process"
          >
            <FiSettings />
            Select Columns
          </button>
        </div>
        
        {showHeatmap ? (
          <>
            <div className="correlation-box heatmap-container flex items-center gap-2 mb-4 text-sm text-gray-400">
              <FiInfo className="text-primary" />
              <span>
                Intensitas Warna Menunjukkan Kekuatan Korelasi.
                Korelasi bukan hubungan sebab-akibat.
                Korelasi positif berarti berbanding lurus.
                Korelasi negatif berarti berbanding terbalik.
              </span>
            </div>
            
            <div className="relative w-full overflow-auto">
              <canvas 
                ref={canvasRef}
                width={1000}
                height={1000}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="centered"
              />
              
              <div 
                ref={tooltipRef}
                className="tooltip-heatmap"
                style={{ display: 'none' }}
              ></div>
            </div>
            
            <div className="correlation-legend flex justify-center mt-4">
              <div className="flex items-center space-x-2">
                <div className="size-4" style={{ backgroundColor: 'rgb(255, 0, 0)', margin: '0.5rem' }}></div>
                <span className="text-sm">Strong Positive</span>
                
                <div className="size-4 ml-4" style={{ backgroundColor: 'rgb(255, 200, 200)', margin: '0.5rem' }}></div>
                <span className="text-sm">Weak Positive</span>
                
                <div className="size-4 ml-4" style={{ backgroundColor: 'rgb(230, 230, 230)', margin: '0.5rem' }}></div>
                <span className="text-sm">No Correlation</span>
                
                <div className="size-4 ml-4" style={{ backgroundColor: 'rgb(200, 200, 255)', margin: '0.5rem' }}></div>
                <span className="text-sm">Weak Negative</span>
                
                <div className="size-4 ml-4" style={{ backgroundColor: 'rgb(0, 0, 255)', margin: '0.5rem' }}></div>
                <span className="text-sm">Strong Negative</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20 bg-gray-800 rounded-lg">
            <p className="text-gray-400">
              Click "Select Columns" and then "Analyze" to generate the correlation heatmap
            </p>
          </div>
        )}
        
        {/* Column Selection Modal */}
        {showColumnModal && (
          <div className="modal-overlay" onClick={() => setShowColumnModal(false)}>
            <div 
              ref={modalRef}
              className="heatmap-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Columns for Correlation Analysis (maksimal 10)</h3>
                <button 
                  onClick={() => setShowColumnModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="flex-between">
                <div className="text-sm text-gray-400">
                  Selected: {tempSelectedColumns.length} / {columns.length} columns
                </div>
                
                <div className="flex-gap">
                  <button 
                    className="heatmap-select-btn"
                    onClick={() => selectAllColumns(true)}
                  >
                    Select All
                  </button>
                  <button 
                    className="heatmap-select-btn"
                    onClick={() => selectAllColumns(false)}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-grow mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {columns.map(column => (
                    <div 
                      key={column}
                      className="flex items-center"
                    >
                      <input
                        type="checkbox"
                        id={`col-${column}`}
                        checked={tempSelectedColumns.includes(column)}
                        onChange={() => toggleColumn(column)}
                        className="mr-2"
                      />
                      <label 
                        htmlFor={`col-${column}`}
                        className="text-sm truncate cursor-pointer hover:text-primary"
                        title={`${column} (${columnTypes[column]})`}
                      >
                        {column}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowColumnModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={analyzeCorrelation}
                  className="btn-process"
                  disabled={tempSelectedColumns.length < 2}
                >
                  <FiCheck className="mr-1" />
                  Analyze
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeatmapVisualization;