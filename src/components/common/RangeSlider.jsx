// src/components/common/RangeSlider.jsx
import { useState } from 'react';

const RangeSlider = ({ 
  min = 1, 
  max = 100, 
  value, 
  onChange, 
  label, 
  showLabels = true,
  showValue = true 
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  return (
    <div className="range-slider">
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}
      
      <div className="range-slider-container">
        <input 
          type="range"
          min={min}
          max={max}
          value={localValue}
          onChange={handleChange}
        />
        
        {showValue && (
          <span className="range-slider-value">{localValue}</span>
        )}
      </div>
      
      {showLabels && (
        <div className="range-labels">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

export default RangeSlider;