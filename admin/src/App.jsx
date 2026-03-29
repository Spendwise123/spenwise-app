import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import InvestmentManagement from './pages/InvestmentManagement';
import LoanApprovals from './pages/LoanApprovals';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="auth-container">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout>
                <Navigate to="/dashboard" replace />
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/investments" element={
            <ProtectedRoute>
              <AdminLayout>
                <InvestmentManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/loans" element={
            <ProtectedRoute>
              <AdminLayout>
                <LoanApprovals />
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
