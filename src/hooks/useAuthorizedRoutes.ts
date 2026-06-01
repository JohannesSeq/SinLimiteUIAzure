import { useMemo } from 'react';
import routes from 'routes';
import { useAuth } from 'contexts/AuthContext';
import { IRoute } from 'types/navigation'; // ajusta si es necesario

export const useAuthorizedRoutes = () => { 
    console.log(routes);//linea debug
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
        console.log("Ruta sin scopes:" + route.name);//linea debug
        return true;
      }

      if (userScopes.size === 0) {
        console.log("El usuario no tiene scopes o no esta logueado.")
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
