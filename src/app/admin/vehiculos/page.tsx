'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import VehiculosTable from './components/VehiculosTable';
import { Vehiculo } from './types';

export default function VehiculosPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [busqueda, setBusqueda] = useState('');
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchVehiculos = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/vehiculos`);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data?.data ?? [];

        const normalized = rawList.map((item: Record<string, unknown>) => {
          const clientes = (item.vehiculosClientes ??
            item.VehiculosClientes ??
            []) as Array<Record<string, unknown>>;
          const firstCliente = clientes[0] ?? {};

          return {
            placa: String(item.placa ?? item.Placa ?? ''),
            marca: String(item.marca ?? item.Marca ?? ''),
            modelo: String(item.modelo ?? item.Modelo ?? ''),
            year: String(item.year ?? item.Year ?? ''),
            tipo: String(item.tipo ?? item.Tipo ?? ''),
            cedulaCliente: String(
              firstCliente.cedulaCliente ??
                firstCliente.CedulaCliente ??
                ''
            ),
          } as Vehiculo;
        });

        if (isMounted) {
          setVehiculos(normalized);
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

    fetchVehiculos();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleDelete = async (placa: string) => {
    const response = await fetch(`${apiGatewayUrl}/vehiculos/${placa}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Error HTTP ${response.status}`);
    }

    setVehiculos((prev) => prev.filter((vehiculo) => vehiculo.placa !== placa));
  };

  const vehiculosFiltrados = vehiculos.filter((vehiculo) =>
    vehiculo.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
    (vehiculo.cedulaCliente || '')
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <ProtectedRoute requiredScopes={['empleados.write']}>{
    <Box p={5}>
      <Heading color={textColor} fontSize="2xl" mb={2}>
        Vehículos
      </Heading>
      <Text color="gray.500" mb={6}>
        Gestión y registro de vehículos asociados a clientes
      </Text>

      <Flex mb={4} gap={4} flexWrap="wrap">
        <Link href="/admin/vehiculos/crear">
          <Button colorScheme="blue">Registrar vehículo</Button>
        </Link>
        <Input
          placeholder="Buscar por placa o cliente"
          maxW="300px"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Flex>

      {loading ? (
        <Text color="gray.500">Cargando vehículos...</Text>
      ) : error ? (
        <Text color="red.500">No se pudo cargar: {error}</Text>
      ) : vehiculosFiltrados.length > 0 ? (
        <VehiculosTable data={vehiculosFiltrados} onDelete={handleDelete} />
      ) : (
        <Text color="gray.500">No se encontraron vehículos con esos datos</Text>
      )}
    </Box>
    }</ProtectedRoute>
  );
}
