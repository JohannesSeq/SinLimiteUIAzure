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
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

type ClienteDetalle = {
  cedula: string;
  nombre: string;
  apellidos: string;
  numeroTelefono: string;
};

type VehiculoDetalle = {
  placa: string;
  marca: string;
  modelo: string;
  year: string;
  tipo: string;
};

type CitaDetalle = {
  idCita: string;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string;
  cedulaCliente: string;
  idEmpleado: string;
  placa: string;
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

function DetallesCitaContent() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const labelColor = useColorModeValue('gray.500', 'gray.300');
  const cardBg = useColorModeValue('white', 'navy.800');
  const searchParams = useSearchParams();
  const idCita = searchParams.get('idCita') ?? '';

  const [cita, setCita] = useState<CitaDetalle | null>(null);
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetalle = async () => {
      if (!idCita) {
        setError('No se recibio el ID de la cita.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const citaResponse = await fetch(`${apiGatewayUrl}/citas/${idCita}`);
        if (!citaResponse.ok) {
          const message = await citaResponse.text();
          throw new Error(message || `Error HTTP ${citaResponse.status}`);
        }

        const item = (await citaResponse.json()) as Record<string, unknown>;
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

        const citaBase = {
          idCita: String(item.idCita ?? item.IdCita ?? ''),
          fecha,
          hora,
          servicio: String(item.servicio ?? item.Servicio ?? ''),
          estado: String(item.estado ?? item.Estado ?? ''),
          cedulaCliente: String(
            clientesRelacion[0]?.cedulaCliente ?? clientesRelacion[0]?.CedulaCliente ?? ''
          ),
          placa: String(vehiculosRelacion[0]?.placa ?? vehiculosRelacion[0]?.Placa ?? ''),
          idEmpleado: String(
            empleadosRelacion[0]?.idEmpleado ?? empleadosRelacion[0]?.IdEmpleado ?? ''
          ),
        } satisfies CitaDetalle;

        let clienteDetalle: ClienteDetalle | null = null;
        let vehiculoDetalle: VehiculoDetalle | null = null;

        if (citaBase.cedulaCliente) {
          const clienteResponse = await fetch(`${apiGatewayUrl}/clientes/${citaBase.cedulaCliente}`);
          if (clienteResponse.ok) {
            const clienteData = (await clienteResponse.json()) as Record<string, unknown>;
            clienteDetalle = {
              cedula: String(clienteData.cedula ?? clienteData.Cedula ?? ''),
              nombre: String(clienteData.nombre ?? clienteData.Nombre ?? ''),
              apellidos: String(clienteData.apellidos ?? clienteData.Apellidos ?? ''),
              numeroTelefono: String(
                clienteData.numeroTelefono ??
                  clienteData.numeroDeTelefono ??
                  clienteData.NumeroDeTelefono ??
                  ''
              ),
            };
          }
        }

        if (citaBase.placa) {
          const vehiculoResponse = await fetch(`${apiGatewayUrl}/vehiculos/${citaBase.placa}`);
          if (vehiculoResponse.ok) {
            const vehiculoData = (await vehiculoResponse.json()) as Record<string, unknown>;
            vehiculoDetalle = {
              placa: String(vehiculoData.placa ?? vehiculoData.Placa ?? ''),
              marca: String(vehiculoData.marca ?? vehiculoData.Marca ?? ''),
              modelo: String(vehiculoData.modelo ?? vehiculoData.Modelo ?? ''),
              year: String(vehiculoData.year ?? vehiculoData.Year ?? ''),
              tipo: String(vehiculoData.tipo ?? vehiculoData.Tipo ?? ''),
            };
          }
        }

        if (!isMounted) return;

        setCita(citaBase);
        setCliente(clienteDetalle);
        setVehiculo(vehiculoDetalle);
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Ocurrio un error al cargar el detalle de la cita.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetalle();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, idCita]);

  const clienteNombreCompleto = useMemo(() => {
    return [cliente?.nombre, cliente?.apellidos].filter(Boolean).join(' ');
  }, [cliente?.apellidos, cliente?.nombre]);

  return (
    <ProtectedRoute requiredScopes={['citas.read']}>
      {
        <Box maxW="900px" mx="auto" mt={10}>
          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} mb={6} gap={4} flexWrap="wrap">
            <Heading color={textColor} fontSize="2xl">
              Detalles de la cita
            </Heading>
            <Link href="/admin/citas">
              <Button variant="ghost">Volver al listado</Button>
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
          ) : !cita ? (
            <Text color="gray.500">No se encontro la cita solicitada.</Text>
          ) : (
            <Box bg={cardBg} borderRadius="lg" boxShadow="md" p={6}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Box>
                  <Text fontWeight="bold" color={labelColor} mb={3}>
                    Cita
                  </Text>
                  <Stack spacing={2}>
                    <Text color={textColor}>
                      <strong>ID:</strong> {cita.idCita}
                    </Text>
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
                      <strong>Estado:</strong> {cita.estado || 'Sin estado'}
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
                      <strong>Cedula:</strong> {cliente?.cedula || cita.cedulaCliente || 'Sin cedula'}
                    </Text>
                    <Text color={textColor}>
                      <strong>Telefono:</strong> {cliente?.numeroTelefono || 'Sin telefono'}
                    </Text>
                  </Stack>
                </Box>

                <Box>
                  <Text fontWeight="bold" color={labelColor} mb={3}>
                    Vehiculo
                  </Text>
                  <Stack spacing={2}>
                    <Text color={textColor}>
                      <strong>Placa:</strong> {vehiculo?.placa || cita.placa || 'Sin placa'}
                    </Text>
                    <Text color={textColor}>
                      <strong>Nombre:</strong> {vehiculo?.modelo || vehiculo?.marca || 'Sin vehiculo'}
                    </Text>
                    <Text color={textColor}>
                      <strong>Marca:</strong> {vehiculo?.marca || 'Sin marca'}
                    </Text>
                    <Text color={textColor}>
                      <strong>Tipo:</strong> {vehiculo?.tipo || 'Sin tipo'}
                    </Text>
                    <Text color={textColor}>
                      <strong>Año:</strong> {vehiculo?.year || 'Sin año'}
                    </Text>
                  </Stack>
                </Box>
              </SimpleGrid>
            </Box>
          )}
        </Box>
      }
    </ProtectedRoute>
  );
}

export default function DetallesCitaPage() {
  return (
    <Suspense fallback={null}>
      <DetallesCitaContent />
    </Suspense>
  );
}
