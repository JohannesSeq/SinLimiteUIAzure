'use client';

import {
  Flex,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

type CatalogOption = {
  id: string;
  nombre: string;
};

function CrearEmpleadoContent() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const router = useRouter();

  const [form, setForm] = useState({
    idEmpleado: '',
    nombre: '',
    apellidos: '',
    idPuesto: '',
    idDepartamento: '',
    idUsuario: '',
    numeroTelefono: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<CatalogOption[]>([]);

  const searchParams = useSearchParams();
  const idRol = searchParams.get('idRol') ?? '';

  useEffect(() => {
    let isMounted = true;

    const fetchUsuarios = async () => {
      try {
        const response = await fetch(`${apiGatewayUrl}/usuarios`,{
           method: 'GET',
            credentials: 'include',
            headers: {
          'Content-Type': 'application/json'
        }        
        });
        if (!response.ok) {
          throw new Error(`Usuarios: HTTP ${response.status}`);
        }

        const UsuariosRaw = (await response.json()) as Array<Record<string, unknown>>;
        if (!isMounted) return;

        setUsuarios(
          UsuariosRaw.map((item) => ({
            id: String(item.idUsuario ?? item.ID_USUARIO ?? item.IdUsuario ?? ''),
            nombre: String(
              item.correo ??
                item.NOMBRE_DEPARTAMENTO ??
                item.Correo ??
                'Sin nombre'
            ),
          }))
        );
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar los usuarios del rol');
        }
      } finally {
        if (isMounted) {
          setLoadingUsuarios(false);
        }
      }
    };

    fetchUsuarios();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación mínima
    if (
      !form.idUsuario
    ) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const Swal = (await import('sweetalert2')).default;

      const body = new FormData();
      body.append('idUsuario', form.idUsuario);

      if (form.numeroTelefono) {
        body.append(
          'numeroTelefono',
          Number(form.numeroTelefono).toString()
        );
      }

      const response = await fetch(`${apiGatewayUrl}/AsignacionRoles/${idRol}`, {
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
        title: 'Asignacion creada',
        text: 'El rol fue asignado correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      router.push(`/admin/roles/asignar?idRol=${idRol}`);
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
    <ProtectedRoute requiredScopes={['roles.write']}>{
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
          Asignar rol
        </Heading>

        {error && (
          <Text color="red.500" mb={4}>
            {error}
          </Text>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>

            <FormControl isRequired>
              <FormLabel>Seleccione el usuario</FormLabel>
              <Select
                name="idUsuario"
                value={form.idUsuario}
                onChange={handleChange}
                isDisabled={loadingUsuarios}
              >
                <option value="">
                  {loadingUsuarios ? 'Cargando usuarios...' : 'Seleccione un Usuario'}
                </option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="brand"
              isLoading={loading}
            >
              Guardar
            </Button>

            <Link href="/admin/roles/">
              <Button variant="ghost">Cancelar</Button>
            </Link>
          </Stack>
        </form>
      </Box>
    </Flex>
    }</ProtectedRoute>
  );
}

export default function CrearEmpleadoPage() {
  return (
    <Suspense fallback={null}>
      <CrearEmpleadoContent />
    </Suspense>
  );
}
