'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import { useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type CatalogOption = {
  id: string;
  nombre: string;
};

interface UsuarioResponse {
  idUsuario?: string;
  IdUsuario?: string;
  correo?: string;
  Correo?: string;
  estado?: boolean;
  Estado?: boolean;
}

export default function EditarEmpleadoPage() {
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const textColor = useColorModeValue('navy.700', 'white');
  const router = useRouter();
  const searchParams = useSearchParams();
  const idEmpleado = searchParams.get('idEmpleado') ?? '';

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    numeroTelefono: '',
    idPuesto: '',
    idDepartamento: '',
    idUsuario: '',
    correo: '',
    password: '',
    confirmPassword: '',
    estado: true,
  });
  const [puestos, setPuestos] = useState<CatalogOption[]>([]);
  const [departamentos, setDepartamentos] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!idEmpleado) {
        if (isMounted) {
          setError('No se recibio el ID del empleado.');
          setLoadingData(false);
        }
        return;
      }

      try {
        const [empleadoRes, puestosRes, departamentosRes] = await Promise.all([
          fetch(`${apiGatewayUrl}/empleados/${idEmpleado}`),
          fetch(`${apiGatewayUrl}/puestos`),
          fetch(`${apiGatewayUrl}/departamentos`),
        ]);

        if (!empleadoRes.ok) throw new Error(`Empleado: HTTP ${empleadoRes.status}`);
        if (!puestosRes.ok) throw new Error(`Puestos: HTTP ${puestosRes.status}`);
        if (!departamentosRes.ok) {
          throw new Error(`Departamentos: HTTP ${departamentosRes.status}`);
        }

        const empleado = (await empleadoRes.json()) as Record<string, unknown>;
        const puestosRaw = (await puestosRes.json()) as Array<Record<string, unknown>>;
        const departamentosRaw =
          (await departamentosRes.json()) as Array<Record<string, unknown>>;

        const empleadoIdUsuario = String(
          empleado.idUsuario ?? empleado.ID_USUARIO ?? empleado.IdUsuario ?? ''
        );

        let correoUsuario = '';
        let estadoUsuario = true;

        if (empleadoIdUsuario) {
          const usuarioRes = await fetch(
            `${apiGatewayUrl}/usuarios/${empleadoIdUsuario}`,
            {
              method: 'GET',
              credentials: 'include',
            }
          );

          const usuario = (await usuarioRes.json().catch(() => null)) as
            | UsuarioResponse
            | null;

          if (usuarioRes.ok && usuario) {
            correoUsuario = String(usuario.correo ?? usuario.Correo ?? '');
            estadoUsuario = Boolean(usuario.estado ?? usuario.Estado ?? true);
          }
        }

        if (isMounted) {
          setPuestos(
            puestosRaw.map((item) => ({
              id: String(item.idPuesto ?? item.ID_PUESTO ?? item.IdPuesto ?? ''),
              nombre: String(
                item.nombrePuesto ?? item.NOMBRE_PUESTO ?? item.NombrePuesto ?? 'Sin nombre'
              ),
            }))
          );

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

          setForm({
            nombre: String(empleado.nombre ?? empleado.NOMBRE ?? empleado.Nombre ?? ''),
            apellidos: String(
              empleado.apellidos ?? empleado.APELLIDOS ?? empleado.Apellidos ?? ''
            ),
            numeroTelefono: String(
              empleado.numeroTelefono ??
                empleado.numeroDeTelefono ??
                empleado.NUMERO_DE_TELEFONO ??
                empleado.Numero_De_Telefono ??
                empleado.NumeroDeTelefono ??
                ''
            ),
            idPuesto: String(
              empleado.idPuesto ?? empleado.ID_PUESTO ?? empleado.IdPuesto ?? ''
            ),
            idDepartamento: String(
              empleado.idDepartamento ??
                empleado.ID_DEPARTAMENTO ??
                empleado.IdDepartamento ??
                ''
            ),
            idUsuario: empleadoIdUsuario,
            correo: correoUsuario,
            password: '',
            confirmPassword: '',
            estado: estadoUsuario,
          });
          setError(null);
        }
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

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, idEmpleado]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        'checked' in e.target && e.target.type === 'checkbox'
          ? e.target.checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        !form.nombre ||
        !form.apellidos ||
        !form.idPuesto ||
        !form.idDepartamento ||
        !form.idUsuario ||
        !form.correo
      ) {
        throw new Error('Complete todos los campos obligatorios.');
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

      const usuarioBody = new FormData();
      usuarioBody.append('correo', form.correo);
      usuarioBody.append('estado', String(form.estado));

      if (form.password) {
        usuarioBody.append('password', form.password);
      }

      const usuarioResponse = await fetch(`${apiGatewayUrl}/usuarios/${form.idUsuario}`, {
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

      const body = new FormData();
      body.append('idPuesto', form.idPuesto);
      body.append('idDepartamento', form.idDepartamento);
      body.append('idUsuario', form.idUsuario);
      body.append('nombre', form.nombre);
      body.append('apellidos', form.apellidos);
      body.append('numeroTelefono', form.numeroTelefono);

      const response = await fetch(`${apiGatewayUrl}/empleados/${idEmpleado}`, {
        method: 'PUT',
        body,
      });

      const empleadoData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          empleadoData?.Error ?? empleadoData?.Msg ?? `Error HTTP ${response.status}`
        );
      }

      await Swal.fire({
        icon: 'success',
        title: 'Empleado actualizado',
        text: 'Los cambios del empleado y usuario se guardaron correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      router.push('/admin/empleados');
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
            <Heading fontSize="2xl" mb={6} color={textColor}>
              Editar empleado
            </Heading>

            {error ? (
              <Alert status="error" borderRadius="16px" mb={6}>
                <AlertIcon />
                <AlertDescription whiteSpace="pre-wrap">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}

            {loadingData ? <Box color="gray.500">Cargando empleado...</Box> : null}

            <Box as="form" onSubmit={handleSubmit}>
              <FormControl mb={4} isRequired isDisabled>
                <FormLabel>ID Empleado</FormLabel>
                <Input value={idEmpleado} readOnly />
              </FormControl>

              <FormControl mb={4} isRequired>
                <FormLabel>Nombre</FormLabel>
                <Input name="nombre" value={form.nombre} onChange={handleChange} />
              </FormControl>

              <FormControl mb={4} isRequired>
                <FormLabel>Apellidos</FormLabel>
                <Input name="apellidos" value={form.apellidos} onChange={handleChange} />
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Telefono</FormLabel>
                <Input
                  name="numeroTelefono"
                  type="number"
                  value={form.numeroTelefono}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl mb={4} isRequired>
                <FormLabel>Correo del usuario</FormLabel>
                <Input
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Nueva contraseña del usuario</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Confirmar nueva contraseña</FormLabel>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </FormControl>

              <FormControl mb={4}>
                <Checkbox
                  name="estado"
                  isChecked={form.estado}
                  onChange={handleChange}
                >
                  Usuario activo
                </Checkbox>
              </FormControl>

              <FormControl mb={4} isRequired>
                <FormLabel>Puesto</FormLabel>
                <Select name="idPuesto" value={form.idPuesto} onChange={handleChange}>
                  <option value="">Seleccione un puesto</option>
                  {puestos.map((puesto) => (
                    <option key={puesto.id} value={puesto.id}>
                      {puesto.nombre}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl mb={6} isRequired>
                <FormLabel>Departamento</FormLabel>
                <Select
                  name="idDepartamento"
                  value={form.idDepartamento}
                  onChange={handleChange}
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>
                      {departamento.nombre}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Button
                type="submit"
                w="full"
                colorScheme="blue"
                isLoading={loading}
                isDisabled={!idEmpleado || loadingData}
              >
                Guardar cambios
              </Button>

              <Link href="/admin/empleados">
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
