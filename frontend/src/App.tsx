import { Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import StockDetailPage from './pages/StockDetailPage';

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="stocks/:symbol" element={<StockDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
