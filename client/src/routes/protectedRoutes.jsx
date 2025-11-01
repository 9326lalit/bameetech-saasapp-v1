// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Checking access...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role;

  if (requiredRole && userRole !== requiredRole) {
    return redirectUser(userRole);
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return redirectUser(userRole);
  }

  return children;
};

const redirectUser = (role) => {
  if (role === "super_admin") return <Navigate to="/super-admin/dashboard" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default ProtectedRoute;
