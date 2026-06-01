'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import {
  Flex,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type ClienteOption = {
  cedula: string;
  nombreCompleto: string;
};

function EditarVehiculoContent() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const router = useRouter();
  const searchParams = useSearchParams();
  const placa = searchParams.get('placa') ?? '';

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    year: '',
    tipo: '',
    cedulaCliente: '',
  });
  const [initialCedulaCliente, setInitialCedulaCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchClientes = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/clientes`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data?.data ?? [];
        const normalized = rawList.map((item: Record<string, unknown>) => ({
          cedula: String(item.cedula ?? item.CEDULA ?? item.Cedula ?? ''),
          nombreCompleto: `${String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? '')} ${String(
            item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''
          )}`.trim(),
        }));

        if (isMounted) {
          setClientes(normalized);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes.');
        }
      } finally {
        if (isMounted) {
          setLoadingClientes(false);
        }
      }
    };

    fetchClientes();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  useEffect(() => {
    let isMounted = true;

    const fetchVehiculo = async () => {
      if (!placa) {
        if (isMounted) {
          setError('No se recibio la placa del vehiculo.');
          setLoadingVehiculo(false);
        }
        return;
      }

      try {
        const response = await fetch(`${apiGatewayUrl}/vehiculos/${placa}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }

        const item = await response.json();
        const relaciones = (item?.vehiculosClientes ??
          item?.VehiculosClientes ??
          []) as Array<Record<string, unknown>>;
        const firstRelacion = relaciones[0] ?? {};
        const cedulaCliente = String(
          firstRelacion?.cedulaCliente ?? firstRelacion?.CedulaCliente ?? ''
        );

        if (isMounted) {
          setForm({
            marca: String(item?.marca ?? item?.Marca ?? ''),
            modelo: String(item?.modelo ?? item?.Modelo ?? ''),
            year: String(item?.year ?? item?.Year ?? ''),
            tipo: String(item?.tipo ?? item?.Tipo ?? ''),
            cedulaCliente,
          });
          setInitialCedulaCliente(cedulaCliente);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isMounted) {
          setLoadingVehiculo(false);
        }
      }
    };

    fetchVehiculo();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, placa]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const Swal = (await import('sweetalert2')).default;
      const confirmation = await Swal.fire({
        icon: 'question',
        title: 'Confirmar cambios',
        text: 'Deseas guardar los cambios del vehiculo?',
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

      if (form.cedulaCliente && form.cedulaCliente !== initialCedulaCliente) {
        const relBody = new FormData();
        relBody.append('cedulaCliente', form.cedulaCliente);
        relBody.append('placa', placa);

        const relResponse = await fetch(`${apiGatewayUrl}/vehiculos-clientes`, {
          method: 'POST',
          credentials: 'include',
          body: relBody,
        });

        if (!relResponse.ok) {
          const relMessage = await relResponse.text();
          throw new Error(relMessage || `Error HTTP ${relResponse.status}`);
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Vehiculo actualizado',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      router.push('/admin/vehiculos');
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
    <ProtectedRoute requiredScopes={['vehiculos.write']}>
      {
        <Flex direction="column" pt={{ base: '130px', md: '80px', xl: '80px' }} align="center" px={4}>
          <Box
            bg="white"
            _dark={{ bg: 'navy.800' }}
            p={8}
            borderRadius="lg"
            boxShadow="md"
            w="100%"
            maxW="600px"
          >
            <Heading color={textColor} fontSize="2xl" mb={6}>
              Editar vehiculo
            </Heading>

            {error ? (
              <Text color="red.500" mb={4}>
                {error}
              </Text>
            ) : null}

            {loadingVehiculo ? (
              <Text color="gray.500">Cargando vehiculo...</Text>
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
                  <FormLabel>Ano</FormLabel>
                  <Input type="number" name="year" value={form.year} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Tipo</FormLabel>
                  <Input name="tipo" value={form.tipo} onChange={handleChange} />
                </FormControl>

                <FormControl>
                  <FormLabel>Cedula - Nombre Cliente</FormLabel>
                  <Select
                    name="cedulaCliente"
                    value={form.cedulaCliente}
                    onChange={handleChange}
                    isDisabled={loadingClientes || loadingVehiculo}
                  >
                    <option value="">
                      {loadingClientes ? 'Cargando clientes...' : 'Seleccione un cliente'}
                    </option>
                    {clientes.map((cliente) => (
                      <option key={cliente.cedula} value={cliente.cedula}>
                        {cliente.cedula} - {cliente.nombreCompleto || 'Cliente sin nombre'}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  mt={4}
                  isLoading={loading}
                  isDisabled={!placa || loadingVehiculo}
                >
                  Guardar cambios
                </Button>

                <Link href="/admin/vehiculos">
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

export default function EditarVehiculoPage() {
  return (
    <Suspense fallback={null}>
      <EditarVehiculoContent />
    </Suspense>
  );
}
