// src/components/datamerge/DataJoinMerge.jsx
import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiLink, FiPlus, FiTrash2, FiInfo, FiCheck, FiDatabase, FiRefreshCw } from 'react-icons/fi';
import { parseXLSX, parseCSV } from '../../utils/fileParser';
import { useToast } from '../../context/ToastContext';
import JoinResultPreview from './JoinResultPreview';

const DataJoinMerge = () => {
  const { parsedData, setParsedData, setLoading } = useData();
  const [joinResultData, setJoinResultData] = useState(null);
  const { showToast } = useToast();
  
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(0);
  const [joinConfig, setJoinConfig] = useState({
    leftDataset: 0,
    rightDataset: -1,
    leftKey: '',
    rightKey: '',
    joinType: 'inner',
    suffix: '_right',
  });
  const [mergePreview, setMergePreview] = useState(null);
  const [showMergePreview, setShowMergePreview] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  
  // Add current dataset to datasets list on load
  useEffect(() => {
  if (parsedData && !originalData) {
    setOriginalData(parsedData);
  }
}, [parsedData]);
  
  // Setup dropzone for additional files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => processFiles(acceptedFiles),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });
  
  // Process dropped files
  const processFiles = async (files) => {
    setLoading(true);
    
    try {
      const newDatasets = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (fileExt === 'csv') {
          // For CSV, read as text and parse
          const text = await readFileAsText(file);
          const data = parseCSV(text, ','); // Assuming comma as separator
          
          newDatasets.push({
            name: file.name,
            data
          });
        } else if (['xlsx', 'xls'].includes(fileExt)) {
          // For Excel, use parseXLSX
          const data = await parseXLSX(file);
          
          newDatasets.push({
            name: file.name,
            data
          });
        }
      }
      
      // Add new datasets
      setDatasets(prev => [...prev, ...newDatasets]);
      
      // Update join config with new datasets
      if (newDatasets.length > 0) {
        setJoinConfig(prev => ({
          ...prev,
          rightDataset: datasets.length // Index of first new dataset
        }));
      }
      
      showToast({
        type: 'success',
        message: `Added ${newDatasets.length} new dataset${newDatasets.length !== 1 ? 's' : ''}`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error processing files:', error);
      showToast({
        type: 'error',
        message: `Error processing files: ${error.message}`,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };
  
  // Update join keys when datasets change
  useEffect(() => {
    if (datasets.length >= 2) {
      const leftDataset = datasets[joinConfig.leftDataset];
      const rightDataset = datasets[joinConfig.rightDataset] || datasets[1];
      
      if (leftDataset && leftDataset.data && leftDataset.data.length > 0) {
        // Get column names
        const leftColumns = Object.keys(leftDataset.data[0]);
        setJoinConfig(prev => ({
          ...prev,
          leftKey: prev.leftKey || leftColumns[0] || ''
        }));
      }
      
      if (rightDataset && rightDataset.data && rightDataset.data.length > 0) {
        // Get column names
        const rightColumns = Object.keys(rightDataset.data[0]);
        setJoinConfig(prev => ({
          ...prev,
          rightKey: prev.rightKey || rightColumns[0] || ''
        }));
      }
    }
  }, [datasets, joinConfig.leftDataset, joinConfig.rightDataset]);
  
  // Get columns for a dataset
  const getDatasetColumns = (datasetIndex) => {
    if (datasetIndex < 0 || datasetIndex >= datasets.length) return [];
    
    const dataset = datasets[datasetIndex];
    if (!dataset || !dataset.data || dataset.data.length === 0) return [];
    
    return Object.keys(dataset.data[0]);
  };
  
  // Find matching columns between datasets
  const findMatchingColumns = () => {
    if (joinConfig.leftDataset < 0 || joinConfig.rightDataset < 0) return [];
    
    const leftColumns = getDatasetColumns(joinConfig.leftDataset);
    const rightColumns = getDatasetColumns(joinConfig.rightDataset);
    
    // Find columns with same name
    return leftColumns.filter(col => rightColumns.includes(col));
  };
  
  // Auto-select matching keys
  const autoSelectKeys = () => {
    const matchingColumns = findMatchingColumns();
    
    if (matchingColumns.length > 0) {
      // Prefer ID-like columns (containing 'id', 'code', 'key', etc.)
      const idColumns = matchingColumns.filter(col => 
        col.toLowerCase().includes('id') || 
        col.toLowerCase().includes('code') || 
        col.toLowerCase().includes('key')
      );
      
      const bestMatch = idColumns.length > 0 ? idColumns[0] : matchingColumns[0];
      
      setJoinConfig(prev => ({
        ...prev,
        leftKey: bestMatch,
        rightKey: bestMatch
      }));
      
      showToast({
        type: 'info',
        message: `Auto-selected join key: ${bestMatch}`,
        duration: 3000
      });
    } else {
      showToast({
        type: 'warning',
        message: 'No matching columns found. Please select keys manually.',
        duration: 3000
      });
    }
  };
  
  // Preview join result
  const previewJoin = () => {
    if (!joinConfig.leftKey || !joinConfig.rightKey) {
      showToast({
        type: 'warning',
        message: 'Please select keys for both datasets',
        duration: 3000
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const leftData = datasets[joinConfig.leftDataset]?.data || [];
      const rightData = datasets[joinConfig.rightDataset]?.data || [];
      
      if (leftData.length === 0 || rightData.length === 0) {
        throw new Error('One or both datasets are empty');
      }
      
      // Create a lookup for right dataset
      const rightLookup = {};
      rightData.forEach(row => {
        const keyValue = row[joinConfig.rightKey];
        if (keyValue !== undefined && keyValue !== null) {
          rightLookup[keyValue] = row;
        }
      });
      
      // Perform join
      let result;
      
      switch (joinConfig.joinType) {
        case 'inner':
          // Return only rows with matching keys
          result = leftData
            .filter(leftRow => rightLookup[leftRow[joinConfig.leftKey]])
            .map(leftRow => {
              const rightRow = rightLookup[leftRow[joinConfig.leftKey]];
              return mergeRows(leftRow, rightRow);
            });
          break;
          
        case 'left':
          // Return all rows from left dataset
          result = leftData.map(leftRow => {
            const rightRow = rightLookup[leftRow[joinConfig.leftKey]];
            return rightRow ? mergeRows(leftRow, rightRow) : leftRow;
          });
          break;
          
        case 'right':
          // Return all rows from right dataset
          result = rightData.map(rightRow => {
            const keyValue = rightRow[joinConfig.rightKey];
            const leftRow = leftData.find(row => row[joinConfig.leftKey] === keyValue);
            return leftRow ? mergeRows(leftRow, rightRow) : { ...rightRow };
          });
          break;
          
        case 'full':
          // Return all rows from both datasets
          const leftResult = leftData.map(leftRow => {
            const rightRow = rightLookup[leftRow[joinConfig.leftKey]];
            return rightRow ? mergeRows(leftRow, rightRow) : leftRow;
          });
          
          // Add right rows that don't have a match in left
          const rightOnly = rightData.filter(rightRow => 
            !leftData.some(leftRow => leftRow[joinConfig.leftKey] === rightRow[joinConfig.rightKey])
          );
          
          result = [...leftResult, ...rightOnly];
          break;
          
        default:
          throw new Error(`Unsupported join type: ${joinConfig.joinType}`);
      }
      
      // Generate preview with limited rows
      setMergePreview(result.slice(0, 10));
      setShowMergePreview(true);
      
      showToast({
        type: 'success',
        message: `Join preview generated with ${result.length} rows`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error previewing join:', error);
      showToast({
        type: 'error',
        message: `Error previewing join: ${error.message}`,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Merge two rows with suffix for duplicate columns
  const mergeRows = (leftRow, rightRow) => {
    const result = { ...leftRow };
    
    // Add right columns, with suffix if they already exist in left
    Object.entries(rightRow).forEach(([key, value]) => {
      if (key in result && key !== joinConfig.rightKey) {
        result[`${key}${joinConfig.suffix}`] = value;
      } else {
        result[key] = value;
      }
    });
    
    return result;
  };
  
  // Apply the join and set as main dataset
  const applyJoin = () => {
    if (!mergePreview) {
      previewJoin();
      return;
    }
    
    setLoading(true);
    
    try {
      // Perform the full join again
      const leftData = datasets[joinConfig.leftDataset]?.data || [];
      const rightData = datasets[joinConfig.rightDataset]?.data || [];
      
      // Create a lookup for right dataset
      const rightLookup = {};
      rightData.forEach(row => {
        const keyValue = row[joinConfig.rightKey];
        if (keyValue !== undefined && keyValue !== null) {
          rightLookup[keyValue] = row;
        }
      });
      
      // Perform join
      let result;
      
      switch (joinConfig.joinType) {
        case 'inner':
          result = leftData
            .filter(leftRow => rightLookup[leftRow[joinConfig.leftKey]])
            .map(leftRow => {
              const rightRow = rightLookup[leftRow[joinConfig.leftKey]];
              return mergeRows(leftRow, rightRow);
            });
          break;
          
        case 'left':
          result = leftData.map(leftRow => {
            const rightRow = rightLookup[leftRow[joinConfig.leftKey]];
            return rightRow ? mergeRows(leftRow, rightRow) : leftRow;
          });
          break;
          
        case 'right':
          result = rightData.map(rightRow => {
            const keyValue = rightRow[joinConfig.rightKey];
            const leftRow = leftData.find(row => row[joinConfig.leftKey] === keyValue);
            return leftRow ? mergeRows(leftRow, rightRow) : { ...rightRow };
          });
          break;
          
        case 'full':
          const leftResult = leftData.map(leftRow => {
            const rightRow = rightLookup[leftRow[joinConfig.leftKey]];
            return rightRow ? mergeRows(leftRow, rightRow) : leftRow;
          });
          
          const rightOnly = rightData.filter(rightRow => 
            !leftData.some(leftRow => leftRow[joinConfig.leftKey] === rightRow[joinConfig.rightKey])
          );
          
          result = [...leftResult, ...rightOnly];
          break;
      }
      
      // Update the current dataset
      setParsedData(result);

      // Set the join result data for preview
      setJoinResultData(result);
      
      // Also update the datasets list
      const newDatasetName = `Joined: ${datasets[joinConfig.leftDataset]?.name} + ${datasets[joinConfig.rightDataset]?.name}`;
      
      setDatasets(prev => [
        { name: newDatasetName, data: result },
        ...prev
      ]);
      
      setActiveDataset(0);
      setShowMergePreview(false);
      
      showToast({
        type: 'success',
        message: `Join successful! Created new dataset with ${result.length} rows`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error applying join:', error);
      showToast({
        type: 'error',
        message: `Error applying join: ${error.message}`,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Remove a dataset
  const removeDataset = (index) => {
    if (index === 0 && datasets.length === 1) {
      showToast({
        type: 'warning',
        message: "Cannot remove the only dataset",
        duration: 3000
      });
      return;
    }
    
    setDatasets(prev => {
      const newDatasets = prev.filter((_, i) => i !== index);
      
      // Adjust join config if needed
      if (joinConfig.leftDataset === index) {
        setJoinConfig(prev => ({ ...prev, leftDataset: 0 }));
      } else if (joinConfig.leftDataset > index) {
        setJoinConfig(prev => ({ ...prev, leftDataset: prev.leftDataset - 1 }));
      }
      
      if (joinConfig.rightDataset === index) {
        setJoinConfig(prev => ({ ...prev, rightDataset: 0 }));
      } else if (joinConfig.rightDataset > index) {
        setJoinConfig(prev => ({ ...prev, rightDataset: prev.rightDataset - 1 }));
      }
      
      return newDatasets;
    });
    
    showToast({
      type: 'info',
      message: "Dataset removed",
      duration: 2000
    });
  };

  const resetJoin = () => {
    if (!originalData) return;
    
    setLoading(true);
    
    try {
      // Reset data ke original
      setParsedData(originalData);
      
      // Reset join result
      setJoinResultData(null);
      
      // Update datasets
      setDatasets(prev => {
        // Keep only the original dataset and others that are not result of joins
        const filtered = prev.filter((dataset, index) => 
          index === prev.length - 1 || !dataset.name.startsWith('Joined:')
        );
        
        return filtered;
      });
      
      setActiveDataset(0);
      
      showToast({
        type: 'info',
        message: 'Data has been reset to original state',
        duration: 3000
      });
    } catch (error) {
      console.error('Error resetting join:', error);
      showToast({
        type: 'error',
        message: `Error resetting join: ${error.message}`,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Multi-Data Source Join & Merge</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Available Datasets</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {datasets.map((dataset, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                index === activeDataset 
                  ? 'border-primary bg-[rgba(93,92,222,0.1)]' 
                  : 'border-gray-700 bg-gray-800'
              } flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <FiDatabase className={index === activeDataset ? 'text-primary' : 'text-gray-400'} />
                <div>
                  <div className="font-medium truncate" title={dataset.name}>
                    {dataset.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {dataset.data?.length || 0} rows
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => removeDataset(index)}
                className="text-gray-400 hover:text-red-400 p-1"
                title="Remove dataset"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
          
          {/* Add dataset dropzone */}
          <div 
            {...getRootProps()}
            className={`p-3 rounded-lg border-2 border-dashed border-gray-700 
              flex-column items-center justify-center min-h-[100px] cursor-pointer
              hover:border-primary hover:bg-[rgba(93,92,222,0.05)]
              ${isDragActive ? 'border-primary bg-[rgba(93,92,222,0.1)]' : ''}
            `}
          >
            <input {...getInputProps()} />
            <FiUploadCloud className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-center text-gray-400">
              Drop CSV or XLSX files here<br/>or click to add datasets
            </p>
          </div>
        </div>
      </div>
      
      {datasets.length >= 2 && (
        <div className="join-config bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FiLink className="text-primary" />
            Join Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Left Dataset</label>
              <select
                value={joinConfig.leftDataset}
                onChange={(e) => setJoinConfig(prev => ({ ...prev, leftDataset: Number(e.target.value) }))}
                className="input-field"
              >
                {datasets.map((dataset, index) => (
                  <option key={`left-${index}`} value={index}>{dataset.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Right Dataset</label>
              <select
                value={joinConfig.rightDataset}
                onChange={(e) => setJoinConfig(prev => ({ ...prev, rightDataset: Number(e.target.value) }))}
                className="input-field"
              >
                {datasets.map((dataset, index) => (
                  <option key={`right-${index}`} value={index}>{dataset.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Left Key Column</label>
              <select
                value={joinConfig.leftKey}
                onChange={(e) => setJoinConfig(prev => ({ ...prev, leftKey: e.target.value }))}
                className="input-field"
              >
                <option value="">Select column</option>
                {getDatasetColumns(joinConfig.leftDataset).map(column => (
                  <option key={`left-col-${column}`} value={column}>{column}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Right Key Column</label>
              <select
                value={joinConfig.rightKey}
                onChange={(e) => setJoinConfig(prev => ({ ...prev, rightKey: e.target.value }))}
                className="input-field"
              >
                <option value="">Select column</option>
                {getDatasetColumns(joinConfig.rightDataset).map(column => (
                  <option key={`right-col-${column}`} value={column}>{column}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Join Type</label>
              <select
                value={joinConfig.joinType}
                onChange={(e) => setJoinConfig(prev => ({ ...prev, joinType: e.target.value }))}
                className="input-field"
              >
                <option value="inner">Inner Join (Only matching rows)</option>
                <option value="left">Left Join (All left rows)</option>
                <option value="right">Right Join (All right rows)</option>
                <option value="full">Full Join (All rows from both)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Suffix for Duplicate Columns</label>
              <input
                type="text"
                value={joinConfig.suffix}
                onChange={(e) => setJoinConfig(prev => ({ ...prev, suffix: e.target.value }))}
                className="input-field"
                placeholder="_right"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={autoSelectKeys}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <FiInfo />
              Auto-Detect Keys
            </button>
            
            <button
              onClick={previewJoin}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
              disabled={!joinConfig.leftKey || !joinConfig.rightKey}
            >
              <FiCheck />
              Preview Join
            </button>
            
            <button
              onClick={applyJoin}
              className="btn-primary flex items-center gap-2"
              disabled={!joinConfig.leftKey || !joinConfig.rightKey}
            >
              <FiPlus />
              Apply Join
            </button>
          </div>
        </div>
      )}
      
      {/* Join preview */}
      {showMergePreview && mergePreview && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Join Preview (First 10 rows)</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-700">
                  {mergePreview.length > 0 && Object.keys(mergePreview[0]).map((key, i) => (
                    <th key={i} className="p-2 text-left">
                      {key}
                      {key === joinConfig.leftKey && " (Left Key)"}
                      {key === joinConfig.rightKey && " (Right Key)"}
                      {key.endsWith(joinConfig.suffix) && " (Duplicate)"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mergePreview.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex} className="p-2 border-t border-gray-700">
                        {cell !== null && cell !== undefined ? String(cell) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

{joinResultData && (
    <button
      onClick={resetJoin}
      className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
    >
      <FiRefreshCw />
      Reset Join
    </button>
  )}

    {joinResultData && (
        <div className="mt-6">
            <JoinResultPreview 
            data={joinResultData} 
            title={`Join Result: ${datasets[0].name}`}
            />
        </div>
        )}
        
    </div>
  );

  
};

export default DataJoinMerge;