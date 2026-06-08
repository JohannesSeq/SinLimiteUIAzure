'use client';

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
  Text,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ProtectedRoute from 'components/Auth/ProtectedRoute';
import PermissionSelector from '../components/PermissionSelector';


export default function CrearRolPage() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const router = useRouter();
  const [form, setForm] = useState({
    nombreRol: '',
    descripcionRol: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const Swal = (await import('sweetalert2')).default;
      const body = new FormData();
      body.append('nombreRol', form.nombreRol);
      body.append('descripcionRol', form.descripcionRol);
      body.append('permisos', selectedPermissions.join(','));

      const response = await fetch(`${apiGatewayUrl}/roles`, {
        method: 'POST',
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Rol creado',
        text: 'El rol fue registrado correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      setForm({
        nombreRol: '',
        descripcionRol: '',
      });
      setSelectedPermissions([]);

      router.push('/admin/roles');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredScopes={['roles.write']}>{
    <Flex direction="column" pt={{ base: '130px', md: '80px', xl: '80px' }} align="center" px={4}>
      <Box
        bg="white"
        _dark={{ bg: 'navy.800' }}
        p={8}
        borderRadius="lg"
        boxShadow="md"
        w="100%"
        maxW="600px"
      >
        <Heading color={textColor} fontSize="2xl" mb={6}>
          Crear rol
        </Heading>

        {error ? (
          <Alert status="error" borderRadius="16px" mb={6}>
            <AlertIcon />
            <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
          </Alert>
        ) : null}

        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nombre del rol</FormLabel>
              <Input
                name="nombreRol"
                placeholder="Ingrese el nombre"
                value={form.nombreRol}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Descripcion</FormLabel>
              <Textarea
                name="descripcionRol"
                placeholder="Descripcion del rol"
                value={form.descripcionRol}
                onChange={handleChange}
              />
            </FormControl>

            <PermissionSelector value={selectedPermissions} onChange={setSelectedPermissions} />

            <Button type="submit" colorScheme="blue" mt={4} isLoading={loading}>
              Crear rol
            </Button>

            <Link href="/admin/roles">
              <Button variant="ghost">Cancelar</Button>
            </Link>
          </Stack>
        </Box>
      </Box>
    </Flex>
  }
    </ProtectedRoute>
  );
}
