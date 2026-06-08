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
  Select,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CatalogOption = {
  id: string;
  nombre: string;
};

interface UsuarioCreado {
  idUsuario?: string;
  IdUsuario?: string;
}

export default function CrearEmpleadoPage() {
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const router = useRouter();

  const [form, setForm] = useState({
    idEmpleado: '',
    nombre: '',
    apellidos: '',
    idPuesto: '',
    idDepartamento: '',
    numeroTelefono: '',
    correo: '',
    password: '',
    confirmPassword: '',
    estado: true,
  });

  const [loading, setLoading] = useState(false);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departamentos, setDepartamentos] = useState<CatalogOption[]>([]);
  const [loadingPuestos, setLoadingPuestos] = useState(true);
  const [puestos, setPuestos] = useState<CatalogOption[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchDepartamentos = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/departamentos`);
        if (!response.ok) {
          throw new Error(`Departamentos: HTTP ${response.status}`);
        }

        const departamentosRaw =
          (await response.json()) as Array<Record<string, unknown>>;
        if (!isMounted) return;

        setDepartamentos(
          departamentosRaw.map((item) => ({
            id: String(
              item.idDepartamento ?? item.ID_DEPARTAMENTO ?? item.IdDepartamento ?? ''
            ),
            nombre: String(
              item.nombreDepartamento ??
                item.NOMBRE_DEPARTAMENTO ??
                item.NombreDepartamento ??
                'Sin nombre'
            ),
          }))
        );
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Error al cargar departamentos'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDepartamentos(false);
        }
      }
    };

    const fetchPuestos = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/puestos`);
        if (!response.ok) {
          throw new Error(`Puestos: HTTP ${response.status}`);
        }

        const puestosRaw = (await response.json()) as Array<Record<string, unknown>>;
        if (!isMounted) return;

        setPuestos(
          puestosRaw.map((item) => ({
            id: String(item.idPuesto ?? item.ID_PUESTO ?? item.IdPuesto ?? ''),
            nombre: String(
              item.nombrePuesto ??
                item.NOMBRE_PUESTO ??
                item.NombrePuesto ??
                'Sin nombre'
            ),
          }))
        );
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar puestos');
        }
      } finally {
        if (isMounted) {
          setLoadingPuestos(false);
        }
      }
    };

    fetchDepartamentos();
    fetchPuestos();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]:
        'checked' in e.target && e.target.type === 'checkbox'
          ? e.target.checked
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !form.idEmpleado ||
      !form.nombre ||
      !form.apellidos ||
      !form.idPuesto ||
      !form.idDepartamento ||
      !form.correo ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('La confirmacion de contraseña no coincide.');
      return;
    }

    setLoading(true);

    try {
      const Swal = (await import('sweetalert2')).default;

      const usuarioBody = new FormData();
      usuarioBody.append('correo', form.correo);
      usuarioBody.append('password', form.password);
      usuarioBody.append('estado', String(form.estado));
      usuarioBody.append('tipoUsuario', 'Empleado');

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
        (await usuarioCreadoResponse.json().catch(() => null)) as
          | UsuarioCreado
          | null;

      const idUsuario = String(
        usuarioCreado?.idUsuario ?? usuarioCreado?.IdUsuario ?? ''
      );

      if (!usuarioCreadoResponse.ok || !idUsuario) {
        throw new Error('No fue posible recuperar el usuario recien creado.');
      }

      const body = new FormData();
      body.append('idEmpleado', Number(form.idEmpleado).toString());
      body.append('idPuesto', form.idPuesto);
      body.append('idDepartamento', form.idDepartamento);
      body.append('idUsuario', idUsuario);
      body.append('nombre', form.nombre);
      body.append('apellidos', form.apellidos);

      if (form.numeroTelefono) {
        body.append('numeroTelefono', Number(form.numeroTelefono).toString());
      }

      const response = await fetch(`${apiGatewayUrl}/empleados`, {
        method: 'POST',
        body,
      });

      const empleadoData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          empleadoData?.Error ??
            empleadoData?.Msg ??
            `Error HTTP ${response.status}`
        );
      }

      await Swal.fire({
        icon: 'success',
        title: 'Empleado creado',
        text: 'El empleado y su usuario fueron guardados correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      router.push('/admin/empleados');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(message);

      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Error al crear empleado',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredScopes={['empleados.write']}>
      {
        <Flex
          direction="column"
          pt={{ base: '130px', md: '80px' }}
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
              Crear Empleado
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
                  <FormLabel>ID Empleado</FormLabel>
                  <Input
                    name="idEmpleado"
                    type="number"
                    value={form.idEmpleado}
                    onChange={handleChange}
                  />
                </FormControl>

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
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Contraseña</FormLabel>
                  <Input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <Input
                    name="confirmPassword"
                    type="password"
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
                  <FormLabel>Puesto</FormLabel>
                  <Select
                    name="idPuesto"
                    value={form.idPuesto}
                    onChange={handleChange}
                    isDisabled={loadingPuestos}
                  >
                    <option value="">
                      {loadingPuestos ? 'Cargando puestos...' : 'Seleccione un puesto'}
                    </option>
                    {puestos.map((puesto) => (
                      <option key={puesto.id} value={puesto.id}>
                        {puesto.nombre}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    name="idDepartamento"
                    value={form.idDepartamento}
                    onChange={handleChange}
                    isDisabled={loadingDepartamentos}
                  >
                    <option value="">
                      {loadingDepartamentos
                        ? 'Cargando departamentos...'
                        : 'Seleccione un departamento'}
                    </option>
                    {departamentos.map((departamento) => (
                      <option key={departamento.id} value={departamento.id}>
                        {departamento.nombre}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Telefono</FormLabel>
                  <Input
                    name="numeroTelefono"
                    type="number"
                    value={form.numeroTelefono}
                    onChange={handleChange}
                  />
                </FormControl>

                <Button type="submit" variant="brand" isLoading={loading}>
                  Guardar
                </Button>

                <Link href="/admin/empleados">
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
