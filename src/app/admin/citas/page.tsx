'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import CitasTable from './components/CitasTable';
import { Cita } from './types';
import { useEffect, useState } from 'react';
import Card from 'components/card/Card'; // Asegúrate de tener este componente como en empleados

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

export default function CitasPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const [citasRes, clientesRes, empleadosRes] = await Promise.all([
          fetch(`${apiGatewayUrl}/citas`),
          fetch(`${apiGatewayUrl}/clientes`),
          fetch(`${apiGatewayUrl}/empleados`),
        ]);

        if (!citasRes.ok) throw new Error(`Error HTTP ${citasRes.status}`);

        const [citasData, clientesData, empleadosData] = await Promise.all([
          citasRes.json(),
          clientesRes.ok ? clientesRes.json() : [],
          empleadosRes.ok ? empleadosRes.json() : [],
        ]);

        const clienteMap = new Map<string, string>();
        (Array.isArray(clientesData) ? clientesData : clientesData?.data ?? [])
          .forEach((c: Record<string, unknown>) => {
            const cedula = String(c.cedula ?? c.CEDULA ?? c.Cedula ?? '');
            const nombre = `${c.nombre ?? c.Nombre ?? ''} ${c.apellidos ?? c.Apellidos ?? ''}`.trim();
            if (cedula) clienteMap.set(cedula, nombre);
          });

        const empleadoMap = new Map<string, string>();
        (Array.isArray(empleadosData) ? empleadosData : empleadosData?.data ?? [])
          .forEach((e: Record<string, unknown>) => {
            const id = String(e.idEmpleado ?? e.ID_EMPLEADO ?? e.IdEmpleado ?? '');
            const nombre = `${e.nombre ?? e.Nombre ?? ''} ${e.apellidos ?? e.Apellidos ?? ''}`.trim();
            if (id) empleadoMap.set(id, nombre);
          });

        const rawList = Array.isArray(citasData) ? citasData : citasData?.data ?? [];

        const normalized = rawList.map((item: Record<string, unknown>) => {
          const fechaHora = String(item.fechaHora ?? item.FechaHora ?? '');
          const { fecha, hora } = splitFechaHora(fechaHora);
          const clientes = (item.citasClientes ?? item.CitasClientes ?? []) as Array<Record<string, unknown>>;
          const vehiculos = (item.citasVehiculos ?? item.CitasVehiculos ?? []) as Array<Record<string, unknown>>;
          const empleados = (item.citasEmpleados ?? item.CitasEmpleados ?? []) as Array<Record<string, unknown>>;

          const firstCliente = clientes[0] ?? {};
          const firstVehiculo = vehiculos[0] ?? {};
          const firstEmpleado = empleados[0] ?? {};

          const cedulaCliente = String(firstCliente.cedulaCliente ?? firstCliente.CedulaCliente ?? '');
          const idEmpleado = String(firstEmpleado.idEmpleado ?? firstEmpleado.IdEmpleado ?? '');

          return {
            idCita: String(item.idCita ?? item.IdCita ?? ''),
            fecha,
            hora,
            servicio: String(item.servicio ?? item.Servicio ?? ''),
            estado: String(item.estado ?? item.Estado ?? ''),
            cedulaCliente,
            nombreCliente: clienteMap.get(cedulaCliente) ?? '',
            placa: String(firstVehiculo.placa ?? firstVehiculo.Placa ?? ''),
            idEmpleado,
            nombreEmpleado: empleadoMap.get(idEmpleado) ?? '',
          } as Cita;
        });

        if (isMounted) {
          setCitas(normalized);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleDelete = async (idCita: string) => {
    const response = await fetch(`${apiGatewayUrl}/citas/${idCita}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Error HTTP ${response.status}`);
    }

    setCitas((prev) => prev.filter((cita) => cita.idCita !== idCita));
  };

  const citasFiltradas = citas.filter((cita) => {
    const texto = filtroTexto.toLowerCase();
    const coincide =
      !filtroTexto ||
      (cita.nombreCliente || cita.cedulaCliente || '').toLowerCase().includes(texto) ||
      (cita.nombreEmpleado || cita.idEmpleado || '').toLowerCase().includes(texto);

    const dentroDeRango =
      (!fechaDesde || cita.fecha >= fechaDesde) &&
      (!fechaHasta || cita.fecha <= fechaHasta);

    return coincide && dentroDeRango;
  });

  return (
    <ProtectedRoute requiredScopes={['citas.read']}>{
    <Box p={5}>
      <Heading color={textColor} fontSize="2xl" mb={2}>
        Citas
      </Heading>
      <Text color="gray.500" mb={6}>
        Gestión de agenda de citas y servicios
      </Text>

      <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
        <Box px={6} py={4}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            mb={4}
            flexWrap="wrap"
            justify="space-between"
          >
            <Flex gap={3} flexWrap="wrap">
              <InputGroup maxW="280px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder="Buscar cliente o técnico"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                />
              </InputGroup>
            </Flex>

            <Flex gap={4} flexWrap="wrap" align="flex-end">
              <Flex gap={3} align="flex-end">
                <Text fontSize="sm" color="gray.500" fontWeight="500" mb={1}>
                  Filtrar por fechas
                </Text>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb={1}>Desde</Text>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    maxW="160px"
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb={1}>Hasta</Text>
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    maxW="160px"
                  />
                </Box>
              </Flex>
              <Button
                variant="outline"
                onClick={() => {
                  setFiltroTexto('');
                  setFechaDesde('');
                  setFechaHasta('');
                }}
              >
                Limpiar filtros
              </Button>
            </Flex>

            <Link href="/admin/citas/crear">
              <Button colorScheme="blue" minW="150px">Crear cita</Button>
            </Link>
          </Flex>

          {loading ? (
            <Text color="gray.500" mt={4}>
              Cargando citas...
            </Text>
          ) : error ? (
            <Text color="red.500" mt={4}>
              No se pudo cargar: {error}
            </Text>
          ) : citasFiltradas.length > 0 ? (
            <CitasTable data={citasFiltradas} onDelete={handleDelete} />
          ) : (
            <Text color="gray.500" mt={4}>
              No se encontraron citas con esos filtros
            </Text>
          )}
        </Box>
      </Card>
    </Box>
  }</ProtectedRoute>
  );
}
