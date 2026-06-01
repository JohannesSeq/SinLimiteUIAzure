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
import { Suspense, useEffect, useState } from 'react';
import RolesTable from './components/UsuariosAsignadosTable';
import { Usuario } from './types';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

function RolesContent() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [busqueda, setBusqueda] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const idRol = searchParams.get('idRol') ?? '';

  useEffect(() => {
    let isMounted = true;

const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${apiGatewayUrl}/AsignacionRoles/${idRol}`, {
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
            idUsuario: `tmp-${index}-${item}`,
            correo: item,
          } as Usuario;
        }

        const usuario = item as Record<string, unknown>;
        return {
          idUsuario: String(usuario.idUsuario ?? usuario.IdUsuario ?? usuario.id ?? usuario.ID_USUARIO ?? `tmp-${index}`),
          correo: String(
            usuario.Correo ?? usuario.correo  ?? ''
          ),
        } as Usuario;
      });

      if (isMounted) {
        setUsuarios(normalized);
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

    fetchUsuarios();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleDelete = async (idUsuario: string) => {

    const body = new FormData();
    body.append('idusuario', idUsuario);

    const response = await fetch(`${apiGatewayUrl}/AsignacionRoles/${idRol}`, {
      method: 'DELETE',
      credentials: 'include',
      body
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Error HTTP ${response.status}`);
    }

    setUsuarios((prev) => prev.filter((usuario) => usuario.idUsuario !== idUsuario));

  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const q = busqueda.toLowerCase();
    return (
      usuario.correo.toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute requiredScopes={['roles.read']}>{
      <Box p={5}>
        <Heading color={textColor} fontSize="2xl" mb={2}>
          Roles
        </Heading>
        <Text color="gray.500" mb={6}>
          Gestion de asignacion de roles
        </Text>

        <Flex mb={4} gap={4} flexWrap="wrap">
          <Link href={`/admin/roles/asignar/crear?idRol=${idRol}`}>
            <Button colorScheme="blue">Asignar rol</Button>
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
        ) : usuariosFiltrados.length > 0 ? (
          <RolesTable data={usuariosFiltrados} onDelete={handleDelete} />
        ) : (
          <Text color="gray.500">No se encontraron usuarios asignados al rol</Text>
        )}
      </Box>
    }</ProtectedRoute>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={null}>
      <RolesContent />
    </Suspense>
  );
}
