import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import CommandCenterPage from './pages/CommandCenterPage';
import DividendsPage from './pages/DividendsPage';
import QualityAuditPage from './pages/QualityAuditPage';
import SnowballProjectionPage from './pages/SnowballProjectionPage';
import StockDetailPage from './pages/StockDetailPage';

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/command-center" replace />} />
        <Route path="command-center" element={<CommandCenterPage />} />
        <Route path="snowball-projection" element={<SnowballProjectionPage />} />
        <Route path="dividends" element={<DividendsPage />} />
        <Route path="quality-audit" element={<QualityAuditPage />} />
        <Route path="stocks/:symbol" element={<StockDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
