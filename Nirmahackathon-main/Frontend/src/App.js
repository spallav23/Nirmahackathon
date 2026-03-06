import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import InverterDashboard from './pages/InverterDashboard';
import RiskTrendCharts from './pages/RiskTrendCharts';
import InverterDetail from './pages/InverterDetail';
import AIExplanationPanel from './pages/AIExplanationPanel';
import OperatorQuery from './pages/OperatorQuery';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} aria-hidden />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<InverterDashboard />} />
        <Route path="trends" element={<RiskTrendCharts />} />
        <Route path="inverter/:id" element={<InverterDetail />} />
        <Route path="explain/:id" element={<AIExplanationPanel />} />
        <Route path="query" element={<OperatorQuery />} />
        <Route path="about" element={<AboutUs />} />
        <Route path="contact" element={<ContactUs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
