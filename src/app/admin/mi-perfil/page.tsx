'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MeResponse {
  id: string;
  email: string;
  estado: string;
  tipoUsuario?: string;
  scopes: string[];
}

export default function MiPerfilPage() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('navy.700', 'white');
  const cardBg = useColorModeValue('white', 'navy.800');
  const secondaryText = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiGatewayUrl}/me`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('No se pudo obtener la informacion del usuario.');
        }

        const data = (await response.json()) as MeResponse;

        setUser({
          id: data.id ?? '',
          email: data.email ?? '',
          estado: data.estado ?? 'Desconocido',
          tipoUsuario: data.tipoUsuario ?? '',
          scopes: Array.isArray(data.scopes) ? data.scopes : [],
        });
      } catch (fetchError) {
        setUser(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Ocurrio un error inesperado al cargar el perfil.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [apiGatewayUrl]);

  const emailName = user?.email?.split('@')[0] ?? 'Usuario';
  const displayName = emailName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
  const estado = user?.estado ? String(user.estado).trim().toLowerCase() : '';
  const estadoMostrado =
    estado === 'true'
      ? 'Activo'
      : estado === 'false'
      ? 'Inactivo'
      : estado
      ? estado.charAt(0).toUpperCase() + estado.slice(1)
      : 'Sin estado';
  const canReadUsuarios =
    user?.scopes?.some((scope) => scope === 'usuarios.read') ?? false;

  return (
    <Flex
      direction="column"
      pt={{ base: '130px', md: '80px', xl: '80px' }}
      align="center"
      px={4}
    >
      <Box
        bg={cardBg}
        p={8}
        borderRadius="lg"
        boxShadow="md"
        w="100%"
        maxW="600px"
      >
        <Heading size="lg" color={textColor} mb={6}>
          Mi Perfil
        </Heading>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" />
          </Flex>
        ) : error ? (
          <Alert status="error" borderRadius="16px" mb={6}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Stack spacing={3} mb={6}>
              <Text>
                <strong>Nombre:</strong> {displayName || 'Usuario'}
              </Text>
              {canReadUsuarios ? (
                <Text>
                  <strong>ID:</strong> {user?.id ?? 'N/D'}
                </Text>
              ) : null}
              <Text>
                <strong>Correo:</strong> {user?.email ?? 'Sin correo'}
              </Text>
              <Text>
                <strong>Estado:</strong> {estadoMostrado}
              </Text>
              <Text>
                <strong>Tipo de usuario:</strong>{' '}
                {user?.tipoUsuario || 'Sin tipo asignado'}
              </Text>
              {canReadUsuarios ? (
                <Text color={secondaryText}>
                  <strong>Permisos:</strong>{' '}
                  {user?.scopes.length
                    ? user.scopes.join(', ')
                    : 'Sin permisos asignados'}
                </Text>
              ) : null}
            </Stack>

            <Flex gap={4} flexWrap="wrap">
              <Link href="/admin/mi-perfil/editar">
                <Button colorScheme="blue">Editar perfil</Button>
              </Link>
              <Link href="/admin/mi-perfil/cambiar-password">
                <Button variant="outline" colorScheme="blue">
                  Cambiar contraseña
                </Button>
              </Link>
            </Flex>
          </>
        )}
      </Box>
    </Flex>
  );
}
