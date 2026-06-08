'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredScopes?: string[];
}

export default function ProtectedRoute({
  children,
  requiredScopes = [],
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // No autenticado
    if (!user) {
      router.replace('/auth/sign-in');
      return;
    }

    // Validación de scopes
    if (requiredScopes.length > 0) {
      const userScopes = (user.scopes ?? []).map((s) =>
        String(s).trim().toLowerCase(),
      );

      const hasAccess = requiredScopes.some((scope) =>
        userScopes.includes(scope.toLowerCase()),
      );

      if (!hasAccess) {
        router.replace('/forbidden');
      }
    }
  }, [user, loading, router, requiredScopes]);

  // Evita flicker
  if (loading || !user) return null;

  // Si requiere scopes pero no los tiene, no renderiza
  if (requiredScopes.length > 0) {
    const userScopes = (user.scopes ?? []).map((s) =>
      String(s).trim().toLowerCase(),
    );

    const hasAccess = requiredScopes.some((scope) =>
      userScopes.includes(scope.toLowerCase()),
    );

    if (!hasAccess) return null;
  }

  return <>{children}</>;
}