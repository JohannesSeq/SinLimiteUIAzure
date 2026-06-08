'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react';
import ClientesTable from './components/ClientesTable';
import { Cliente } from './types';
import * as React from 'react';

export default function ClientesPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchClientes = async () => {
      try {
        const response = await fetch(
          `${apiGatewayUrl}/clientes`
        );

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data?.data ?? [];

        const normalized = rawList.map((item: Record<string, unknown>) => ({
          cedula: String(
            item.cedula ?? item.CEDULA ?? item.Cedula ?? ''
          ),
          nombre: String(
            item.nombre ?? item.NOMBRE ?? item.Nombre ?? ''
          ),
          apellidos: String(
            item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''
          ),
          numeroTelefono: String(
            item.numeroTelefono ??
              item.numeroDeTelefono ??
              item.NUMERO_DE_TELEFONO ??
              item.Numero_De_Telefono ??
              item.NumeroDeTelefono ??
              ''
          ),
          idUsuario: String(
            item.idUsuario ?? item.ID_USUARIO ?? item.Id_Usuario ?? ''
          ),
        }));

        if (isMounted) {
          setClientes(normalized);
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

    fetchClientes();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleDelete = React.useCallback(
    async (cedula: string) => {
      const cliente = clientes.find((item) => item.cedula === cedula);

      if (!cliente) {
        throw new Error('No se encontro el cliente seleccionado.');
      }

      if (cliente.idUsuario) {
        const usuarioResponse = await fetch(
          `${apiGatewayUrl}/usuarios/${cliente.idUsuario}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!usuarioResponse.ok) {
          const usuarioMessage = await usuarioResponse.text();
          throw new Error(
            usuarioMessage ||
              'No se pudo eliminar el cliente porque fallo la eliminacion del usuario asociado.'
          );
        }
      }

      const response = await fetch(`${apiGatewayUrl}/clientes/${cedula}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      setClientes((prev) => prev.filter((cliente) => cliente.cedula !== cedula));
    },
    [apiGatewayUrl, clientes]
  );

  return (
    <ProtectedRoute requiredScopes={['clientes.read']}>{
    <Box p={5}>
      <Heading color={textColor} fontSize="2xl" mb={2}>
        Clientes
      </Heading>
      <Text color="gray.500" mb={6}>
        Gestión de clientes registrados en el sistema
      </Text>
      {loading ? (
        <Text color="gray.500">Cargando clientes...</Text>
      ) : error ? (
        <Text color="red.500">No se pudo cargar: {error}</Text>
      ) : (
        <ClientesTable data={clientes} onDelete={handleDelete} />
      )}
    </Box>
    }</ProtectedRoute>
  );
}
