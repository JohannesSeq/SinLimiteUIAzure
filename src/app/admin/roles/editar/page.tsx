'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import ProtectedRoute from 'components/Auth/ProtectedRoute';
import PermissionSelector from '../components/PermissionSelector';

function EditarRolContent() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const router = useRouter();
  const searchParams = useSearchParams();
  const idRol = searchParams.get('idRol') ?? '';

  const [form, setForm] = useState({
    nombreRol: '',
    descripcionRol: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRol, setLoadingRol] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRol = async () => {
      if (!idRol) {
        if (isMounted) {
          setError('No se recibio el identificador del rol.');
          setLoadingRol(false);
        }
        return;
      }

      try {
        const response = await fetch(`${apiGatewayUrl}/roles/${idRol}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }        
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }

        const item = await response.json();
        if (isMounted) {
          setForm({
            nombreRol: String(item?.nombreRol ?? item?.NombreRol ?? item?.nombre ?? ''),
            descripcionRol: String(
              item?.descripcionRol ?? item?.DescripcionRol ?? item?.descripcion ?? ''
            ),
          });
          setSelectedPermissions(
            String(item?.permisos ?? item?.Permisos ?? '')
              .split(',')
              .map((permission) => permission.trim())
              .filter(Boolean)
          );
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isMounted) {
          setLoadingRol(false);
        }
      }
    };

    fetchRol();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, idRol]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const Swal = (await import('sweetalert2')).default;
      const body = new FormData();
      body.append('nombreRol', form.nombreRol);
      body.append('descripcionRol', form.descripcionRol);
      body.append('permisos', selectedPermissions.join(','));

      const response = await fetch(`${apiGatewayUrl}/roles/${idRol}`, {
        method: 'PUT',
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Rol actualizado',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      router.push('/admin/roles');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Error al editar',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredScopes={['roles.write']}>
      {
        <Flex direction="column" pt={{ base: '130px', md: '80px', xl: '80px' }} align="center" px={4}>
          <Box
            bg="white"
            _dark={{ bg: 'navy.800' }}
            p={8}
            borderRadius="lg"
            boxShadow="md"
            w="100%"
            maxW="760px"
          >
            <Heading color={textColor} fontSize="2xl" mb={6}>
              Editar rol
            </Heading>

            {error ? (
              <Alert status="error" borderRadius="16px" mb={6}>
                <AlertIcon />
                <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
              </Alert>
            ) : null}

            {loadingRol ? <Text color="gray.500">Cargando rol...</Text> : null}

            <Box as="form" onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isDisabled>
                  <FormLabel>Id del rol</FormLabel>
                  <Input value={idRol} readOnly />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Nombre del rol</FormLabel>
                  <Input name="nombreRol" value={form.nombreRol} onChange={handleChange} />
                </FormControl>

                <FormControl>
                  <FormLabel>Descripcion</FormLabel>
                  <Textarea
                    name="descripcionRol"
                    value={form.descripcionRol}
                    onChange={handleChange}
                  />
                </FormControl>

                <PermissionSelector
                  value={selectedPermissions}
                  onChange={setSelectedPermissions}
                />

                <Button
                  type="submit"
                  colorScheme="green"
                  mt={4}
                  isLoading={loading}
                  isDisabled={!idRol || loadingRol}
                >
                  Guardar cambios
                </Button>

                <Link href="/admin/roles">
                  <Button variant="ghost">Cancelar</Button>
                </Link>
              </Stack>
            </Box>
          </Box>
        </Flex>
      }
    </ProtectedRoute>
  );
}

export default function EditarRolPage() {
  return (
    <Suspense fallback={null}>
      <EditarRolContent />
    </Suspense>
  );
}
