import { useMemo } from 'react';
import routes from 'routes';
import { useAuth } from 'contexts/AuthContext';
import { IRoute } from 'types/navigation'; // ajusta si es necesario

export const useAuthorizedRoutes = () => { 
    const { user, loading } = useAuth();

  const filteredRoutes = useMemo(() => {
    if (loading) return [];

    const isAuthenticated = !!user;

    const userScopes = new Set(
      (user?.scopes ?? []).map((scope) => String(scope).trim().toLowerCase()),
    );

    return routes.filter((route: IRoute) => {
  
      if (route.onlyGuest && isAuthenticated) {
        return false;
      }
      
      if (route.private && !isAuthenticated) {
        return false;
      }
      
      // Ruta pública
      if (!route.scopes || route.scopes.length === 0) {
        return true;
      }

      if (userScopes.size === 0) {
        return false;
      }

      // Permitir si coincide al menos un scope
      return route.scopes.some((scope) =>
        userScopes.has(String(scope).trim().toLowerCase()),
      );
    });
  }, [user, loading]);

  return {
    routes: filteredRoutes,
    loading,
  };
};
