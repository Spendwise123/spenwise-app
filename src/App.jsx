// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Predictions from './pages/Predictions';
import Feedback from './pages/Feedback';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<Landing />} />

            {/* Auth routes */}
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />

            {/* Protected routes wrapped in MainLayout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout><Dashboard /></MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/expenses" element={
              <ProtectedRoute>
                <MainLayout><Expenses /></MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/predictions" element={
              <ProtectedRoute>
                <MainLayout><Predictions /></MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/feedback" element={
              <ProtectedRoute>
                <MainLayout><Feedback /></MainLayout>
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;