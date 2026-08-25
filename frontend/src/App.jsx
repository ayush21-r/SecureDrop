import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SendFilePage from './pages/SendFilePage';
import FilesPage from './pages/FilesPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Route */}
              <Route path="/" element={<LandingPage />} />

              {/* Guest Only Routes (Redirect authenticated users to /dashboard) */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />

              {/* Protected Routes (Redirect unauthenticated users to /login) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Send File (supports both /send and /send-file) */}
              <Route
                path="/send"
                element={
                  <ProtectedRoute>
                    <SendFilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-file"
                element={
                  <ProtectedRoute>
                    <SendFilePage />
                  </ProtectedRoute>
                }
              />

              {/* Files Vault (supports both /files and /my-files) */}
              <Route
                path="/files"
                element={
                  <ProtectedRoute>
                    <FilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-files"
                element={
                  <ProtectedRoute>
                    <FilesPage />
                  </ProtectedRoute>
                }
              />

              {/* Profile Route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
