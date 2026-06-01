'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Flex,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface UsuarioCreado {
  idUsuario?: string;
  correo?: string;
  estado?: boolean;
  tipoUsuario?: string;
}

export default function CrearClientePage() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    cedula: '',
    numeroTelefono: '',
    correo: '',
    password: '',
    confirmPassword: '',
    estado: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        !form.nombre ||
        !form.apellidos ||
        !form.cedula ||
        !form.numeroTelefono ||
        !form.correo ||
        !form.password ||
        !form.confirmPassword
      ) {
        throw new Error('Todos los campos son obligatorios.');
      }

      if (form.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }

      if (form.password !== form.confirmPassword) {
        throw new Error('La confirmacion de contrasena no coincide.');
      }

      const Swal = (await import('sweetalert2')).default;

      const usuarioBody = new FormData();
      usuarioBody.append('correo', form.correo);
      usuarioBody.append('password', form.password);
      usuarioBody.append('estado', String(form.estado));
      usuarioBody.append('tipoUsuario', 'Cliente');

      const usuarioResponse = await fetch(`${apiGatewayUrl}/usuarios`, {
        method: 'POST',
        body: usuarioBody,
        credentials: 'include',
      });

      const usuarioResponseData = await usuarioResponse.json().catch(() => null);

      if (!usuarioResponse.ok) {
        throw new Error(
          usuarioResponseData?.Error ??
            usuarioResponseData?.Msg ??
            `Error HTTP ${usuarioResponse.status}`
        );
      }

      const usuarioCreadoResponse = await fetch(
        `${apiGatewayUrl}/usuarios/${encodeURIComponent(form.correo)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const usuarioCreado =
        (await usuarioCreadoResponse.json().catch(() => null)) as UsuarioCreado | null;

      if (!usuarioCreadoResponse.ok || !usuarioCreado?.idUsuario) {
        throw new Error('No fue posible recuperar el usuario recien creado.');
      }

      const clienteBody = new FormData();
      clienteBody.append('cedula', form.cedula);
      clienteBody.append('nombre', form.nombre);
      clienteBody.append('apellidos', form.apellidos);
      clienteBody.append('numeroTelefono', form.numeroTelefono);
      clienteBody.append('correo', form.correo);
      clienteBody.append('idUsuario', usuarioCreado.idUsuario);

      const clienteResponse = await fetch(`${apiGatewayUrl}/clientes`, {
        method: 'POST',
        body: clienteBody,
        credentials: 'include',
      });

      const clienteResponseData = await clienteResponse.json().catch(() => null);

      if (!clienteResponse.ok) {
        throw new Error(
          clienteResponseData?.Error ??
            clienteResponseData?.Msg ??
            `Error HTTP ${clienteResponse.status}`
        );
      }

      await Swal.fire({
        icon: 'success',
        title: 'Cliente creado',
        text: 'El cliente y su usuario fueron guardados correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      setForm({
        nombre: '',
        apellidos: '',
        cedula: '',
        numeroTelefono: '',
        correo: '',
        password: '',
        confirmPassword: '',
        estado: true,
      });

      router.push('/admin/clientes');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Error al crear',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredScopes={['clientes.write']}>
      {
        <Flex
          direction="column"
          pt={{ base: '130px', md: '80px', xl: '80px' }}
          align="center"
          px={4}
        >
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
              Crear Cliente
            </Heading>
            {error ? (
              <Alert status="error" borderRadius="16px" mb={6}>
                <AlertIcon />
                <AlertDescription whiteSpace="pre-wrap">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Apellidos</FormLabel>
                  <Input
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Correo</FormLabel>
                  <Input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Contraseña</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <Checkbox
                    name="estado"
                    isChecked={form.estado}
                    onChange={handleChange}
                  >
                    Usuario activo
                  </Checkbox>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cedula</FormLabel>
                  <Input
                    name="cedula"
                    value={form.cedula}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Telefono</FormLabel>
                  <Input
                    name="numeroTelefono"
                    value={form.numeroTelefono}
                    onChange={handleChange}
                  />
                </FormControl>

                <Button
                  type="submit"
                  variant="brand"
                  w="fit-content"
                  isLoading={loading}
                >
                  Guardar
                </Button>

                <Link href="/admin/clientes">
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
