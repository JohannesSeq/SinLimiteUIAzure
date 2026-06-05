'use client';

import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import RolesTable from './components/RolesTable';
import { Rol } from './types';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

export default function RolesPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [busqueda, setBusqueda] = useState('');
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

const fetchRoles = async () => {
    try {
      const response = await fetch(`${apiGatewayUrl}/roles`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawList = Array.isArray(data) ? data : data?.data ?? [];

      const normalized = rawList.map((item: unknown, index: number) => {
        if (typeof item === 'string') {
          return {
            idRol: `tmp-${index}-${item}`,
            nombreRol: item,
            descripcionRol: '',
            permisos: '',
          } as Rol;
        }

        const role = item as Record<string, unknown>;
        return {
          idRol: String(role.idRol ?? role.IdRol ?? role.id ?? role.ID_ROL ?? `tmp-${index}`),
          nombreRol: String(
            role.nombreRol ?? role.NombreRol ?? role.nombre ?? role.NOMBRE_ROL ?? ''
          ),
          descripcionRol: String(
            role.descripcionRol ??
              role.DescripcionRol ??
              role.descripcion ??
              role.DESCRIPCION_ROL ??
              ''
          ),
          permisos: String(role.permisos ?? role.Permisos ?? role.PERMISOS ?? ''),
        } as Rol;
      });

      if (isMounted) {
        setRoles(normalized);
        setError(null);
      }
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleDelete = async (idRol: string) => {
    const response = await fetch(`${apiGatewayUrl}/roles/${idRol}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Error HTTP ${response.status}`);
    }

    setRoles((prev) => prev.filter((rol) => rol.idRol !== idRol));
  };

  const rolesFiltrados = roles.filter((rol) => {
    const q = busqueda.toLowerCase();
    return (
      rol.nombreRol.toLowerCase().includes(q) ||
      (rol.descripcionRol || '').toLowerCase().includes(q) ||
      (rol.permisos || '').toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute requiredScopes={['roles.read']}>{
      <Box p={5}>
        <Heading color={textColor} fontSize="2xl" mb={2}>
          Roles
        </Heading>
        <Text color="gray.500" mb={6}>
          Gestion de roles de usuario del sistema
        </Text>

        <Flex mb={4} gap={4} flexWrap="wrap">
          <Link href="/admin/roles/crear">
            <Button colorScheme="blue">Crear rol</Button>
          </Link>
          <Input
            placeholder="Buscar por nombre, descripcion o permisos"
            maxW="350px"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </Flex>

        {loading ? (
          <Text color="gray.500">Cargando roles...</Text>
        ) : error ? (
          <Text color="red.500">No se pudo cargar: {error}</Text>
        ) : rolesFiltrados.length > 0 ? (
          <RolesTable data={rolesFiltrados} onDelete={handleDelete} />
        ) : (
          <Text color="gray.500">No se encontraron roles con esos datos</Text>
        )}
      </Box>
    }</ProtectedRoute>  
  );
}
