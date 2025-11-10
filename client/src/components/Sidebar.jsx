import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  CreditCard,
  Users,
  User,
  Tag,
  Database,
  LogOut,
  Building2,
  Settings,
  BarChart3,
} from "lucide-react";
import LogoutModal from "./LogoutModal";
import { useState } from "react";


const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const userRole = user?.role;

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsLogoutOpen(false);
  };

  const iconMap = {
    home: Home,
    "credit-card": CreditCard,
    users: Users,
    user: User,
    tag: Tag,
    database: Database,
    // settings: Settings,
    // analytics: BarChart3,
  };

  const commonLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "home" },
    { to: "/leads", label: "Leads", icon: "users" },
    { to: "/resources", label: "My Resources", icon: "database" },
    { to: "/subscription-plans", label: "Subscription", icon: "credit-card" },
    { to: "/profile", label: "Profile", icon: "user" },
  ];

  const superAdminLinks = [
    { to: "/super-admin/dashboard", label: "Dashboard", icon: "home" },
    { to: "/super-admin/plan-management", label: "Plan Management", icon: "tag" },
    { to: "/super-admin/users", label: "All Subscribers", icon: "users" },
    { to: "/super-admin/subscriber-management", label: "Grant Access", icon: "user" },
    // { to: "/super-admin/settings", label: "Settings", icon: "settings" },
    // { to: "/super-admin/analytics", label: "Analytics", icon: "analytics" },
  ];

  const links = userRole === "super_admin" ? superAdminLinks : commonLinks;

  return (
    <aside className="bg-gray-900 text-gray-100 w-64 min-h-screen flex flex-col border-r border-gray-700 shadow-lg">
      {/* Brand */}
      <div className="p-6 flex items-center space-x-2 border-b border-gray-700">
        <Building2 className="h-8 w-8 text-blue-400" />
        <span className="text-2xl font-bold tracking-wide">BameeTech</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto mt-4 px-2">
        <ul className="space-y-1">
          {links.map((link) => {
            const IconComponent = iconMap[link.icon];
            const isActive = location.pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                    ${isActive ? "bg-gray-800 text-white font-medium" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                >
                  {IconComponent && <IconComponent className="h-5 w-5 mr-3 text-gray-400" />}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Signed in as</p>
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              userRole === "super_admin"
                ? "bg-purple-100 text-purple-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {userRole === "super_admin" ? "BameeTech Admin" : "Subscriber"}
          </span>
        </div>

         <button
        onClick={() => setIsLogoutOpen(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
      />
      </div>
    </aside>
  );
};

export default Sidebar;
