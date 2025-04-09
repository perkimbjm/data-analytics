// src/components/upload/FileUpload.jsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud } from 'react-icons/fi';
import { useData } from '../../context/DataContext';
import { parseXLSX } from '../../utils/fileParser';

const FileUpload = ({ setShowSeparatorModal, setCsvContent }) => {
  const { setLoading, setParsedData, setError } = useData();
  const [fileInfo, setFileInfo] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    processFile(file);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });
  
  const processFile = async (file) => {
    setLoading(true);
    
    // Get file extension
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    try {
      if (fileExt === 'csv') {
        // For CSV files, we need to show the separator modal
        const reader = new FileReader();
        reader.onload = (e) => {
          setCsvContent(e.target.result);
          setShowSeparatorModal(true);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Error reading CSV file');
          setLoading(false);
        };
        reader.readAsText(file);
      } else if (['xlsx', 'xls'].includes(fileExt)) {
        // For Excel files, parse directly
        const result = await parseXLSX(file);
        setParsedData(result);
      } else {
        setError('Unsupported file format');
        setLoading(false);
      }
    } catch (error) {
      setError(`Error processing file: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <>
      <div
        {...getRootProps()}
        className={`drag-area ${isDragActive ? 'border-primary-color' : ''}`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-300">
          Drag & drop your CSV or XLSX file here<br/>or click to browse
        </p>
      </div>
      
      {fileInfo && (
        <div className="mt-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-300 truncate">{fileInfo.name}</span>
        </div>
      )}
    </>
  );
};

export default FileUpload;