import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/admin/AdminRoute";

import Home from "./pages/Home";
import Chat from "./pages/chat";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Skills from "./pages/Skills";
import Progress from "./pages/Progress";
import Assessment from "./pages/Assessment";
import History from "./pages/History";
import Profile from "./pages/Profile";

// ================= ADMIN PAGES =================
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminConversations from "./pages/AdminConversations";
import AdminSettings from "./pages/AdminSettings";

const App = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <Router>
      <div className={`${isDark ? "dark" : ""}`}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">

          <Navbar
            isDark={isDark}
            setIsDark={setIsDark}
          />

          <Routes>

            {/* ================= USER ROUTES ================= */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/chat"
              element={
                <Chat
                  isDark={isDark}
                  setIsDark={setIsDark}
                />
              }
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/signup"
              element={<Signup />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/reset-password"
              element={<ResetPassword />}
            />

            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />

            <Route
              path="/skills"
              element={
                <ProtectedRoute>
                  <Skills />
                </ProtectedRoute>
              }
            />

            <Route
              path="/levels"
              element={<Navigate to="/skills" replace />}
            />

            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />


            {/* ================= ADMIN ROUTES ================= */}

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/conversations"
              element={
                <AdminRoute>
                  <AdminConversations />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              }
            />


            {/* ================= FALLBACK ================= */}

            <Route
              path="*"
              element={<Home />}
            />

          </Routes>

        </div>
      </div>
    </Router>
  );
};

export default App;