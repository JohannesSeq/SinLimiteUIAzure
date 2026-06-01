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
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PuestosTable from './components/PuestosTable';
import { Puesto } from './types';

export default function PuestosPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [busqueda, setBusqueda] = useState('');
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPuestos = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/puestos`);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = (await response.json()) as Array<Record<string, unknown>>;
        if (!isMounted) return;

        setPuestos(
          data.map((item) => ({
            idPuesto: String(item.idPuesto ?? item.ID_PUESTO ?? item.IdPuesto ?? ''),
            nombrePuesto: String(
              item.nombrePuesto ?? item.NOMBRE_PUESTO ?? item.NombrePuesto ?? ''
            ),
            salarioBase: Number(
              item.salarioBase ?? item.SALARIO_BASE ?? item.SalarioBase ?? 0
            ),
            descripcion: String(
              item.descripcion ?? item.DESCRIPCION ?? item.Descripcion ?? ''
            ),
          }))
        );
        setError(null);
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

    fetchPuestos();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleDelete = async (idPuesto: string) => {
    const response = await fetch(`${apiGatewayUrl}/puestos/${idPuesto}`, {
      method: 'DELETE',
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        responseData?.Error ?? responseData?.Msg ?? `Error HTTP ${response.status}`
      );
    }

    setPuestos((prev) => prev.filter((puesto) => puesto.idPuesto !== idPuesto));
  };

  const puestosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return puestos.filter((puesto) => {
      return (
        puesto.nombrePuesto.toLowerCase().includes(q) ||
        puesto.descripcion.toLowerCase().includes(q)
      );
    });
  }, [busqueda, puestos]);

  return (
    <ProtectedRoute requiredScopes={['empleados.read']}>
      {
        <Box p={5}>
          <Heading color={textColor} fontSize="2xl" mb={2}>
            Puestos
          </Heading>
          <Text color="gray.500" mb={6}>
            Gestiona los puestos disponibles para los empleados.
          </Text>

          <Flex mb={4} gap={4} flexWrap="wrap">
            <Link href="/admin/empleados/puestos/crear">
              <Button colorScheme="blue">Crear puesto</Button>
            </Link>
            <Link href="/admin/empleados">
              <Button variant="ghost">Volver a empleados</Button>
            </Link>
            <Input
              placeholder="Buscar por nombre o descripcion"
              maxW="320px"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </Flex>

          {loading ? (
            <Text color="gray.500">Cargando puestos...</Text>
          ) : error ? (
            <Text color="red.500">No se pudo cargar: {error}</Text>
          ) : (
            <PuestosTable data={puestosFiltrados} onDelete={handleDelete} />
          )}
        </Box>
      }
    </ProtectedRoute>
  );
}
