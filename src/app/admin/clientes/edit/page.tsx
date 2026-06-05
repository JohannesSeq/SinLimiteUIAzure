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
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface ClienteResponse {
  nombre?: string;
  apellidos?: string;
  numeroTelefono?: number | string;
  numeroDeTelefono?: number | string;
  correo?: string;
  Correo?: string;
  idUsuario?: string;
  IdUsuario?: string;
}

interface UsuarioResponse {
  idUsuario?: string;
  IdUsuario?: string;
  correo?: string;
  Correo?: string;
  estado?: boolean;
  Estado?: boolean;
}

function EditarClienteContent() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const router = useRouter();
  const searchParams = useSearchParams();
  const cedula = searchParams.get('cedula') ?? '';

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    numeroTelefono: '',
    correo: '',
    correoNotificacion: '',
    password: '',
    confirmPassword: '',
    estado: true,
  });
  const [idUsuario, setIdUsuario] = useState('');
  const [correoOriginal, setCorreoOriginal] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const cargarCliente = async () => {
      if (!cedula) {
        if (isMounted) {
          setError('No se recibio la cedula del cliente.');
          setLoadingCliente(false);
        }
        return;
      }

      try {
        const response = await fetch(`${apiGatewayUrl}/clientes/${cedula}`);
        const item =
          (await response.json().catch(() => null)) as ClienteResponse | null;

        if (!response.ok || !item) {
          throw new Error('No fue posible cargar el cliente.');
        }

        const clienteIdUsuario = String(
          item?.idUsuario ?? item?.IdUsuario ?? ''
        );

        let correoUsuario = '';
        let estadoUsuario = true;

        if (clienteIdUsuario) {
          const usuarioResponse = await fetch(
            `${apiGatewayUrl}/usuarios/${clienteIdUsuario}`,
            {
              credentials: 'include',
            }
          );

          const usuario =
            (await usuarioResponse.json().catch(() => null)) as
              | UsuarioResponse
              | null;

          if (usuarioResponse.ok && usuario) {
            correoUsuario = String(
              usuario?.correo ?? usuario?.Correo ?? ''
            );
            estadoUsuario = Boolean(usuario?.estado ?? usuario?.Estado ?? true);
          }
        }

        if (isMounted) {
          setIdUsuario(clienteIdUsuario);
          setCorreoOriginal(correoUsuario);
          setForm({
            nombre: String(item?.nombre ?? ''),
            apellidos: String(item?.apellidos ?? ''),
            numeroTelefono: String(
              item?.numeroTelefono ?? item?.numeroDeTelefono ?? ''
            ),
            correo: correoUsuario,
            correoNotificacion: String(item?.correo ?? item?.Correo ?? correoUsuario),
            password: '',
            confirmPassword: '',
            estado: estadoUsuario,
          });
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Error desconocido al cargar.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingCliente(false);
        }
      }
    };

    cargarCliente();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, cedula]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.nombre || !form.apellidos || !form.numeroTelefono || !form.correo) {
        throw new Error('Nombre, apellidos, telefono y correo son obligatorios.');
      }

      if (form.password || form.confirmPassword) {
        if (form.password.length < 8) {
          throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        }

        if (form.password !== form.confirmPassword) {
          throw new Error('La confirmacion de contraseña no coincide.');
        }
      }

      const Swal = (await import('sweetalert2')).default;
      let usuarioIdActual = idUsuario.trim();

      if (!usuarioIdActual && correoOriginal) {
        const usuarioLookupResponse = await fetch(
          `${apiGatewayUrl}/usuarios/${encodeURIComponent(correoOriginal)}`,
          {
            credentials: 'include',
          }
        );

        const usuarioLookupData =
          (await usuarioLookupResponse.json().catch(() => null)) as UsuarioResponse | null;

        if (usuarioLookupResponse.ok && usuarioLookupData) {
          usuarioIdActual = String(
            usuarioLookupData.idUsuario ?? usuarioLookupData.IdUsuario ?? ''
          ).trim();
          if (usuarioIdActual) {
            setIdUsuario(usuarioIdActual);
          }
        }
      }

      if (usuarioIdActual) {
        const usuarioBody = new FormData();
        usuarioBody.append('correo', form.correo);
        usuarioBody.append('estado', String(form.estado));

        if (form.password) {
          usuarioBody.append('password', form.password);
        }

        const usuarioResponse = await fetch(`${apiGatewayUrl}/usuarios/${encodeURIComponent(usuarioIdActual)}`, {
          method: 'PUT',
          body: usuarioBody,
          credentials: 'include',
        });

        const usuarioData = await usuarioResponse.json().catch(() => null);

        if (!usuarioResponse.ok) {
          throw new Error(
            usuarioData?.Error ??
              usuarioData?.Msg ??
              'No fue posible actualizar el usuario asociado.'
          );
        }
      } else if (form.correo || form.password) {
        throw new Error('No se pudo identificar el usuario asociado al cliente para actualizarlo.');
      }

      const clienteBody = new FormData();
      clienteBody.append('nombre', form.nombre);
      clienteBody.append('apellidos', form.apellidos);
      clienteBody.append('numeroTelefono', form.numeroTelefono);
      if (form.correoNotificacion) {
        clienteBody.append('correo', form.correoNotificacion);
      }

      const response = await fetch(`${apiGatewayUrl}/clientes/${encodeURIComponent(cedula)}`, {
        method: 'PUT',
        body: clienteBody,
        credentials: 'include',
      });

      const clienteData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          clienteData?.Error ??
            clienteData?.Msg ??
            `Error HTTP ${response.status}`
        );
      }

      await Swal.fire({
        icon: 'success',
        title: 'Cliente actualizado',
        text: 'Los cambios del cliente y usuario se guardaron correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      router.push('/admin/clientes');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Error al editar',
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
              Editar Cliente
            </Heading>
            {error ? (
              <Alert status="error" borderRadius="16px" mb={6}>
                <AlertIcon />
                <AlertDescription whiteSpace="pre-wrap">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}
            {loadingCliente ? (
              <Text color="gray.500">Cargando cliente...</Text>
            ) : null}
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre</FormLabel>
                  <Input name="nombre" value={form.nombre} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired isDisabled>
                  <FormLabel>Cedula</FormLabel>
                  <Input name="cedula" value={cedula} readOnly />
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
                  <FormLabel>Telefono</FormLabel>
                  <Input
                    name="numeroTelefono"
                    value={form.numeroTelefono}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Correo de notificaciones</FormLabel>
                  <Input
                    type="email"
                    name="correoNotificacion"
                    value={form.correoNotificacion}
                    onChange={handleChange}
                    placeholder="Correo para confirmar citas (opcional)"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Correo del usuario</FormLabel>
                  <Input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Nueva contraseña del usuario</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Opcional"
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

                <Button
                  type="submit"
                  variant="brand"
                  w="fit-content"
                  isLoading={loading}
                  isDisabled={!cedula || loadingCliente}
                >
                  Guardar cambios
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

export default function EditarClientePage() {
  return (
    <Suspense fallback={null}>
      <EditarClienteContent />
    </Suspense>
  );
}
