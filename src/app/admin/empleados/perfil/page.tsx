'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Flex,
  Heading,
  Stack,
  Text,
  Spinner,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';

interface EmpleadoPerfil {
  idEmpleado: number;
  idUsuario?: string;
  nombre: string;
  apellidos: string;
  numeroDeTelefono?: number;
  puesto?: {
    nombrePuesto?: string;
    salarioBase?: number;
  };
  departamento?: {
    nombreDepartamento?: string;
  };
}

function PerfilEmpleadoContent() {
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const searchParams = useSearchParams();
  const idEmpleado = searchParams.get('idEmpleado');
  const textColor = useColorModeValue('navy.700', 'white');
  const toast = useToast();

  const [empleado, setEmpleado] = useState<EmpleadoPerfil | null>(null);
  const [correoUsuario, setCorreoUsuario] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idEmpleado) return;

    fetch(`${apiGatewayUrl}/empleados/${idEmpleado}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as EmpleadoPerfil;

        if (data.idUsuario) {
          const usuarioRes = await fetch(`${apiGatewayUrl}/usuarios/${data.idUsuario}`, {
            credentials: 'include',
          });

          if (usuarioRes.ok) {
            const usuario = (await usuarioRes.json()) as {
              correo?: string;
              Correo?: string;
            };
            setCorreoUsuario(String(usuario.correo ?? usuario.Correo ?? ''));
          } else {
            setCorreoUsuario('');
          }
        } else {
          setCorreoUsuario('');
        }

        return data;
      })
      .then((data) => setEmpleado(data))
      .catch(() =>
        toast({
          title: 'Error',
          description: 'No se pudo cargar el perfil del empleado.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      )
      .finally(() => setLoading(false));
  }, [apiGatewayUrl, idEmpleado, toast]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!empleado) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Text>No se encontro el empleado.</Text>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      pt={{ base: '130px', md: '80px', xl: '80px' }}
      align="center"
    >
      <Box
        bg="white"
        _dark={{ bg: 'navy.800' }}
        p={8}
        borderRadius="lg"
        boxShadow="md"
        maxW="600px"
        w="100%"
      >
        <Heading size="lg" color={textColor} mb={4}>
          Perfil del Empleado
        </Heading>

        <Stack spacing={3}>
          <Text>
            <strong>Nombre:</strong> {empleado.nombre} {empleado.apellidos}
          </Text>

          <Text>
            <strong>Correo:</strong> {correoUsuario || 'No registrado'}
          </Text>

          <Text>
            <strong>ID Usuario:</strong> {empleado.idUsuario ?? 'No registrado'}
          </Text>

          <Text>
            <strong>Departamento:</strong>{' '}
            {empleado.departamento?.nombreDepartamento ?? 'No asignado'}
          </Text>

          <Text>
            <strong>Puesto:</strong>{' '}
            {empleado.puesto?.nombrePuesto ?? 'No asignado'}
          </Text>

          <Text>
            <strong>Salario base:</strong>{' '}
            {empleado.puesto?.salarioBase ?? 'No registrado'}
          </Text>

          <Text>
            <strong>Telefono:</strong>{' '}
            {empleado.numeroDeTelefono ?? 'No registrado'}
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
}

export default function PerfilEmpleadoPage() {
  return (
    <Suspense fallback={null}>
      <PerfilEmpleadoContent />
    </Suspense>
  );
}
