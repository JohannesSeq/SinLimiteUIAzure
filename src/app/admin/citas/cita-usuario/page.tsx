'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type MeResponse = {
  id?: string;
  email?: string;
  tipoUsuario?: string;
};

type ApiRecord = Record<string, unknown>;

type ClienteDetalle = {
  cedula: string;
  nombre: string;
  apellidos: string;
  numeroTelefono: string;
  idUsuario: string;
};

type VehiculoDetalle = {
  placa: string;
  marca: string;
  modelo: string;
  year: string;
  tipo: string;
};

type CitaUsuario = {
  idCita: string;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string;
  cedulaCliente: string;
  idEmpleado: string;
  placa: string;
  vehiculo: VehiculoDetalle | null;
};

const splitFechaHora = (value: string) => {
  if (!value) {
    return { fecha: '', hora: '' };
  }

  const [fecha, tiempo] = value.split('T');
  return {
    fecha: fecha || '',
    hora: tiempo ? tiempo.slice(0, 5) : '',
  };
};

const buildFechaHora = (fecha: string, hora: string) => {
  const normalizedFecha = String(fecha ?? '').trim();
  const normalizedHora = String(hora ?? '').trim();

  if (!normalizedFecha) {
    return '';
  }

  if (!normalizedHora) {
    return `${normalizedFecha}T00:00:00`;
  }

  const horaConSegundos = normalizedHora.length === 5 ? `${normalizedHora}:00` : normalizedHora;
  return `${normalizedFecha}T${horaConSegundos}`;
};

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export default function CitaUsuarioPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const labelColor = useColorModeValue('gray.500', 'gray.300');
  const cardBg = useColorModeValue('white', 'navy.800');

  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [citas, setCitas] = useState<CitaUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
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

        const clientesResponse = await fetch(`${apiGatewayUrl}/clientes`);
        if (!clientesResponse.ok) {
          throw new Error(`Clientes: HTTP ${clientesResponse.status}`);
        }

        const clientesData = await clientesResponse.json();
        const rawClientes: ApiRecord[] = Array.isArray(clientesData)
          ? clientesData
          : Array.isArray(clientesData?.data)
          ? clientesData.data
          : [];

        const clienteEncontrado = rawClientes
          .map((item) => ({
            cedula: String(item.cedula ?? item.CEDULA ?? item.Cedula ?? ''),
            nombre: String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? ''),
            apellidos: String(item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''),
            numeroTelefono: String(
              item.numeroTelefono ??
                item.numeroDeTelefono ??
                item.NUMERO_DE_TELEFONO ??
                item.NumeroDeTelefono ??
                ''
            ),
            idUsuario: String(item.idUsuario ?? item.ID_USUARIO ?? item.IdUsuario ?? ''),
          }))
          .find((item) => item.idUsuario === idUsuario);

        if (!clienteEncontrado) {
          throw new Error('No se encontro un cliente vinculado al usuario actual.');
        }

        const citasResponse = await fetch(`${apiGatewayUrl}/citas`);
        if (!citasResponse.ok) {
          throw new Error(`Citas: HTTP ${citasResponse.status}`);
        }

        const citasData = await citasResponse.json();
        const rawCitas: ApiRecord[] = Array.isArray(citasData)
          ? citasData
          : Array.isArray(citasData?.data)
          ? citasData.data
          : [];

        const citasDelClienteBase = rawCitas
          .map((item) => {
            const fechaHora = String(item.fechaHora ?? item.FechaHora ?? '');
            const { fecha, hora } = splitFechaHora(fechaHora);
            const clientesRelacion = (item.citasClientes ?? item.CitasClientes ?? []) as Array<
              Record<string, unknown>
            >;
            const vehiculosRelacion = (item.citasVehiculos ?? item.CitasVehiculos ?? []) as Array<
              Record<string, unknown>
            >;
            const empleadosRelacion = (item.citasEmpleados ?? item.CitasEmpleados ?? []) as Array<
              Record<string, unknown>
            >;

            return {
              idCita: String(item.idCita ?? item.IdCita ?? ''),
              fecha,
              hora,
              servicio: String(item.servicio ?? item.Servicio ?? ''),
              estado: String(item.estado ?? item.Estado ?? ''),
              cedulaCliente: String(
                clientesRelacion[0]?.cedulaCliente ?? clientesRelacion[0]?.CedulaCliente ?? ''
              ),
              placa: String(
                vehiculosRelacion[0]?.placa ?? vehiculosRelacion[0]?.Placa ?? ''
              ),
              idEmpleado: String(
                empleadosRelacion[0]?.idEmpleado ?? empleadosRelacion[0]?.IdEmpleado ?? ''
              ),
            };
          })
          .filter((cita: Omit<CitaUsuario, 'vehiculo'>) => {
            return cita.cedulaCliente === clienteEncontrado.cedula;
          });

        const citasConVehiculo = await Promise.all(
          citasDelClienteBase.map(async (citaBase: Omit<CitaUsuario, 'vehiculo'>) => {
            if (!citaBase.placa) {
              return { ...citaBase, vehiculo: null } satisfies CitaUsuario;
            }

            const vehiculoResponse = await fetch(`${apiGatewayUrl}/vehiculos/${citaBase.placa}`);
            if (!vehiculoResponse.ok) {
              return { ...citaBase, vehiculo: null } satisfies CitaUsuario;
            }

            const vehiculoData = (await vehiculoResponse.json()) as Record<string, unknown>;

            return {
              ...citaBase,
              vehiculo: {
                placa: String(vehiculoData.placa ?? vehiculoData.Placa ?? ''),
                marca: String(vehiculoData.marca ?? vehiculoData.Marca ?? ''),
                modelo: String(vehiculoData.modelo ?? vehiculoData.Modelo ?? ''),
                year: String(vehiculoData.year ?? vehiculoData.Year ?? ''),
                tipo: String(vehiculoData.tipo ?? vehiculoData.Tipo ?? ''),
              },
            } satisfies CitaUsuario;
          })
        );

        if (!isMounted) return;

        setCliente(clienteEncontrado);
        setCitas(citasConVehiculo);
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Ocurrio un error al cargar las citas del usuario.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const confirmarCancelacion = async (citaSeleccionada: CitaUsuario) => {
    const Swal = (await import('sweetalert2')).default;
    const confirmation = await Swal.fire({
      title: 'Cancelar cita',
      text: 'Indica el motivo de la cancelacion.',
      input: 'textarea',
      inputPlaceholder: 'Escribe el motivo aqui...',
      inputAttributes: {
        'aria-label': 'Motivo de cancelacion',
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar cancelacion',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#E53E3E',
      preConfirm: (value) => {
        if (!String(value ?? '').trim()) {
          Swal.showValidationMessage('Por favor ingresa un motivo para cancelar la cita.');
          return false;
        }

        return String(value).trim();
      },
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setCancelLoadingId(citaSeleccionada.idCita);

      const body = new FormData();
      body.append('fechaHora', buildFechaHora(citaSeleccionada.fecha, citaSeleccionada.hora));
      body.append('servicio', citaSeleccionada.servicio);
      body.append('estado', 'Cancelada');

      const response = await fetchWithTimeout(`${apiGatewayUrl}/citas/${citaSeleccionada.idCita}`, {
        method: 'PUT',
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      setCitas((prev) =>
        prev.map((cita) =>
          cita.idCita === citaSeleccionada.idCita ? { ...cita, estado: 'Cancelada' } : cita
        )
      );

      await Swal.fire({
        icon: 'success',
        title: 'Cita cancelada',
        text: 'La cita fue cancelada exitosamente.',
      });
    } catch (cancelError) {
      const description =
        cancelError instanceof DOMException && cancelError.name === 'AbortError'
          ? 'La solicitud tardo demasiado. Revisa que el servicio de citas y el gateway esten activos.'
          : cancelError instanceof Error
          ? cancelError.message
          : 'Error desconocido al cancelar.';

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo cancelar',
        text: description,
      });
    } finally {
      setCancelLoadingId(null);
    }
  };

  const clienteNombreCompleto = useMemo(() => {
    return [cliente?.nombre, cliente?.apellidos].filter(Boolean).join(' ');
  }, [cliente?.apellidos, cliente?.nombre]);

  return (
    <ProtectedRoute>
      {
        <Box p={5}>
          <Heading color={textColor} fontSize="2xl" mb={2}>
            Mis Citas
          </Heading>
          <Text color="gray.500" mb={6}>
            Aqui puedes revisar el detalle de tus citas, tu informacion como cliente y los datos
            del vehiculo asociado.
          </Text>

          <Flex justify="flex-end" mb={6}>
            <Link href="/admin/citas/cita-usuario/crear">
              <Button colorScheme="blue">Agendar nueva cita</Button>
            </Link>
          </Flex>

          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" />
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="16px" mb={6}>
              <AlertIcon />
              <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
            </Alert>
          ) : citas.length === 0 ? (
            <Text color="gray.500">No tienes citas agendadas actualmente.</Text>
          ) : (
            <Stack spacing={6}>
              {citas.map((cita) => (
                <Box
                  key={cita.idCita}
                  bg={cardBg}
                  borderRadius="lg"
                  boxShadow="md"
                  p={6}
                >
                  <Flex justify="space-between" align={{ base: 'start', md: 'center' }} mb={4} gap={4} flexWrap="wrap">
                    <Box>
                      <Heading size="md" color={textColor}>
                        Cita #{cita.idCita}
                      </Heading>
                      <Text color={labelColor}>Estado: {cita.estado || 'Sin estado'}</Text>
                    </Box>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={() => confirmarCancelacion(cita)}
                      isDisabled={cita.estado.toLowerCase() === 'cancelada'}
                      isLoading={cancelLoadingId === cita.idCita}
                    >
                      Cancelar cita
                    </Button>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Box>
                      <Text fontWeight="bold" color={labelColor} mb={3}>
                        Detalle de la cita
                      </Text>
                      <Stack spacing={2}>
                        <Text color={textColor}>
                          <strong>Fecha:</strong> {cita.fecha || 'Sin fecha'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Hora:</strong> {cita.hora || 'Sin hora'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Servicio:</strong> {cita.servicio || 'Sin servicio'}
                        </Text>
                        <Text color={textColor}>
                          <strong>ID Empleado:</strong> {cita.idEmpleado || 'Sin asignar'}
                        </Text>
                      </Stack>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" color={labelColor} mb={3}>
                        Cliente
                      </Text>
                      <Stack spacing={2}>
                        <Text color={textColor}>
                          <strong>Nombre:</strong> {clienteNombreCompleto || 'Sin nombre'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Cedula:</strong> {cliente?.cedula || 'Sin cedula'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Telefono:</strong>{' '}
                          {cliente?.numeroTelefono || 'Sin telefono'}
                        </Text>
                      </Stack>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" color={labelColor} mb={3}>
                        Vehiculo
                      </Text>
                      <Stack spacing={2}>
                        <Text color={textColor}>
                          <strong>Placa:</strong> {cita.vehiculo?.placa || cita.placa || 'Sin placa'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Nombre:</strong>{' '}
                          {cita.vehiculo?.modelo || cita.vehiculo?.marca || 'Sin vehiculo asignado'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Marca:</strong> {cita.vehiculo?.marca || 'Sin marca'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Tipo:</strong> {cita.vehiculo?.tipo || 'Sin tipo'}
                        </Text>
                        <Text color={textColor}>
                          <strong>Año:</strong> {cita.vehiculo?.year || 'Sin año'}
                        </Text>
                      </Stack>
                    </Box>
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          )}

        </Box>
      }
    </ProtectedRoute>
  );
}
