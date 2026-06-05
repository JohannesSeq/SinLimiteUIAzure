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
  Stack,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CrearDepartamentoPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const router = useRouter();
  const [form, setForm] = useState({
    nombreDepartamento: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const response = await fetch(`${apiGatewayUrl}/departamentos`, {
        method: 'POST',
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
        title: 'Departamento creado',
        text: 'El departamento fue guardado correctamente.',
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
              Crear departamento
            </Heading>

            {error ? (
              <Alert status="error" borderRadius="16px" mb={6}>
                <AlertIcon />
                <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre del departamento</FormLabel>
                  <Input
                    name="nombreDepartamento"
                    value={form.nombreDepartamento}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Descripcion</FormLabel>
                  <Textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows={4}
                  />
                </FormControl>

                <Button type="submit" variant="brand" isLoading={loading}>
                  Guardar
                </Button>

                <Link href="/admin/empleados/departamentos">
                  <Button variant="ghost">Cancelar</Button>
                </Link>
              </Stack>
            </form>
          </Box>
        </Flex>
      }
    </ProtectedRoute>
  );
}
