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
import { useEffect, useState } from 'react';

export default function EditarPuestoPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const router = useRouter();
  const searchParams = useSearchParams();
  const idPuesto = searchParams.get('idPuesto') ?? '';

  const [form, setForm] = useState({
    nombrePuesto: '',
    salarioBase: '',
    descripcion: '',
  });
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPuesto = async () => {
      if (!idPuesto) {
        setError('No se recibio el ID del puesto.');
        setLoadingData(false);
        return;
      }

      try {
        const response = await fetch(`${apiGatewayUrl}/puestos/${idPuesto}`);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = (await response.json()) as Record<string, unknown>;
        if (!isMounted) return;

        setForm({
          nombrePuesto: String(
            data.nombrePuesto ?? data.NOMBRE_PUESTO ?? data.NombrePuesto ?? ''
          ),
          salarioBase: String(
            data.salarioBase ?? data.SALARIO_BASE ?? data.SalarioBase ?? ''
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

    fetchPuesto();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, idPuesto]);

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
      if (!form.nombrePuesto || !form.salarioBase) {
        throw new Error('Nombre del puesto y salario base son obligatorios.');
      }

      const body = new FormData();
      body.append('nombrePuesto', form.nombrePuesto);
      body.append('salarioBase', form.salarioBase);
      body.append('descripcion', form.descripcion);

      const response = await fetch(`${apiGatewayUrl}/puestos/${idPuesto}`, {
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
        title: 'Puesto actualizado',
        text: 'Los cambios fueron guardados correctamente.',
      });

      router.push('/admin/empleados/puestos');
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
              Editar puesto
            </Heading>

            {error ? (
              <Alert status="error" borderRadius="16px" mb={6}>
                <AlertIcon />
                <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
              </Alert>
            ) : null}

            {loadingData ? <Box color="gray.500">Cargando puesto...</Box> : null}

            <Box as="form" onSubmit={handleSubmit}>
              <FormControl mb={4} isRequired>
                <FormLabel>Nombre del puesto</FormLabel>
                <Input
                  name="nombrePuesto"
                  value={form.nombrePuesto}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl mb={4} isRequired>
                <FormLabel>Salario base</FormLabel>
                <Input
                  type="number"
                  min="0"
                  name="salarioBase"
                  value={form.salarioBase}
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
                isDisabled={!idPuesto || loadingData}
              >
                Guardar cambios
              </Button>

              <Link href="/admin/empleados/puestos">
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
