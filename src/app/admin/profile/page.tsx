'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Grid,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import Card from 'components/card/Card';
import banner from 'img/auth/banner.png';
import avatar from 'img/avatars/avatar4.png';
import Banner from 'views/admin/profile/components/Banner';
import Information from 'views/admin/profile/components/Information';

interface MeResponse {
  id: string;
  email: string;
  estado: string;
  scopes: string[];
}

export default function ProfileOverview() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColorPrimary = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = 'gray.400';

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
  const estado = user?.estado ? String(user.estado) : 'Sin estado';
  const estadoCapitalizado =
    estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {loading ? (
        <Card
          alignItems="center"
          justifyContent="center"
          display="flex"
          minH="220px"
        >
          <Spinner size="lg" />
        </Card>
      ) : error ? (
        <Alert status="error" borderRadius="16px">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            xl: '1.2fr 1fr',
          }}
          gap={{ base: '20px', xl: '20px' }}
        >
          <Banner
            banner={banner}
            avatar={avatar}
            name={displayName || 'Usuario'}
            job={user?.email ?? 'Sin correo'}
            posts={user?.scopes.length ?? 0}
            followers={estadoCapitalizado}
            following={user?.id ?? 'N/D'}
            postsLabel="Scopes"
            followersLabel="Estado"
            followingLabel="ID"
          />
          <Card p="26px">
            <Text
              color={textColorPrimary}
              fontWeight="bold"
              fontSize="2xl"
              mb="4px"
            >
              Informacion del usuario
            </Text>
            <Text color={textColorSecondary} fontSize="md" mb="24px">
              Datos obtenidos desde el endpoint protegido `me`.
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
              <Information title="Nombre" value={displayName || 'Usuario'} />
              <Information title="Correo" value={user?.email ?? 'Sin correo'} />
              <Information title="Estado" value={estadoCapitalizado} />
              <Information title="ID" value={user?.id ?? 'N/D'} />
              <Information
                title="Scopes"
                value={
                  user?.scopes.length
                    ? user.scopes.join(', ')
                    : 'Sin permisos asignados'
                }
              />
            </SimpleGrid>
          </Card>
        </Grid>
      )}
    </Box>
  );
}
