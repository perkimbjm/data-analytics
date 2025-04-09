// src/components/map/InteractiveMap.jsx
import { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { FiMap, FiMapPin, FiCheck } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import FullscreenButton from '../common/FullscreenButton';

// This is a workaround for Leaflet markers in React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const InteractiveMap = () => {
  const { parsedData } = useData();
  const [showMap, setShowMap] = useState(false);
  const [columnsSelected, setColumnsSelected] = useState(false);
  const [latColumn, setLatColumn] = useState('');
  const [lngColumn, setLngColumn] = useState('');
  const [popupColumn, setPopupColumn] = useState('');
  const [spatialColumns, setSpatialColumns] = useState([]);
  const [mapData, setMapData] = useState([]);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  
  // Detect columns that might contain spatial data
  useEffect(() => {
    if (!parsedData || parsedData.length === 0) return;
    
    const headers = Object.keys(parsedData[0]);
    
    // Look for columns that might contain lat/lng data
    const potentialSpatialColumns = headers.filter(header => {
      const columnValues = parsedData.map(row => row[header]);
      const numericValues = columnValues.filter(val => 
        typeof val === 'number' || 
        (typeof val === 'string' && !isNaN(parseFloat(val)))
      );
      
      // If at least 80% of values are numeric, it could be a spatial column
      return numericValues.length >= 0.8 * columnValues.filter(val => val !== null && val !== undefined && val !== '').length;
    });
    
    // Look for columns with names suggesting lat/lng
    const spatialKeywords = [
      'lat', 'latitude', 'lng', 'lon', 'long', 'longitude', 
      'x', 'y', 'coord', 'coordinate', 'point'
    ];
    
    const namedSpatialColumns = headers.filter(header => {
      const lowerHeader = header.toLowerCase();
      return spatialKeywords.some(keyword => lowerHeader.includes(keyword));
    });
    
    // Combine and deduplicate
    const allSpatialColumns = Array.from(new Set([...potentialSpatialColumns, ...namedSpatialColumns]));
    
    setSpatialColumns(allSpatialColumns);
    
    // Auto-select lat/lng columns if found
    const latOptions = ['lat', 'latitude', 'y'];
    const lngOptions = ['lng', 'lon', 'long', 'longitude', 'x'];
    
    const findColumn = (options) => {
      return headers.find(header => 
        options.some(opt => header.toLowerCase().includes(opt))
      );
    };
    
    const autoLatColumn = findColumn(latOptions);
    const autoLngColumn = findColumn(lngOptions);
    
    if (autoLatColumn && autoLngColumn) {
      setLatColumn(autoLatColumn);
      setLngColumn(autoLngColumn);
      // Set first non-lat/lng column as popup column
      const otherColumn = headers.find(header => 
        header !== autoLatColumn && header !== autoLngColumn
      );
      if (otherColumn) {
        setPopupColumn(otherColumn);
      }
    }
    
  }, [parsedData]);
  
  // Determine if there's spatial data
  const hasSpatialData = spatialColumns.length >= 2;
  
  // Initialize map when spatial data is detected and columns are selected
  useEffect(() => {
    if (!mapRef.current || !showMap || !columnsSelected) return;
    
    // Check if the map is already initialized
    if (!mapInstanceRef.current) {
      // Load Leaflet dynamically to avoid SSR issues
      const loadMap = async () => {
        try {
          if (!L) return; // If Leaflet is not available
          
          // Create map instance
          mapInstanceRef.current = L.map(mapRef.current).setView([0, 0], 2);
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstanceRef.current);
          
          // Create markers layer group
          markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
          
          // Update markers
          updateMarkers();
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      };
      
      loadMap();
    } else {
      // Just update markers if map already exists
      updateMarkers();
    }
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap, columnsSelected, mapData]);
  
  // Process data when columns are selected
  useEffect(() => {
    if (!latColumn || !lngColumn || !parsedData) return;
    
    // Filter out rows with invalid coordinates
    const validData = parsedData.filter(row => {
      const lat = parseFloat(row[latColumn]);
      const lng = parseFloat(row[lngColumn]);
      return !isNaN(lat) && !isNaN(lng) && 
             lat >= -90 && lat <= 90 && 
             lng >= -180 && lng <= 180;
    });
    
    setMapData(validData);
    setColumnsSelected(true);
  }, [latColumn, lngColumn, popupColumn, parsedData]);
  
  // Update markers on the map
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !mapData.length) return;
    
    // Clear existing markers
    markersLayerRef.current.clearLayers();
    
    // Add markers for each valid data point
    const markers = mapData.map(row => {
      const lat = parseFloat(row[latColumn]);
      const lng = parseFloat(row[lngColumn]);
      
      // Create marker
      const marker = L.marker([lat, lng]);
      
      // Add popup with information if popup column is selected
      if (popupColumn) {
        marker.bindPopup(`
          <div>
            <strong>${popupColumn}:</strong> ${row[popupColumn] || 'N/A'}<br>
            <strong>${latColumn}:</strong> ${lat}<br>
            <strong>${lngColumn}:</strong> ${lng}
          </div>
        `);
      }
      
      return marker;
    });
    
    // Add all markers to the layer group
    markers.forEach(marker => markersLayerRef.current.addLayer(marker));
    
    // Fit map bounds to markers
    if (markers.length > 0) {
      try {
        const group = L.featureGroup(markers);
        mapInstanceRef.current.fitBounds(group.getBounds(), {
          padding: [50, 50]
        });
      } catch (error) {
        console.error('Error fitting bounds:', error);
        mapInstanceRef.current.setView([0, 0], 2);
      }
    }
  };
  
  const handleMapToggle = () => {
    setShowMap(!showMap);
  };
  
  const handleApplyColumns = () => {
    setColumnsSelected(true);
  };

  // No need to show component if no spatial data detected
  if (!hasSpatialData) return null;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Spatial Data Visualization</h2>
        
        <button 
          className="btn-process flex items-center gap-2"
          onClick={handleMapToggle}
        >
          <FiMap />
          <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
        </button>
      </div>
      <div className="fullscreen-container" ref={mapRef}>
      <FullscreenButton targetRef={mapRef} />
      </div>
      {showMap && (
        <div className="space-y-4">
          {!columnsSelected ? (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Map Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude Column</label>
                  <select 
                    value={latColumn}
                    onChange={(e) => setLatColumn(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select column</option>
                    {spatialColumns.map(column => (
                      <option key={`lat-${column}`} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude Column</label>
                  <select 
                    value={lngColumn}
                    onChange={(e) => setLngColumn(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select column</option>
                    {spatialColumns.map(column => (
                      <option key={`lng-${column}`} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Popup Information</label>
                  <select 
                    value={popupColumn}
                    onChange={(e) => setPopupColumn(e.target.value)}
                    className="input-field"
                  >
                    <option value="">None</option>
                    {parsedData && parsedData.length > 0 && Object.keys(parsedData[0]).map(column => (
                      <option key={`popup-${column}`} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button 
                className="btn-process w-full flex items-center justify-center gap-2"
                onClick={handleApplyColumns}
                disabled={!latColumn || !lngColumn}
              >
                <FiCheck />
                <span>Apply Selection</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">
                <span className="text-gray-400">Using: </span>
                <span className="font-medium">{latColumn}</span> (Lat), 
                <span className="font-medium"> {lngColumn}</span> (Lng)
                {popupColumn && <span> with <span className="font-medium">{popupColumn}</span> as popup</span>}
              </div>
              
              <button 
                className="text-sm text-primary hover:text-primary-hover btn-primary"
                onClick={() => setColumnsSelected(false)}
              >
                Ubah Kolom Koordinat dan Popup
              </button>
            </div>
          )}

          <div 
            ref={mapRef}
            className="h-[400px] w-full bg-gray-800 rounded-lg overflow-hidden"
            style={{ display: columnsSelected ? 'block' : 'none' }}
          ></div>
          
          {columnsSelected && mapData.length === 0 && (
            <div className="text-center text-red-400 mt-2">
              No valid coordinates found in the selected columns.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;