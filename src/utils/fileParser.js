// src/utils/fileParser.js
import * as XLSX from 'xlsx';

export const parseCSV = (csvData, separator = ',') => {
  // Split by lines
  const lines = csvData.split(/\r\n|\n/);
  const headers = lines[0].split(separator);
  
  const data = [];
  
  // Parse each row
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = lines[i].split(separator);
    const rowData = {};
    
    for (let j = 0; j < headers.length; j++) {
      let value = values[j] || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      // Try to convert to number if possible
      const numValue = Number(value);
      rowData[headers[j]] = isNaN(numValue) ? value : numValue;
    }
    
    data.push(rowData);
  }
  
  return data;
};

export const parseXLSX = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const result = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Format the data
        const headers = result[0];
        const jsonData = [];
        
        for (let i = 1; i < result.length; i++) {
          if (result[i].length === 0) continue;
          
          const rowData = {};
          for (let j = 0; j < headers.length; j++) {
            let value = result[i][j];
            // Handle undefined values
            if (value === undefined) {
              value = '';
            }
            // Convert to number if possible
            else if (typeof value === 'number' || !isNaN(Number(value))) {
              value = Number(value);
            }
            rowData[headers[j]] = value;
          }
          jsonData.push(rowData);
        }
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};