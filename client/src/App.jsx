// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Register from "./pages/Register";

import UserDashboard from "./pages/user/Dashboard";
import UserProfile from "./pages/user/Profile";
import SubscriptionPlans from "./pages/user/SubscriptionPlans";
import UserLeads from "./pages/user/Leads";

import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import Users from "./pages/admin/Users";
import ProtectedRoute from "./routes/protectedRoutes";
import PlanManagement from "./pages/admin/PlanManagement";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<SuperAdminLogin />} />
          <Route path="/register" element={<Register />} />

          {/* User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute requiredRole="user">
                <UserLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute requiredRole="user">
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription-plans"
            element={
              <ProtectedRoute requiredRole="user">
                <SubscriptionPlans />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/plan-management"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <PlanManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/users"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
