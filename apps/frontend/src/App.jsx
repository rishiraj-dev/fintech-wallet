import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { SlideUpProvider } from './contexts/SlideUpContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { FloatingBottomNav, FloatingSidebar } from './components/Navigation';

// pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TransactionHistory from './pages/TransactionHistory';
import Transfer from './pages/Transfer';
import Settings from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <SlideUpProvider>
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                  {/* public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <>
                          <Dashboard />
                          <FloatingBottomNav />
                          <FloatingSidebar />
                        </>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRoute>
                        <>
                          <TransactionHistory />
                          <FloatingBottomNav />
                          <FloatingSidebar />
                        </>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transfer"
                    element={
                      <ProtectedRoute>
                        <>
                          <Transfer />
                          <FloatingBottomNav />
                          <FloatingSidebar />
                        </>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </SlideUpProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
