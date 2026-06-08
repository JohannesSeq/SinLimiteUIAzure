"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  estado: string;
  tipoUsuario?: string;
  scopes: string[];
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasScope: (scope: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasScope: () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "https://dev.gateway.limitlesscr.online"}/me`,
      {
        credentials: "include",
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const normalizedScopes = Array.isArray(data?.scopes)
          ? data.scopes
          : Array.isArray(data?.permissions)
          ? data.permissions
          : [];

        setUser({
          ...data,
          scopes: normalizedScopes,
          roles: Array.isArray(data?.roles) ? data.roles : [],
        });
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const hasScope = (scope: string) => {
    const normalizedScope = String(scope).trim().toLowerCase();
    return (
      user?.scopes?.some(
        (userScope) =>
          String(userScope).trim().toLowerCase() === normalizedScope
      ) ?? false
    );
  };

  const logout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "https://dev.gateway.limitlesscr.online"}/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch {
      // Ignoramos error, limpiamos frontend igual
    } finally {
      setUser(null);
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasScope, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
