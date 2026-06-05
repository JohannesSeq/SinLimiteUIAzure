'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Select,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EmpleadosTable from './components/EmpleadosTable';
import { Empleado } from './types';
import Link from 'next/link';

export default function EmpleadosPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [busqueda, setBusqueda] = useState('');
  const [puestoFiltro, setPuestoFiltro] = useState('');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEmpleados = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/empleados`);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data?.data ?? [];

        const normalized: Empleado[] = rawList.map((item: Record<string, unknown>) => {
          const puestoObj = (item.puesto ?? item.Puesto ?? {}) as Record<string, unknown>;
          const departamentoObj = (item.departamento ?? item.Departamento ?? {}) as Record<
            string,
            unknown
          >;

          return {
            idEmpleado: Number(item.idEmpleado ?? item.ID_EMPLEADO ?? item.IdEmpleado ?? 0),
            idPuesto: String(item.idPuesto ?? item.ID_PUESTO ?? item.IdPuesto ?? ''),
            idDepartamento: String(
              item.idDepartamento ?? item.ID_DEPARTAMENTO ?? item.IdDepartamento ?? ''
            ),
            idUsuario: String(item.idUsuario ?? item.ID_USUARIO ?? item.IdUsuario ?? ''),
            nombre: String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? ''),
            apellidos: String(item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''),
            numeroTelefono: String(
              item.numeroTelefono ??
                item.numeroDeTelefono ??
                item.NUMERO_DE_TELEFONO ??
                item.Numero_De_Telefono ??
                item.NumeroDeTelefono ??
                ''
            ),
            puesto: String(
              puestoObj.nombrePuesto ??
                puestoObj.NOMBRE_PUESTO ??
                puestoObj.NombrePuesto ??
                'Sin puesto'
            ),
            departamento: String(
              departamentoObj.nombreDepartamento ??
                departamentoObj.NOMBRE_DEPARTAMENTO ??
                departamentoObj.NombreDepartamento ??
                'Sin departamento'
            ),
          };
        });

        if (isMounted) {
          setEmpleados(normalized);
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

    fetchEmpleados();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const puestosUnicos = useMemo(
    () => Array.from(new Set(empleados.map((e) => e.puesto).filter(Boolean))),
    [empleados]
  );

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((empleado) => {
      const texto = `${empleado.nombre} ${empleado.apellidos}`.toLowerCase();
      const coincideNombre = texto.includes(busqueda.toLowerCase());
      const coincidePuesto = puestoFiltro === '' || empleado.puesto === puestoFiltro;
      return coincideNombre && coincidePuesto;
    });
  }, [busqueda, empleados, puestoFiltro]);

  const handleDelete = useCallback(
    async (idEmpleado: number) => {
      const empleado = empleados.find((item) => item.idEmpleado === idEmpleado);

      if (!empleado) {
        throw new Error('No se encontro el empleado seleccionado.');
      }

      if (empleado.idUsuario) {
        const usuarioResponse = await fetch(
          `${apiGatewayUrl}/usuarios/${empleado.idUsuario}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!usuarioResponse.ok) {
          const usuarioMessage = await usuarioResponse.text();
          throw new Error(
            usuarioMessage ||
              'No se pudo eliminar el empleado porque fallo la eliminacion del usuario asociado.'
          );
        }
      }

      const response = await fetch(`${apiGatewayUrl}/empleados/${idEmpleado}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      setEmpleados((prev) => prev.filter((empleado) => empleado.idEmpleado !== idEmpleado));
    },
    [apiGatewayUrl, empleados]
  );

  return (
    <ProtectedRoute requiredScopes={['empleados.read']}>{
    <Box p={5}>
      <Heading color={textColor} fontSize="2xl" mb={2}>
        Empleados
      </Heading>
      <Text color="gray.500" mb={6}>
        Administración de empleados del sistema
      </Text>

      <Flex mb={4} gap={4} flexWrap="wrap">
        <Link href="/admin/empleados/crear">
          <Button colorScheme="blue">Crear empleado</Button>
        </Link>
        <Link href="/admin/empleados/departamentos">
          <Button variant="outline" colorScheme="teal">
            Departamentos
          </Button>
        </Link>
        <Link href="/admin/empleados/puestos">
          <Button variant="outline" colorScheme="purple">
            Puestos
          </Button>
        </Link>

        <Input
          placeholder="Buscar por nombre o apellidos"
          maxW="250px"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Select
          placeholder="Filtrar por puesto"
          maxW="250px"
          value={puestoFiltro}
          onChange={(e) => setPuestoFiltro(e.target.value)}
        >
          {puestosUnicos.map((puesto) => (
            <option key={puesto} value={puesto}>
              {puesto}
            </option>
          ))}
        </Select>
      </Flex>

      {loading ? (
        <Text color="gray.500">Cargando empleados...</Text>
      ) : error ? (
        <Text color="red.500">No se pudo cargar: {error}</Text>
      ) : empleadosFiltrados.length > 0 ? (
        <EmpleadosTable data={empleadosFiltrados} onDelete={handleDelete} />
      ) : (
        <Text color="gray.500">No se encontraron empleados con esos filtros</Text>
      )}
    </Box>
    }</ProtectedRoute>
  );
}
