"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch, setTokens, clearTokens, getAccessToken } from "@/lib/api";
import type { AuthUser, LoginResponse, Role } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (minRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_LEVEL: Record<Role, number> = { VIEWER: 1, MOD: 2, ADMIN: 3 };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Decode JWT payload to get user info (without verification — server verifies)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.userId,
          username: payload.username,
          role: payload.role,
        });
      } catch {
        clearTokens();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    // Fire and forget
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  const hasRole = useCallback(
    (minRole: Role) => {
      if (!user) return false;
      return ROLE_LEVEL[user.role] >= ROLE_LEVEL[minRole];
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
