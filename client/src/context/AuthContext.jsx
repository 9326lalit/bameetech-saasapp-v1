import { createContext, useState, useEffect, useContext } from "react";
import { getProfile } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token"); // or sessionStorage if needed
      if (token) {
        try {
          const response = await getProfile(); // Fetch user profile using token
          setUser(response.data);
        } catch (error) {
          console.error("Error loading user:", error);
          localStorage.removeItem("token"); // Remove invalid token
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token); // Save token
    setUser(userData); // Set user data after login
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
