"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  userId: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser({ userId: data.userId, name: data.name, role: data.role });
        // Persist role for SSR-less components
        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", data.role);
          localStorage.setItem("userName", data.name);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Wipe all client-side session state
    if (typeof window !== "undefined") {
      localStorage.clear(); // nuke everything — sessionId, userRole, userName, token
      // Hard redirect (not router.push) so Next.js fully reinitialises — no stale context
      window.location.href = "/login";
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
