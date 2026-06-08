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
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useAuth } from 'contexts/AuthContext';

type ClienteActual = {
  cedula: string;
  nombre: string;
  apellidos: string;
};

const getCollection = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.data, record.items, record.result];
    const collection = candidates.find(Array.isArray);
    return Array.isArray(collection) ? collection : [];
  }

  return [];
};

function EditarMiVehiculoContent() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardBg = useColorModeValue('white', 'navy.800');
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const placa = searchParams.get('placa') ?? '';

  const [cliente, setCliente] = useState<ClienteActual | null>(null);
  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    year: '',
    tipo: '',
  });
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setLoadingVehiculo(false);
      setError('No se pudo identificar el usuario autenticado.');
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      if (!placa) {
        if (isMounted) {
          setError('No se recibio la placa del vehiculo.');
          setLoadingVehiculo(false);
        }
        return;
      }

      try {
        setLoadingVehiculo(true);
        setError(null);

        const [clientesResponse, vehiculoResponse] = await Promise.all([
          fetch(`${apiGatewayUrl}/clientes`, { credentials: 'include' }),
          fetch(`${apiGatewayUrl}/vehiculos/${placa}`, { credentials: 'include' }),
        ]);

        if (!clientesResponse.ok) {
          const message = await clientesResponse.text();
          throw new Error(message || `Clientes: HTTP ${clientesResponse.status}`);
        }

        if (!vehiculoResponse.ok) {
          const message = await vehiculoResponse.text();
          throw new Error(message || `Vehiculos: HTTP ${vehiculoResponse.status}`);
        }

        const clientes = getCollection(await clientesResponse.json()).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            cedula: String(record.cedula ?? record.CEDULA ?? record.Cedula ?? ''),
            nombre: String(record.nombre ?? record.NOMBRE ?? record.Nombre ?? ''),
            apellidos: String(record.apellidos ?? record.APELLIDOS ?? record.Apellidos ?? ''),
            idUsuario: String(record.idUsuario ?? record.ID_USUARIO ?? record.IdUsuario ?? ''),
          };
        });

        const clienteActual =
          clientes.find((item) => item.idUsuario === user.id) ?? null;

        if (!clienteActual?.cedula) {
          throw new Error('No se encontro un cliente vinculado al usuario actual.');
        }

        const vehiculo = (await vehiculoResponse.json()) as Record<string, unknown>;
        const relaciones = (vehiculo.vehiculosClientes ??
          vehiculo.VehiculosClientes ??
          []) as Array<Record<string, unknown>>;
        const perteneceAlCliente = relaciones.some(
          (relacion) =>
            String(relacion.cedulaCliente ?? relacion.CedulaCliente ?? '') === clienteActual.cedula
        );

        if (!perteneceAlCliente) {
          throw new Error('Este vehiculo no pertenece al cliente autenticado.');
        }

        if (!isMounted) return;

        setCliente({
          cedula: clienteActual.cedula,
          nombre: clienteActual.nombre,
          apellidos: clienteActual.apellidos,
        });
        setForm({
          marca: String(vehiculo.marca ?? vehiculo.Marca ?? ''),
          modelo: String(vehiculo.modelo ?? vehiculo.Modelo ?? ''),
          year: String(vehiculo.year ?? vehiculo.Year ?? ''),
          tipo: String(vehiculo.tipo ?? vehiculo.Tipo ?? ''),
        });
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error ? fetchError.message : 'No se pudo cargar el vehiculo.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingVehiculo(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, authLoading, placa, user?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const Swal = (await import('sweetalert2')).default;
      const confirmation = await Swal.fire({
        icon: 'question',
        title: 'Confirmar cambios',
        text: 'Deseas guardar los cambios de tu vehiculo?',
        showCancelButton: true,
        confirmButtonText: 'Si, guardar',
        cancelButtonText: 'Cancelar',
      });

      if (!confirmation.isConfirmed) {
        setLoading(false);
        return;
      }

      const body = new FormData();
      body.append('marca', form.marca);
      body.append('modelo', form.modelo);
      body.append('year', form.year);
      body.append('tipo', form.tipo);

      const response = await fetch(`${apiGatewayUrl}/vehiculos/${placa}`, {
        method: 'POST',
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Vehiculo actualizado',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonText: 'Ver mis vehiculos',
      });

      router.push('/admin/vehiculos/mis-vehiculos');
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Error desconocido al editar.';
      setError(message);

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar',
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
            Editar mi vehiculo
          </Heading>
          <Text color="gray.500" mb={6}>
            Actualiza la informacion de uno de tus vehiculos registrados.
          </Text>

          {loadingVehiculo ? (
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
                  <FormControl isRequired isDisabled>
                    <FormLabel>Placa</FormLabel>
                    <Input value={placa} readOnly />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Marca</FormLabel>
                    <Input name="marca" value={form.marca} onChange={handleChange} />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Modelo</FormLabel>
                    <Input name="modelo" value={form.modelo} onChange={handleChange} />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Año</FormLabel>
                    <Input name="year" type="number" value={form.year} onChange={handleChange} />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Tipo</FormLabel>
                    <Input name="tipo" value={form.tipo} onChange={handleChange} />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    mt={4}
                    isLoading={loading}
                    isDisabled={!placa || loadingVehiculo}
                  >
                    Guardar cambios
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

export default function EditarMiVehiculoPage() {
  return (
    <Suspense fallback={null}>
      <EditarMiVehiculoContent />
    </Suspense>
  );
}
