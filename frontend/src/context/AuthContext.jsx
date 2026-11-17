import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          api.get("/business/").then((bRes) => setBusiness(bRes.data.business));
        })
        .catch(() => {
          localStorage.removeItem("token");
          delete api.defaults.headers.common.Authorization;
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData, businessData) => {
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
    setBusiness(businessData);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    setBusiness(null);
  };

  return (
    <AuthContext.Provider value={{ user, business, setBusiness, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
