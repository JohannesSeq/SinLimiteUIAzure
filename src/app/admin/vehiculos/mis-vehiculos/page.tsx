'use client';

import ProtectedRoute from 'components/Auth/ProtectedRoute';
import {
  Box,
  Button,
  Flex,
  Heading,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import VehiculosTable from '../components/VehiculosTable';
import { Vehiculo } from '../types';
import { useAuth } from 'contexts/AuthContext';

type ClienteActual = {
  cedula: string;
  nombre: string;
  apellidos: string;
};

const normalizeVehiculos = (data: unknown, cedulaClienteActual?: string): Vehiculo[] => {
  const rawList = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
    ? (
        (Array.isArray((data as { data?: unknown[] }).data) && (data as { data: unknown[] }).data) ||
        (Array.isArray((data as { items?: unknown[] }).items) && (data as { items: unknown[] }).items) ||
        []
      )
    : [];

  return rawList.map((item) => {
    const record = item as Record<string, unknown>;
    const clientes = (record.vehiculosClientes ??
      record.VehiculosClientes ??
      []) as Array<Record<string, unknown>>;
    const clienteActualRelacion = clientes.find((cliente) => {
      const cedula = String(cliente.cedulaCliente ?? cliente.CedulaCliente ?? '');
      return cedula === String(cedulaClienteActual ?? '');
    });
    const firstCliente = clienteActualRelacion ?? clientes[0] ?? {};

    return {
      placa: String(record.placa ?? record.Placa ?? ''),
      marca: String(record.marca ?? record.Marca ?? ''),
      modelo: String(record.modelo ?? record.Modelo ?? ''),
      year: String(record.year ?? record.Year ?? ''),
      tipo: String(record.tipo ?? record.Tipo ?? ''),
      cedulaCliente: String(firstCliente.cedulaCliente ?? firstCliente.CedulaCliente ?? ''),
    };
  });
};

const normalizeCliente = (data: unknown): ClienteActual => {
  const item = (data ?? {}) as Record<string, unknown>;

  return {
    cedula: String(item.cedula ?? item.CEDULA ?? item.Cedula ?? ''),
    nombre: String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? ''),
    apellidos: String(item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''),
  };
};

const normalizeClientes = (data: unknown) => {
  const rawList = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
    ? (
        (Array.isArray((data as { data?: unknown[] }).data) && (data as { data: unknown[] }).data) ||
        (Array.isArray((data as { items?: unknown[] }).items) && (data as { items: unknown[] }).items) ||
        []
      )
    : [];

  return rawList.map((item) => {
    const record = item as Record<string, unknown>;

    return {
      cedula: String(record.cedula ?? record.CEDULA ?? record.Cedula ?? ''),
      nombre: String(record.nombre ?? record.NOMBRE ?? record.Nombre ?? ''),
      apellidos: String(record.apellidos ?? record.APELLIDOS ?? record.Apellidos ?? ''),
      idUsuario: String(record.idUsuario ?? record.ID_USUARIO ?? record.IdUsuario ?? ''),
    };
  });
};

export default function MisVehiculosPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedText = useColorModeValue('gray.500', 'gray.300');
  const { user, loading: authLoading } = useAuth();

  const [cliente, setCliente] = useState<ClienteActual | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (placa: string) => {
    const response = await fetch(`${apiGatewayUrl}/vehiculos/${placa}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Error HTTP ${response.status}`);
    }

    setVehiculos((prev) => prev.filter((vehiculo) => vehiculo.placa !== placa));
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setLoading(false);
      setCliente(null);
      setVehiculos([]);
      setError('No se pudo identificar el usuario autenticado.');
      return;
    }

    let isMounted = true;

    const fetchMisVehiculos = async () => {
      try {
        setLoading(true);
        setError(null);

        const clienteResponse = await fetch(`${apiGatewayUrl}/clientes`, {
          credentials: 'include',
        });

        if (!clienteResponse.ok) {
          const message = await clienteResponse.text();
          throw new Error(message || `Error HTTP ${clienteResponse.status}`);
        }

        const clientesData = normalizeClientes(await clienteResponse.json());
        const clienteEncontrado = clientesData.find(
          (clienteItem) => clienteItem.idUsuario === user.id
        );

        const clienteData = clienteEncontrado
          ? normalizeCliente(clienteEncontrado)
          : null;

        if (!clienteData?.cedula) {
          throw new Error('El usuario no tiene un cliente asociado.');
        }

        const vehiculosResponse = await fetch(
          `${apiGatewayUrl}/vehiculos/cliente/${clienteData.cedula}`,
          {
            credentials: 'include',
          }
        );

        if (vehiculosResponse.status === 404) {
          if (!isMounted) {
            return;
          }

          setCliente(clienteData);
          setVehiculos([]);
          return;
        }

        if (!vehiculosResponse.ok) {
          const message = await vehiculosResponse.text();
          throw new Error(message || `Error HTTP ${vehiculosResponse.status}`);
        }

        const vehiculosData = normalizeVehiculos(
          await vehiculosResponse.json(),
          clienteData.cedula
        ).filter((vehiculo) => vehiculo.cedulaCliente === clienteData.cedula);

        if (!isMounted) {
          return;
        }

        setCliente(clienteData);
        setVehiculos(vehiculosData);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setCliente(null);
        setVehiculos([]);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMisVehiculos();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, authLoading, user?.id]);

  return (
    <ProtectedRoute>
      <Box p={5}>
        <Heading color={textColor} fontSize="2xl" mb={2}>
          Mis vehículos
        </Heading>
        <Text color={mutedText} mb={6}>
          Visualización y gestión de los vehículos asociados a tu cuenta.
        </Text>

        <Flex
          mb={4}
          gap={4}
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
        >
          <Box>
            {loading ? (
              <Skeleton h="20px" w="240px" />
            ) : cliente ? (
              <Text color={mutedText}>
                Cliente asociado: {cliente.nombre} {cliente.apellidos} ({cliente.cedula})
              </Text>
            ) : (
              <Text color="red.500">{error ?? 'No se encontró un cliente asociado.'}</Text>
            )}
          </Box>

          <Link href="/admin/vehiculos/mis-vehiculos/crear">
            <Button colorScheme="blue" isDisabled={loading || !cliente}>
              Registrar vehículo
            </Button>
          </Link>
        </Flex>

        {loading ? (
          <Stack spacing={4}>
            <Skeleton h="56px" borderRadius="16px" />
            <Skeleton h="56px" borderRadius="16px" />
            <Skeleton h="56px" borderRadius="16px" />
          </Stack>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : vehiculos.length === 0 ? (
          <Text color={mutedText}>El usuario no tiene vehiculos registrados.</Text>
        ) : (
          <VehiculosTable
            data={vehiculos}
            showActions
            onDelete={handleDelete}
            editBasePath="/admin/vehiculos/mis-vehiculos/editar"
          />
        )}
      </Box>
    </ProtectedRoute>
  );
}
