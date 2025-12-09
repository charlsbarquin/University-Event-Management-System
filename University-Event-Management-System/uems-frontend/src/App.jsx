// uems-frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import BrowseEvents from './pages/events/BrowseEvents';
import CreateEvent from './pages/events/CreateEvent';
import EventDetails from './pages/events/EventDetails';
import UserDashboard from './pages/dashboard/UserDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

import Navbar from './components/layout/Navbar';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, authChecked, isAuthenticated } = useAuth();
  
  // Show loading while checking auth status
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0A2FF1] rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/events/:id" element={<EventDetails />} /> {/* ✅ PUBLIC */}
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/events" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/events" element={
                <ProtectedRoute>
                  <BrowseEvents />
                </ProtectedRoute>
              } />
              
              <Route path="/events/create" element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              
              {/* 404 Page */}
              <Route path="*" element={
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-bold text-gray-800">404 - Page Not Found</h1>
                  <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
                  <a href="/events" className="mt-4 inline-block text-primary-600 hover:underline">
                    Go back to Events
                  </a>
                </div>
              } />
            </Routes>
            
            <Toaster position="top-right" />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;