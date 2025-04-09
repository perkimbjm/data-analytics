// src/components/analytics/NormalityTestCard.jsx
import { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { FiBarChart2, FiCheck, FiAlertCircle } from 'react-icons/fi';
import NormalityPlots from './NormalityPlots';
import { performNormalityTest, calculateQQPlotData } from '../../utils/statisticsUtils';

const NormalityTestCard = () => {
  const { parsedData } = useData();
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [testType, setTestType] = useState('shapiro-wilk');
  const [significanceLevel, setSignificanceLevel] = useState(0.05);
  const [dataType, setDataType] = useState('continuous');
  const [columnData, setColumnData] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState(null);
  const [qqPlotData, setQQPlotData] = useState(null);
  
  // Refs for plot containers
  const histogramRef = useRef(null);
  const qqPlotRef = useRef(null);
  
  // Get available numeric columns when data changes
  useEffect(() => {
    if (!parsedData || parsedData.length === 0) return;
    
    // Identify numeric columns
    const columns = Object.keys(parsedData[0]);
    const numericCols = columns.filter(col => {
      const values = parsedData
        .map(row => row[col])
        .filter(val => val !== null && val !== undefined && val !== '');
      
      // Check if at least 80% of values are numeric
      const numericCount = values.filter(val => !isNaN(Number(val))).length;
      return numericCount / values.length >= 0.8;
    });
    
    setAvailableColumns(numericCols);
    
    // Set default column if none selected
    if (numericCols.length > 0 && !selectedColumn) {
      setSelectedColumn(numericCols[0]);
    }
  }, [parsedData, selectedColumn]);
  
  // Get column data and auto-detect data type when column changes
  useEffect(() => {
    if (!selectedColumn || !parsedData) return;
    
    // Extract and clean column data
    const data = parsedData
      .map(row => {
        const val = row[selectedColumn];
        return val !== null && val !== undefined && val !== '' ? Number(val) : null;
      })
      .filter(val => val !== null && !isNaN(val));
    
    setColumnData(data);
    
    // Auto-detect if data is continuous or discrete
    const uniqueValues = new Set(data);
    const uniqueRatio = uniqueValues.size / data.length;
    
    // If the ratio of unique values is low, data is likely discrete
    if (uniqueRatio < 0.1 && uniqueValues.size < 20) {
      setDataType('discrete');
    } else {
      setDataType('continuous');
    }
    
    // Reset results when column changes
    setShowResults(false);
    setTestResults(null);
    setQQPlotData(null);
  }, [selectedColumn, parsedData]);
  
  // Run normality test
  const runTest = () => {
    try {
      setError(null);
      
      // Validate inputs
      if (!selectedColumn || columnData.length === 0) {
        throw new Error('Please select a valid numeric column');
      }
      
      if (columnData.length < 3) {
        throw new Error('Not enough data points for normality test (minimum 3 required)');
      }
      
      // Generate QQ Plot data
      const qqData = calculateQQPlotData(columnData);
      setQQPlotData(qqData);
      
      // Perform normality test
      const results = performNormalityTest(columnData, testType, significanceLevel);
      setTestResults(results);
      
      // Show results
      setShowResults(true);
    } catch (err) {
      console.error('Error running normality test:', err);
      setError(err.message);
    }
  };

  return (
    <div className="card normality-test-card">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <FiBarChart2 className="mr-2" />
        Normality Test
      </h2>
      
      <div className="normality-input-section">
        <div className="normality-input-grid">
          {/* Column Selection */}
          <div className="normality-input-group">
            <label htmlFor="column-select" className="normality-label">Data Column</label>
            <select
              id="column-select"
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="normality-select"
            >
              {availableColumns.length === 0 ? (
                <option value="">No numeric columns found</option>
              ) : (
                <>
                  <option value="">Select a column</option>
                  {availableColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </>
              )}
            </select>
          </div>
          
          {/* Test Type */}
          <div className="normality-input-group">
            <label htmlFor="test-type" className="normality-label">Test Type</label>
            <select
              id="test-type"
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="normality-select"
            >
              <option value="shapiro-wilk">Shapiro-Wilk Test (cocok untuk 5 - 30 data)</option>
              <option value="kolmogorov-smirnov">Kolmogorov-Smirnov Test (cocok untuk lebih dari 30 data)</option>
              <option value="anderson-darling">Anderson-Darling Test (cocok untuk yang mengandung data outlier)</option>
            </select>
          </div>
          
          {/* Significance Level */}
          <div className="normality-input-group">
            <label htmlFor="significance" className="normality-label">Significance Level (α) / batas toleransi kesalahan</label>
            <select
              id="significance"
              value={significanceLevel}
              onChange={(e) => setSignificanceLevel(Number(e.target.value))}
              className="normality-select"
            >
              <option value="0.01">0.01 (99% confidence)</option>
              <option value="0.05">0.05 (95% confidence)</option>
              <option value="0.1">0.10 (90% confidence)</option>
            </select>
          </div>
          
          {/* Data Type */}
          <div className="normality-input-group">
            <label htmlFor="data-type" className="normality-label">Data Type</label>
            <select
              id="data-type"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="normality-select"
            >
              <option value="continuous">Kontinu (bisa desimal)</option>
              <option value="discrete">Diskrit</option>
            </select>
            <span className="normality-hint">Auto-detected based on data</span>
          </div>
        </div>
        
        {/* Run Test Button */}
        <button 
          onClick={runTest}
          disabled={!selectedColumn || columnData.length === 0}
          className="normality-run-button"
        >
          Run Normality Test
        </button>
        
        {/* Error Message */}
        {error && (
          <div className="normality-error">
            <FiAlertCircle className="normality-error-icon" />
            <span>{error}</span>
          </div>
        )}
      </div>
      
      {/* Results Section */}
      {showResults && testResults && (
        <div className="normality-results">
          <h3 className="normality-results-title">Test Results</h3>
          
          <div className="normality-results-grid">
            <div className="normality-result-item">
              <span className="normality-result-label">Test Type</span>
              <span className="normality-result-value">{testResults.testName}</span>
            </div>
            
            <div className="normality-result-item">
              <span className="normality-result-label">Test Statistic</span>
              <span className="normality-result-value">{testResults.statistic.toFixed(4)}</span>
            </div>
            
            <div className="normality-result-item">
              <span className="normality-result-label">p-value</span>
              <span className="normality-result-value">
                {testResults.pValue < 0.0001 ? '< 0.0001' : testResults.pValue.toFixed(4)}
              </span>
            </div>
            
            <div className="normality-result-item">
              <span className="normality-result-label">Jumlah Sampel</span>
              <span className="normality-result-value">{columnData.length}</span>
            </div>
            
            <div className="normality-result-item">
              <span className="normality-result-label">Significance Level (α) / Toleransi Kesalahan</span>
              <span className="normality-result-value">{significanceLevel}</span>
            </div>
            
            <div className="normality-result-item">
              <span className="normality-result-label">Kesimpulan</span>
              <span className={`normality-conclusion ${testResults.isNormal ? 'normal' : 'not-normal'}`}>
                {testResults.isNormal ? (
                  <FiCheck className="normality-conclusion-icon" />
                ) : (
                  <FiAlertCircle className="normality-conclusion-icon" />
                )}
                {testResults.conclusion}
              </span>
            </div>
          </div>
          
          {/* Plots */}
          <div className="normality-plots">
            <NormalityPlots 
              data={columnData} 
              qqPlotData={qqPlotData}
              dataType={dataType}
              columnName={selectedColumn}
              isNormal={testResults.isNormal}
              histogramId="normality-histogram"
              qqPlotId="normality-qqplot"
            />
          </div>
          
          {/* Interpretation */}
          <div className="normality-interpretation">
            <h4 className="normality-interpretation-title">Interpretasi</h4>
            <p className="normality-interpretation-text">
              {testResults.interpretation}
            </p>
            
            {!testResults.isNormal && (
              <div className="normality-recommendations">
                <h4 className="normality-recommendations-title">Rekomendasi</h4>
                <ul className="normality-recommendations-list">
                  <li>Pertimbangkan transformasi data (seperti log, sqrt, atau Box-Cox) untuk membuat distribusi data lebih mendekati normal.</li>
                  <li>Periksa apakah ada outlier (nilai yang sangat jauh dari yang lain) yang mungkin bikin distribusi data jadi miring atau aneh.</li>
                  <li>Kalau data memang tidak normal, pertimbangkan menggunakan metode statistik non-parametrik yang tidak terlalu rewel soal bentuk distribusi.</li>
                  <li>Kalau jumlah sampelnya banyak, penyimpangan kecil dari distribusi normal biasanya tidak terlalu jadi masalah.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NormalityTestCard;