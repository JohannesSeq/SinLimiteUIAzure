'use client';

import ProtectedRoute from 'components/Auth/ProtectedRoute';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

import { useAuth } from 'contexts/AuthContext';

type ClienteActual = {
  cedula: string;
  nombre: string;
  apellidos: string;
};

const normalizeCliente = (data: unknown): ClienteActual => {
  const item = (data ?? {}) as Record<string, unknown>;

  return {
    cedula: String(item.cedula ?? item.CEDULA ?? item.Cedula ?? ''),
    nombre: String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? ''),
    apellidos: String(item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''),
  };
};

export default function RegistrarMiVehiculoPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardBg = useColorModeValue('white', 'navy.800');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cliente, setCliente] = useState<ClienteActual | null>(null);
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    year: '',
    tipo: '',
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setLoadingCliente(false);
      setCliente(null);
      setError('No se pudo identificar el usuario autenticado.');
      return;
    }

    let isMounted = true;

    const fetchCliente = async () => {
      try {
        setLoadingCliente(true);
        setError(null);

        const response = await fetch(`${apiGatewayUrl}/clientes/usuario/${user.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }

        const clienteData = normalizeCliente(await response.json());

        if (!clienteData.cedula) {
          throw new Error('El usuario no tiene un cliente asociado.');
        }

        if (!isMounted) {
          return;
        }

        setCliente(clienteData);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setCliente(null);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (isMounted) {
          setLoadingCliente(false);
        }
      }
    };

    fetchCliente();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, authLoading, user?.id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!cliente?.cedula) {
      setError('No se puede registrar el vehículo sin un cliente asociado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append('placa', form.placa);
      body.append('marca', form.marca);
      body.append('modelo', form.modelo);
      body.append('year', form.year);
      body.append('tipo', form.tipo);

      const response = await fetch(`${apiGatewayUrl}/vehiculos/cliente/${cliente.cedula}`, {
        method: 'POST',
        body,
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'success',
        title: 'Vehículo registrado',
        text: 'Tu vehículo fue asociado correctamente a tu cuenta.',
        confirmButtonText: 'Ver mis vehículos',
      });

      router.push('/admin/vehiculos/mis-vehiculos');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Flex direction="column" pt={{ base: '130px', md: '80px', xl: '80px' }} align="center" px={4}>
        <Box bg={cardBg} p={8} borderRadius="lg" boxShadow="md" w="100%" maxW="600px">
          <Heading color={textColor} fontSize="2xl" mb={2}>
            Registrar mi vehículo
          </Heading>
          <Text color="gray.500" mb={6}>
            Agrega un vehículo y asígnalo automáticamente a tu cuenta de cliente.
          </Text>

          {loadingCliente ? (
            <Stack spacing={4}>
              <Skeleton h="20px" w="260px" />
              <Skeleton h="48px" borderRadius="12px" />
              <Skeleton h="48px" borderRadius="12px" />
              <Skeleton h="48px" borderRadius="12px" />
            </Stack>
          ) : (
            <>
              {cliente ? (
                <Text color="gray.500" mb={4}>
                  Cliente asociado: {cliente.nombre} {cliente.apellidos} ({cliente.cedula})
                </Text>
              ) : null}

              {error ? (
                <Text color="red.500" mb={4}>
                  {error}
                </Text>
              ) : null}

              <Box as="form" onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Placa</FormLabel>
                    <Input
                      name="placa"
                      placeholder="Ingrese la placa"
                      value={form.placa}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Marca</FormLabel>
                    <Input
                      name="marca"
                      placeholder="Ingrese la marca"
                      value={form.marca}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Modelo</FormLabel>
                    <Input
                      name="modelo"
                      placeholder="Ingrese el modelo"
                      value={form.modelo}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Año</FormLabel>
                    <Input
                      name="year"
                      type="number"
                      placeholder="Ingrese el año"
                      value={form.year}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Tipo</FormLabel>
                    <Input
                      name="tipo"
                      placeholder="Ej: SUV, Sedán, Pickup"
                      value={form.tipo}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <Button type="submit" colorScheme="blue" mt={4} isLoading={loading} isDisabled={!cliente}>
                    Registrar vehículo
                  </Button>

                  <Link href="/admin/vehiculos/mis-vehiculos">
                    <Button variant="ghost">Cancelar</Button>
                  </Link>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Flex>
    </ProtectedRoute>
  );
}
