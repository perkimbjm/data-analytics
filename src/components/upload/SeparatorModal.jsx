// src/components/upload/SeparatorModal.jsx
import { useState } from 'react';
import { parseCSV } from '../../utils/fileParser';
import { useData } from '../../context/DataContext';

const SeparatorModal = ({ show, onClose, csvContent }) => {
  const { setParsedData, setError } = useData();
  const [separator, setSeparator] = useState(',');
  const [customSeparator, setCustomSeparator] = useState('');
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[9999] p-4 ${show ? '' : 'hidden'}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="dark:bg-gray-800 rounded-lg p-6 max-w-md relative">
        <h3 className="text-xl font-semibold mb-4 text-blue-800 dark:text-gray-200">Select CSV Separator</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Please select the separator used in your CSV file:</p>
        
        <div className="space-y-3">
          <label className="block cursor-pointer">
            <input
              type="radio"
              name="separator"
              value=","
              checked={separator === ',' && !customSeparator}
              onChange={(e) => {
                setSeparator(e.target.value);
                setCustomSeparator('');
              }}
              className="mr-2"
            />
            <span>Comma (,)</span>
          </label>
          <label className="block cursor-pointer">
            <input
              type="radio"
              name="separator"
              value=";"
              checked={separator === ';' && !customSeparator}
              onChange={(e) => {
                setSeparator(e.target.value);
                setCustomSeparator('');
              }}
              className="mr-2"
            />
            <span>Semicolon (;)</span>
          </label>
          <label className="block cursor-pointer">
            <input
              type="radio"
              name="separator"
              value="\t"
              checked={separator === '\\t' && !customSeparator}
              onChange={(e) => {
                setSeparator(e.target.value);
                setCustomSeparator('');
              }}
              className="mr-2"
            />
            <span>Tab</span>
          </label>
          <label className="block cursor-pointer">
            <input
              type="radio"
              name="separator"
              value="|"
              checked={separator === '|' && !customSeparator}
              onChange={(e) => {
                setSeparator(e.target.value);
                setCustomSeparator('');
              }}
              className="mr-2"
            />
            <span>Pipe (|)</span>
          </label>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Separator:
            </label>
            <input
              type="text"
              value={customSeparator}
              onChange={(e) => setCustomSeparator(e.target.value)}
              className="input-field"
              maxLength={1}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              // Use custom separator if provided
              const effectiveSeparator = customSeparator || separator;
              
              try {
                // Parse CSV with selected separator
                const data = parseCSV(csvContent, effectiveSeparator);
                setParsedData(data);
                onClose();
              } catch (error) {
                setError(`Error parsing CSV: ${error.message}`);
              }
            }}
            className="btn-process"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeparatorModal;