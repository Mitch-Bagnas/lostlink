import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { ItemNew } from './pages/ItemNew';
import { ItemDetail } from './pages/ItemDetail';
import { FoundPublic } from './pages/FoundPublic';
import { Premium } from './pages/Premium';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/found/:qrId" element={<FoundPublic />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/items/new"
                  element={
                    <ProtectedRoute>
                      <ItemNew />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/items/:id"
                  element={
                    <ProtectedRoute>
                      <ItemDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/premium"
                  element={
                    <ProtectedRoute>
                      <Premium />
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

                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
