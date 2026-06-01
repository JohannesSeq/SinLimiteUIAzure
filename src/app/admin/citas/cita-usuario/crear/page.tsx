'use client';

import ProtectedRoute from 'components/Auth/ProtectedRoute';
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
  Select,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type MeResponse = {
  id?: string;
};

type ClienteDetalle = {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  idUsuario: string;
};

type VehiculoOption = {
  placa: string;
  etiqueta: string;
  cedulaCliente: string;
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

export default function CrearCitaClientePage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedText = useColorModeValue('gray.500', 'gray.300');
  const router = useRouter();

  const [form, setForm] = useState({
    placa: '',
    fecha: '',
    hora: '',
    servicio: '',
    estado: 'Pendiente',
  });
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoadingCatalogs(true);
        setError(null);

        const meResponse = await fetch(`${apiGatewayUrl}/me`, {
          credentials: 'include',
        });

        if (!meResponse.ok) {
          throw new Error('No se pudo obtener la sesion del usuario.');
        }

        const meData = (await meResponse.json()) as MeResponse;
        const idUsuario = String(meData.id ?? '');

        if (!idUsuario) {
          throw new Error('No se pudo identificar el usuario autenticado.');
        }

        const [clientesResponse, vehiculosResponse] = await Promise.all([
          fetch(`${apiGatewayUrl}/clientes`, { credentials: 'include' }),
          fetch(`${apiGatewayUrl}/vehiculos`, { credentials: 'include' }),
        ]);

        if (!clientesResponse.ok) {
          throw new Error(`Clientes: HTTP ${clientesResponse.status}`);
        }

        if (!vehiculosResponse.ok) {
          throw new Error(`Vehiculos: HTTP ${vehiculosResponse.status}`);
        }

        const clientes = getCollection(await clientesResponse.json()).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            cedula: String(record.cedula ?? record.CEDULA ?? record.Cedula ?? ''),
            nombre: String(record.nombre ?? record.NOMBRE ?? record.Nombre ?? ''),
            apellidos: String(record.apellidos ?? record.APELLIDOS ?? record.Apellidos ?? ''),
            correo: String(record.correo ?? record.CORREO ?? record.Correo ?? ''),
            idUsuario: String(record.idUsuario ?? record.ID_USUARIO ?? record.IdUsuario ?? ''),
          };
        });

        const clienteActual = clientes.find((item) => item.idUsuario === idUsuario) ?? null;

        if (!clienteActual?.cedula) {
          throw new Error('No se encontro un cliente vinculado al usuario actual.');
        }

        const vehiculosNormalizados = getCollection(await vehiculosResponse.json())
          .map((item) => {
            const record = item as Record<string, unknown>;
            const relaciones = (record.vehiculosClientes ??
              record.VehiculosClientes ??
              []) as Array<Record<string, unknown>>;
            const relacionActual =
              relaciones.find(
                (relacion) =>
                  String(relacion.cedulaCliente ?? relacion.CedulaCliente ?? '') ===
                  clienteActual.cedula
              ) ?? relaciones[0];
            const placa = String(record.placa ?? record.Placa ?? '');
            const modelo = String(record.modelo ?? record.Modelo ?? '');
            const marca = String(record.marca ?? record.Marca ?? '');

            return {
              placa,
              etiqueta: [placa, modelo || marca || 'Vehiculo sin nombre'].filter(Boolean).join(' - '),
              cedulaCliente: String(
                relacionActual?.cedulaCliente ?? relacionActual?.CedulaCliente ?? ''
              ),
            };
          })
          .filter((vehiculo) => vehiculo.cedulaCliente === clienteActual.cedula);

        if (!isMounted) return;

        setCliente(clienteActual);
        setVehiculos(vehiculosNormalizados);
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'No se pudo cargar la informacion para crear la cita.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingCatalogs(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!cliente?.cedula) {
        throw new Error('No se encontro un cliente autenticado para registrar la cita.');
      }

      if (!form.placa || !form.fecha || !form.hora || !form.servicio) {
        throw new Error('Vehiculo, fecha, hora y servicio son obligatorios.');
      }

      const fechaHora = `${form.fecha}T${form.hora}`;
      const body = new FormData();
      body.append('fechaHora', fechaHora);
      body.append('estado', form.estado);
      body.append('servicio', form.servicio);

      const response = await fetch(`${apiGatewayUrl}/citas`, {
        method: 'POST',
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      const created = await response.json();
      const idCita = String(created?.idCita ?? created?.IdCita ?? created?.id ?? created?.Id ?? '');

      if (!idCita) {
        throw new Error('No se recibio el identificador de la cita creada.');
      }

      const clienteBody = new FormData();
      clienteBody.append('idCita', idCita);
      clienteBody.append('cedulaCliente', cliente.cedula);
      if (cliente.correo) {
        clienteBody.append('correoCliente', cliente.correo);
        clienteBody.append('nombreCliente', `${cliente.nombre} ${cliente.apellidos}`.trim());
      }

      const clienteResponse = await fetch(`${apiGatewayUrl}/citas-clientes`, {
        method: 'POST',
        credentials: 'include',
        body: clienteBody,
      });

      if (!clienteResponse.ok) {
        const message = await clienteResponse.text();
        throw new Error(message || `Error HTTP ${clienteResponse.status}`);
      }

      const vehiculoBody = new FormData();
      vehiculoBody.append('idCita', idCita);
      vehiculoBody.append('placa', form.placa);

      const vehiculoResponse = await fetch(`${apiGatewayUrl}/citas-vehiculos`, {
        method: 'POST',
        credentials: 'include',
        body: vehiculoBody,
      });

      if (!vehiculoResponse.ok) {
        const message = await vehiculoResponse.text();
        throw new Error(message || `Error HTTP ${vehiculoResponse.status}`);
      }

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'success',
        title: 'Cita creada',
        text: 'Tu cita fue registrada correctamente y quedo pendiente de asignacion.',
        confirmButtonText: 'Ver mis citas',
      });

      router.push('/admin/citas/cita-usuario');
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Error desconocido al crear la cita.';
      setError(message);

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo crear la cita',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Box maxW="600px" mx="auto" mt={10}>
        <Heading color={textColor} fontSize="2xl" mb={2}>
          Agendar cita
        </Heading>
        <Text color={mutedText} mb={6}>
          Programa una cita para uno de tus vehiculos. El empleado sera asignado despues.
        </Text>

        {error ? (
          <Alert status="error" borderRadius="16px" mb={6}>
            <AlertIcon />
            <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
          </Alert>
        ) : null}

        {cliente ? (
          <Box mb={6}>
            <Text color={mutedText}>
              Cliente: {cliente.nombre} {cliente.apellidos} ({cliente.cedula})
            </Text>
          </Box>
        ) : null}

        <Stack spacing={4} as="form" onSubmit={handleSubmit}>
          <FormControl isRequired>
            <FormLabel>Vehiculo</FormLabel>
            <Select
              name="placa"
              value={form.placa}
              onChange={handleChange}
              isDisabled={loadingCatalogs || vehiculos.length === 0}
            >
              <option value="">
                {loadingCatalogs
                  ? 'Cargando vehiculos...'
                  : vehiculos.length > 0
                  ? 'Seleccione un vehiculo'
                  : 'No tienes vehiculos registrados'}
              </option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.placa} value={vehiculo.placa}>
                  {vehiculo.etiqueta}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Fecha</FormLabel>
            <Input name="fecha" type="date" value={form.fecha} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Hora</FormLabel>
            <Input name="hora" type="time" value={form.hora} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Servicio</FormLabel>
            <Input
              name="servicio"
              placeholder="Describe el servicio solicitado"
              value={form.servicio}
              onChange={handleChange}
            />
          </FormControl>

          <Flex justify="space-between" gap={3} mt={4} flexWrap="wrap">
            <Link href="/admin/citas/cita-usuario">
              <Button variant="ghost">Cancelar</Button>
            </Link>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={loading}
              isDisabled={loadingCatalogs || vehiculos.length === 0}
            >
              Guardar cita
            </Button>
          </Flex>
        </Stack>
      </Box>
    </ProtectedRoute>
  );
}
