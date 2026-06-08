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
import DepartamentosTable from './components/DepartamentosTable';
import { Departamento } from './types';

export default function DepartamentosPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [busqueda, setBusqueda] = useState('');
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDepartamentos = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/departamentos`);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = (await response.json()) as Array<Record<string, unknown>>;
        if (!isMounted) return;

        setDepartamentos(
          data.map((item) => ({
            idDepartamento: String(
              item.idDepartamento ?? item.ID_DEPARTAMENTO ?? item.IdDepartamento ?? ''
            ),
            nombreDepartamento: String(
              item.nombreDepartamento ??
                item.NOMBRE_DEPARTAMENTO ??
                item.NombreDepartamento ??
                ''
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

    fetchDepartamentos();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleDelete = async (idDepartamento: string) => {
    const response = await fetch(`${apiGatewayUrl}/departamentos/${idDepartamento}`, {
      method: 'DELETE',
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        responseData?.Error ?? responseData?.Msg ?? `Error HTTP ${response.status}`
      );
    }

    setDepartamentos((prev) =>
      prev.filter((departamento) => departamento.idDepartamento !== idDepartamento)
    );
  };

  const departamentosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return departamentos.filter((departamento) => {
      return (
        departamento.nombreDepartamento.toLowerCase().includes(q) ||
        departamento.descripcion.toLowerCase().includes(q)
      );
    });
  }, [busqueda, departamentos]);

  return (
    <ProtectedRoute requiredScopes={['empleados.read']}>
      {
        <Box p={5}>
          <Heading color={textColor} fontSize="2xl" mb={2}>
            Departamentos
          </Heading>
          <Text color="gray.500" mb={6}>
            Gestiona los departamentos del modulo de empleados.
          </Text>

          <Flex mb={4} gap={4} flexWrap="wrap">
            <Link href="/admin/empleados/departamentos/crear">
              <Button colorScheme="blue">Crear departamento</Button>
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
            <Text color="gray.500">Cargando departamentos...</Text>
          ) : error ? (
            <Text color="red.500">No se pudo cargar: {error}</Text>
          ) : (
            <DepartamentosTable data={departamentosFiltrados} onDelete={handleDelete} />
          )}
        </Box>
      }
    </ProtectedRoute>
  );
}
