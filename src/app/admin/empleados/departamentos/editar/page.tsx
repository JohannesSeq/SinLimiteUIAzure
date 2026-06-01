'use client';

import ProtectedRoute from 'components/Auth/ProtectedRoute';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function EditarDepartamentoContent() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const router = useRouter();
  const searchParams = useSearchParams();
  const idDepartamento = searchParams.get('idDepartamento') ?? '';

  const [form, setForm] = useState({
    nombreDepartamento: '',
    descripcion: '',
  });
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDepartamento = async () => {
      if (!idDepartamento) {
        setError('No se recibio el ID del departamento.');
        setLoadingData(false);
        return;
      }

      try {
        const response = await fetch(`${apiGatewayUrl}/departamentos/${idDepartamento}`);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = (await response.json()) as Record<string, unknown>;
        if (!isMounted) return;

        setForm({
          nombreDepartamento: String(
            data.nombreDepartamento ??
              data.NOMBRE_DEPARTAMENTO ??
              data.NombreDepartamento ??
              ''
          ),
          descripcion: String(
            data.descripcion ?? data.DESCRIPCION ?? data.Descripcion ?? ''
          ),
        });
        setError(null);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    fetchDepartamento();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, idDepartamento]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.nombreDepartamento) {
        throw new Error('El nombre del departamento es obligatorio.');
      }

      const body = new FormData();
      body.append('nombreDepartamento', form.nombreDepartamento);
      body.append('descripcion', form.descripcion);

      const response = await fetch(`${apiGatewayUrl}/departamentos/${idDepartamento}`, {
        method: 'PUT',
        body,
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.Error ?? responseData?.Msg ?? `Error HTTP ${response.status}`
        );
      }

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'success',
        title: 'Departamento actualizado',
        text: 'Los cambios fueron guardados correctamente.',
      });

      router.push('/admin/empleados/departamentos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredScopes={['empleados.write']}>
      {
        <Flex direction="column" pt={{ base: '130px', md: '80px' }} align="center" px={4}>
          <Box
            bg="white"
            _dark={{ bg: 'navy.800' }}
            p={8}
            borderRadius="lg"
            boxShadow="md"
            w="100%"
            maxW="600px"
          >
            <Heading color={textColor} fontSize="2xl" mb={4}>
              Editar departamento
            </Heading>

            {error ? (
              <Alert status="error" borderRadius="16px" mb={6}>
                <AlertIcon />
                <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
              </Alert>
            ) : null}

            {loadingData ? <Box color="gray.500">Cargando departamento...</Box> : null}

            <Box as="form" onSubmit={handleSubmit}>
              <FormControl mb={4} isRequired>
                <FormLabel>Nombre del departamento</FormLabel>
                <Input
                  name="nombreDepartamento"
                  value={form.nombreDepartamento}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl mb={6}>
                <FormLabel>Descripcion</FormLabel>
                <Textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                />
              </FormControl>

              <Button
                type="submit"
                w="full"
                colorScheme="blue"
                isLoading={loading}
                isDisabled={!idDepartamento || loadingData}
              >
                Guardar cambios
              </Button>

              <Link href="/admin/empleados/departamentos">
                <Button mt={3} w="full" variant="ghost">
                  Cancelar
                </Button>
              </Link>
            </Box>
          </Box>
        </Flex>
      }
    </ProtectedRoute>
  );
}

export default function EditarDepartamentoPage() {
  return (
    <Suspense fallback={null}>
      <EditarDepartamentoContent />
    </Suspense>
  );
}
