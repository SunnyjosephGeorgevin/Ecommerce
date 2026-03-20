import { createContext, ReactNode, useState } from "react";
import { User, UserRole, AuthContextType } from "../types";

export const AuthContext = createContext<AuthContextType | null>(null);

type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: ApiUser;
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const toUiUser = (apiUser: ApiUser): User => ({
  id: String(apiUser.id),
  name: apiUser.name,
  email: apiUser.email,
  role: apiUser.role,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(
    typeof window !== "undefined"
      ? (() => {
          const stored = localStorage.getItem("user");
          return stored ? JSON.parse(stored) : null;
        })()
      : null
  );

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let detail = "Login failed";
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // Keep fallback message.
      }
      throw new Error(detail);
    }

    const loginData: LoginResponse = await response.json();
    const mappedUser = toUiUser(loginData.user);
    setUser(mappedUser);
    localStorage.setItem("user", JSON.stringify(mappedUser));
    localStorage.setItem("auth_token", loginData.access_token);
    return mappedUser;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: Exclude<UserRole, "admin">
  ): Promise<{ pendingApproval: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
      }),
    });

    if (!response.ok) {
      let detail = "Registration failed";
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // Keep fallback message.
      }
      throw new Error(detail);
    }

    return { pendingApproval: role === "buyer" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
