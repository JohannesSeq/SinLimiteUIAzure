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
  Spinner,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type MeResponse = {
  id?: string;
  email?: string;
  tipoUsuario?: string;
};

type ClienteRecord = {
  cedula: string;
  nombre: string;
  apellidos: string;
  numeroTelefono: string;
  idUsuario: string;
};

type EmpleadoRecord = {
  idEmpleado: string;
  idUsuario: string;
  nombre: string;
  apellidos: string;
  numeroTelefono: string;
  idPuesto: string;
  idDepartamento: string;
};

export default function EditarPerfilPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const textColor = useColorModeValue('navy.700', 'white');
  const router = useRouter();

  const [tipoUsuario, setTipoUsuario] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clienteOriginalCedula, setClienteOriginalCedula] = useState('');
  const [empleadoData, setEmpleadoData] = useState<EmpleadoRecord | null>(null);
  const [form, setForm] = useState({
    correo: '',
    nombre: '',
    apellidos: '',
    cedula: '',
    numeroTelefono: '',
    idEmpleado: '',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPerfil = async () => {
      try {
        setLoadingData(true);
        setError(null);

        const meResponse = await fetch(`${apiGatewayUrl}/me`, {
          credentials: 'include',
        });

        if (!meResponse.ok) {
          throw new Error('No se pudo obtener la informacion del usuario autenticado.');
        }

        const meData = (await meResponse.json()) as MeResponse;
        const idUsuario = String(meData.id ?? '');
        const correo = String(meData.email ?? '');
        const tipo = String(meData.tipoUsuario ?? '');

        if (!idUsuario) {
          throw new Error('No se pudo identificar el usuario autenticado.');
        }

        if (!isMounted) return;

        setTipoUsuario(tipo);

        if (tipo.toLowerCase() === 'cliente') {
          const clientesResponse = await fetch(`${apiGatewayUrl}/clientes`);
          if (!clientesResponse.ok) {
            throw new Error(`Clientes: HTTP ${clientesResponse.status}`);
          }

          const clientesData = await clientesResponse.json();
          const rawClientes = Array.isArray(clientesData) ? clientesData : clientesData?.data ?? [];
          const cliente = rawClientes
            .map((item: Record<string, unknown>) => ({
              cedula: String(item.cedula ?? item.CEDULA ?? item.Cedula ?? ''),
              nombre: String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? ''),
              apellidos: String(item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''),
              numeroTelefono: String(
                item.numeroTelefono ??
                  item.numeroDeTelefono ??
                  item.NUMERO_DE_TELEFONO ??
                  item.NumeroDeTelefono ??
                  ''
              ),
              idUsuario: String(item.idUsuario ?? item.ID_USUARIO ?? item.IdUsuario ?? ''),
            }))
            .find((item: ClienteRecord) => item.idUsuario === idUsuario);

          if (!cliente) {
            throw new Error('No se encontro el perfil de cliente asociado.');
          }

          if (!isMounted) return;

          setClienteOriginalCedula(cliente.cedula);
          setForm({
            correo,
            nombre: cliente.nombre,
            apellidos: cliente.apellidos,
            cedula: cliente.cedula,
            numeroTelefono: cliente.numeroTelefono,
            idEmpleado: '',
          });
          return;
        }

        if (tipo.toLowerCase() === 'empleado') {
          const empleadosResponse = await fetch(`${apiGatewayUrl}/empleados`);
          if (!empleadosResponse.ok) {
            throw new Error(`Empleados: HTTP ${empleadosResponse.status}`);
          }

          const empleadosData = await empleadosResponse.json();
          const rawEmpleados = Array.isArray(empleadosData) ? empleadosData : empleadosData?.data ?? [];

          const empleadoEncontrado = rawEmpleados.find((item: Record<string, unknown>) => {
            return String(item.idUsuario ?? item.ID_USUARIO ?? item.IdUsuario ?? '') === idUsuario;
          });

          if (!empleadoEncontrado) {
            throw new Error('No se encontro el perfil de empleado asociado.');
          }

          const idEmpleado = String(
            empleadoEncontrado.idEmpleado ??
              empleadoEncontrado.ID_EMPLEADO ??
              empleadoEncontrado.IdEmpleado ??
              ''
          );

          const empleadoResponse = await fetch(`${apiGatewayUrl}/empleados/${idEmpleado}`);
          if (!empleadoResponse.ok) {
            throw new Error(`Empleado: HTTP ${empleadoResponse.status}`);
          }

          const empleado = (await empleadoResponse.json()) as Record<string, unknown>;
          const puesto = (empleado.puesto ?? empleado.Puesto ?? {}) as Record<string, unknown>;
          const departamento = (empleado.departamento ?? empleado.Departamento ?? {}) as Record<
            string,
            unknown
          >;

          const empleadoNormalizado: EmpleadoRecord = {
            idEmpleado: String(empleado.idEmpleado ?? empleado.ID_EMPLEADO ?? empleado.IdEmpleado ?? ''),
            idUsuario: String(empleado.idUsuario ?? empleado.ID_USUARIO ?? empleado.IdUsuario ?? ''),
            nombre: String(empleado.nombre ?? empleado.NOMBRE ?? empleado.Nombre ?? ''),
            apellidos: String(empleado.apellidos ?? empleado.APELLIDOS ?? empleado.Apellidos ?? ''),
            numeroTelefono: String(
              empleado.numeroTelefono ??
                empleado.numeroDeTelefono ??
                empleado.NUMERO_DE_TELEFONO ??
                empleado.NumeroDeTelefono ??
                ''
            ),
            idPuesto: String(puesto.idPuesto ?? puesto.ID_PUESTO ?? puesto.IdPuesto ?? ''),
            idDepartamento: String(
              departamento.idDepartamento ??
                departamento.ID_DEPARTAMENTO ??
                departamento.IdDepartamento ??
                ''
            ),
          };

          if (!isMounted) return;

          setEmpleadoData(empleadoNormalizado);
          setForm({
            correo,
            nombre: empleadoNormalizado.nombre,
            apellidos: empleadoNormalizado.apellidos,
            cedula: '',
            numeroTelefono: empleadoNormalizado.numeroTelefono,
            idEmpleado: empleadoNormalizado.idEmpleado,
          });
          return;
        }

        setForm({
          correo,
          nombre: '',
          apellidos: '',
          cedula: '',
          numeroTelefono: '',
          idEmpleado: '',
        });
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error ? fetchError.message : 'Error al cargar el perfil.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    fetchPerfil();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.correo || !form.nombre || !form.apellidos) {
        throw new Error('Correo, nombre y apellidos son obligatorios.');
      }

      const usuarioBody = new FormData();
      usuarioBody.append('correo', form.correo);

      const usuarioResponse = await fetch(`${apiGatewayUrl}/me`, {
        method: 'PUT',
        body: usuarioBody,
        credentials: 'include',
      });

      const usuarioData = await usuarioResponse.json().catch(() => null);

      if (!usuarioResponse.ok) {
        throw new Error(
          usuarioData?.Error ?? usuarioData?.Msg ?? 'No fue posible actualizar el usuario.'
        );
      }

      if (tipoUsuario.toLowerCase() === 'cliente') {
        if (!clienteOriginalCedula || !form.cedula || !form.numeroTelefono) {
          throw new Error('Cedula y telefono son obligatorios para actualizar el cliente.');
        }

        const clienteBody = new FormData();
        clienteBody.append('nuevaCedula', form.cedula);
        clienteBody.append('nombre', form.nombre);
        clienteBody.append('apellidos', form.apellidos);
        clienteBody.append('numeroTelefono', form.numeroTelefono);

        const clienteResponse = await fetch(`${apiGatewayUrl}/clientes/${clienteOriginalCedula}`, {
          method: 'PUT',
          body: clienteBody,
        });

        const clienteData = await clienteResponse.json().catch(() => null);

        if (!clienteResponse.ok) {
          throw new Error(
            clienteData?.Error ?? clienteData?.Msg ?? 'No fue posible actualizar el cliente.'
          );
        }
      } else if (tipoUsuario.toLowerCase() === 'empleado') {
        if (!empleadoData) {
          throw new Error('No se pudo cargar la informacion del empleado.');
        }

        const empleadoBody = new FormData();
        empleadoBody.append('idPuesto', empleadoData.idPuesto);
        empleadoBody.append('idDepartamento', empleadoData.idDepartamento);
        empleadoBody.append('idUsuario', empleadoData.idUsuario);
        empleadoBody.append('nombre', form.nombre);
        empleadoBody.append('apellidos', form.apellidos);
        empleadoBody.append('numeroTelefono', empleadoData.numeroTelefono || '0');

        const empleadoResponse = await fetch(
          `${apiGatewayUrl}/empleados/${empleadoData.idEmpleado}`,
          {
            method: 'PUT',
            body: empleadoBody,
          }
        );

        const empleadoResponseData = await empleadoResponse.json().catch(() => null);

        if (!empleadoResponse.ok) {
          throw new Error(
            empleadoResponseData?.Error ??
              empleadoResponseData?.Msg ??
              'No fue posible actualizar el empleado.'
          );
        }
      }

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Tus cambios fueron guardados correctamente.',
        confirmButtonText: 'Volver a mi perfil',
      });

      router.push('/admin/mi-perfil');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Error desconocido';
      setError(message);
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredScopes={[]}>
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
            <Heading fontSize="2xl" mb="6" color={textColor}>
              Editar Perfil
            </Heading>

            {loadingData ? (
              <Flex justify="center" py={10}>
                <Spinner size="lg" />
              </Flex>
            ) : (
              <>
                {error ? (
                  <Alert status="error" borderRadius="16px" mb={6}>
                    <AlertIcon />
                    <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Box as="form" onSubmit={handleSubmit}>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel color={textColor}>Correo electronico</FormLabel>
                      <Input name="correo" value={form.correo} onChange={handleChange} />
                    </FormControl>

                    {tipoUsuario.toLowerCase() === 'empleado' ? (
                      <FormControl isDisabled>
                        <FormLabel color={textColor}>ID Empleado</FormLabel>
                        <Input value={form.idEmpleado} readOnly />
                      </FormControl>
                    ) : null}

                    {tipoUsuario.toLowerCase() === 'cliente' ? (
                      <FormControl isRequired>
                        <FormLabel color={textColor}>Cedula</FormLabel>
                        <Input name="cedula" value={form.cedula} onChange={handleChange} />
                      </FormControl>
                    ) : null}

                    <FormControl isRequired>
                      <FormLabel color={textColor}>Nombre</FormLabel>
                      <Input name="nombre" value={form.nombre} onChange={handleChange} />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color={textColor}>Apellidos</FormLabel>
                      <Input name="apellidos" value={form.apellidos} onChange={handleChange} />
                    </FormControl>

                    {tipoUsuario.toLowerCase() === 'cliente' ? (
                      <FormControl isRequired>
                        <FormLabel color={textColor}>Telefono</FormLabel>
                        <Input
                          name="numeroTelefono"
                          value={form.numeroTelefono}
                          onChange={handleChange}
                        />
                      </FormControl>
                    ) : null}

                    <Button colorScheme="blue" w="full" type="submit" isLoading={loading}>
                      Guardar cambios
                    </Button>

                    <Link href="/admin/mi-perfil">
                      <Button variant="ghost" w="full">
                        Cancelar
                      </Button>
                    </Link>
                  </Stack>
                </Box>
              </>
            )}
          </Box>
        </Flex>
      }
    </ProtectedRoute>
  );
}
