// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import UserDashboard from "./pages/user/Dashboard";
import UserProfile from "./pages/user/Profile";
import SubscriptionPlans from "./pages/user/SubscriptionPlans";
import UserLeads from "./pages/user/Leads";
import SubscriberResources from "./pages/user/SubscriberResources";
import ProtectedContent from "./pages/user/ProtectedContent";

import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import Users from "./pages/admin/Users";
import ProtectedRoute from "./routes/protectedRoutes";
import PlanManagement from "./pages/admin/PlanManagement";
import SubscriberManagement from "./pages/admin/SubscriberManagement";
import Contact from "./pages/user/Contact";

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
          <Route path="/forgot-password" element={<ForgotPassword />} />

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
            path="/leads/plan/:planId"
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
          <Route
            path="/resources"
            element={
              <ProtectedRoute requiredRole="user">
                <SubscriberResources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/plan/:planId"
            element={
              <ProtectedRoute requiredRole="user">
                <SubscriberResources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/protected-content"
            element={
              <ProtectedRoute requiredRole="user">
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <ProtectedRoute requiredRole="user">
                <Contact />
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
          <Route
            path="/super-admin/subscriber-management"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SubscriberManagement />
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
