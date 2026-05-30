"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "@/lib/auth";
import type { CurrentUser, LoginRequest } from "@/types/auth";

interface AuthContextValue {
  user: CurrentUser | null;
  permissions: string[];
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginRequest) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function login(input: LoginRequest) {
    const response = await loginRequest(input);
    setUser(response.user);
    return response.user;
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser();

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    permissions: user?.permissions.map((permission) => permission.code) ?? [],
    roles: user?.roles ?? [],
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider.");
  }

  return context;
}
