import { createContext, useState, useEffect, useContext } from "react";
import { getProfile } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      
      if (token) {
        try {
          // Try to get fresh user data from API
          const response = await getProfile();
          const userData = response.data.user || response.data;
          setUser(userData);
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (error) {
          console.error("❌ AuthContext: Error loading user from API:", error);
          // Only remove token if it's actually invalid (401/403)
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          } else if (savedUser) {
            // If API fails but we have saved user data, use it
            console.log("💾 AuthContext: Using saved user data as fallback");
            try {
              const parsedUser = JSON.parse(savedUser);
              console.log("✅ AuthContext: Loaded user from localStorage:", parsedUser);
              setUser(parsedUser);
            } catch (parseError) {
              console.error("❌ AuthContext: Error parsing saved user:", parseError);
              localStorage.removeItem("user");
              setUser(null);
            }
          }
        }
      } else if (savedUser) {
        // No token but have saved user - clear it
        console.log("🧹 AuthContext: No token but have saved user, clearing...");
        localStorage.removeItem("user");
        setUser(null);
      }
      
      setLoading(false);
      console.log("✅ AuthContext: Loading complete");
    };

    loadUser();
  }, []);

  const login = (userData, token) => {
    console.log("🔐 AuthContext: Login called with:", { userData, token: token ? "***" : null });
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    console.log("✅ AuthContext: Login complete, user set");
  };

  const logout = () => {
    console.log("👋 AuthContext: Logout called");
    localStorage.clear();
    setUser(null);
    console.log("✅ AuthContext: Logout complete");
  };

  const updateUser = (userData) => {
    console.log("🔄 AuthContext: Update user called with:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("✅ AuthContext: User updated");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
