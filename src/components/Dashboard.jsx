// src/components/Dashboard.jsx
import { useState } from 'react';
import Header from './layout/Header';
import FileUpload from './upload/FileUpload';
import ChartControls from './controls/ChartControls';
import ChartDisplay from './charts/ChartDisplay';
import Loading from './common/Loading';
import { useData } from '../context/DataContext';
import SeparatorModal from './upload/SeparatorModal';
import DataPreview from './table/DataPreview';
import DataDistributionCard from './analytics/DataDistributionCard';
import InteractiveMap from './map/InteractiveMap';
import HeatmapVisualization from './analytics/HeatmapVisualization';
import DataJoinMerge from './datamerge/DataJoinMerge';
import NormalityTestCard from './analytics/NormalityTestCard';

const Dashboard = () => {
  const { isLoading, parsedData } = useData();
  const [showSeparatorModal, setShowSeparatorModal] = useState(false);
  const [csvContent, setCsvContent] = useState(null);

  return (
    <div className="app-container">
      <Header />
      
      <div className={`dashboard-grid ${parsedData ? 'has-data' : ''}`}>
        {/* Left sidebar */}
        <div className="sidebar-container">
          <div className="card bg-card-upload">
            <h2 className="text-lg font-semibold mb-4">Upload File</h2>
            <FileUpload 
              setShowSeparatorModal={setShowSeparatorModal} 
              setCsvContent={setCsvContent}
            />
          </div>
          
          {parsedData && <ChartControls />}
        </div>
        
        {/* Main content */}
        <div className="content-container">
          {isLoading ? (
            <Loading />
          ) : (
            parsedData && (
              <>
                <DataPreview />
                <ChartDisplay />
                <DataJoinMerge />
                <DataDistributionCard />
                <NormalityTestCard />
                <HeatmapVisualization />
                <InteractiveMap />
              </>
            )
          )}
        </div>
      </div>
      
      {showSeparatorModal && (
        <SeparatorModal 
          show={showSeparatorModal}
          onClose={() => setShowSeparatorModal(false)}
          csvContent={csvContent}
        />
      )}
    </div>
  );
};

export default Dashboard;