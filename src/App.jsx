// src/App.jsx
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { ChartSettingsProvider } from './context/ChartSettingsContext';
import { ToastProvider } from './context/ToastContext';
import Dashboard from './components/Dashboard';
import ToastContainer from './components/common/Toast';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <ChartSettingsProvider>
          <ToastProvider>
            <Dashboard />
            <ToastContainer />
          </ToastProvider>
        </ChartSettingsProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;