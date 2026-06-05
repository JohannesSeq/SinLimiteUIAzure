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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ClienteOption = {
  cedula: string;
  nombreCompleto: string;
};

export default function CrearVehiculoPage() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [form, setForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    year: '',
    tipo: '',
    cedulaCliente: '',
  });
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const Swal = (await import('sweetalert2')).default;
      const body = new FormData();
      body.append('placa', form.placa);
      body.append('marca', form.marca);
      body.append('modelo', form.modelo);
      body.append('year', form.year);
      body.append('tipo', form.tipo);

      const response = await fetch(`${apiGatewayUrl}/vehiculos`, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      if (form.cedulaCliente) {
        const relBody = new FormData();
        relBody.append('cedulaCliente', form.cedulaCliente);
        relBody.append('placa', form.placa);

        const relResponse = await fetch(`${apiGatewayUrl}/vehiculos-clientes`, {
          method: 'POST',
          body: relBody,
        });

        if (!relResponse.ok) {
          const relMessage = await relResponse.text();
          throw new Error(relMessage || `Error HTTP ${relResponse.status}`);
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Vehiculo creado',
        text: 'El vehiculo fue registrado correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      setForm({
        placa: '',
        marca: '',
        modelo: '',
        year: '',
        tipo: '',
        cedulaCliente: '',
      });

      router.push('/admin/vehiculos');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
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
              Registrar vehiculo
            </Heading>

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
                    placeholder="Ej: SUV, Sedan..."
                    value={form.tipo}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Cedula - Nombre Cliente</FormLabel>
                  <Select
                    name="cedulaCliente"
                    value={form.cedulaCliente}
                    onChange={handleChange}
                    isDisabled={loadingClientes}
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

                <Button type="submit" colorScheme="blue" mt={4} isLoading={loading}>
                  Registrar vehiculo
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
