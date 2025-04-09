// src/components/table/SearchBar.jsx
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useData } from '../../context/DataContext';

const SearchBar = ({ value, onChange }) => {
  const { parsedData } = useData();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const searchRef = useRef(null);
  const suggestionRef = useRef(null);
  
  // Create a flat array of all unique values from all columns
  useEffect(() => {
    if (!parsedData) return;
    
    // Create index of all searchable values for faster lookup
    const searchIndex = new Set();
    
    parsedData.forEach(row => {
      Object.values(row).forEach(value => {
        if (value !== null && value !== undefined && value !== '') {
          searchIndex.add(String(value).toLowerCase());
        }
      });
    });
    
    // Store as array for easier filtering
    const indexArray = Array.from(searchIndex);
    
    // Pre-compute suggestions when search term changes
    if (value) {
      const filtered = indexArray
        .filter(item => item.includes(value.toLowerCase()))
        .sort((a, b) => {
          // Prioritize items that start with the search term
          const aStarts = a.startsWith(value.toLowerCase());
          const bStarts = b.startsWith(value.toLowerCase());
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          // Then sort by length (shorter first)
          return a.length - b.length;
        })
        .slice(0, 10); // Limit to 10 suggestions
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [parsedData, value]);
  
  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // Arrow down
    if (e.keyCode === 40 && suggestions.length > 0) {
      e.preventDefault();
      setCursor(prevCursor => 
        prevCursor < suggestions.length - 1 ? prevCursor + 1 : prevCursor
      );
    }
    
    // Arrow up
    if (e.keyCode === 38 && suggestions.length > 0) {
      e.preventDefault();
      setCursor(prevCursor => (prevCursor > 0 ? prevCursor - 1 : 0));
    }
    
    // Enter
    if (e.keyCode === 13 && cursor >= 0) {
      e.preventDefault();
      onChange(suggestions[cursor]);
      setShowSuggestions(false);
      setCursor(-1);
    }
    
    // Escape
    if (e.keyCode === 27) {
      setShowSuggestions(false);
      setCursor(-1);
    }
  };
  
  // Clear search input
  const clearSearch = () => {
    onChange('');
    setCursor(-1);
  };
  
  return (
    <div className="search-container" ref={searchRef}>
      <div className="relative w-full">
        <input
          type="search"
          placeholder="Search data..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="search-field pr-8"
        />
        
        <FiSearch className="search-icon" />
        
        {value && (
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            onClick={clearSearch}
          >
            <FiX className="size-4" />
          </button>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown" ref={suggestionRef}>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className={`suggestion-item ${index === cursor ? 'active' : ''}`}
                onClick={() => {
                  onChange(suggestion);
                  setShowSuggestions(false);
                  setCursor(-1);
                }}
                onMouseEnter={() => setCursor(index)}
              >
                <FiSearch className="suggestion-icon" />
                <HighlightText text={suggestion} highlight={value} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper component to highlight matching text
const HighlightText = ({ text, highlight }) => {
  if (!highlight) return <span>{text}</span>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={i} className="highlight">{part}</span> : 
          <span key={i}>{part}</span>
      )}
    </span>
  );
};

export default SearchBar;