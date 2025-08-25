import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/user");
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("auth_token");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await api.post("/auth/login", { email, password });
      const { user: userData, token } = response.data;

      localStorage.setItem("auth_token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) => {
    try {
      setError(null);
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation,
      });
      const { user: userData, token } = response.data;

      localStorage.setItem("auth_token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
