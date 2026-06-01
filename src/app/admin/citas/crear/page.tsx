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
  Select,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ClienteOption = {
  cedula: string;
  nombreCompleto: string;
  correo?: string;
};

type EmpleadoOption = {
  idEmpleado: string;
  nombreCompleto: string;
};

type VehiculoOption = {
  placa: string;
  etiqueta: string;
};

export default function CrearCitaPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const router = useRouter();
  const [form, setForm] = useState({
    cedulaCliente: '',
    idEmpleado: '',
    placa: '',
    fecha: '',
    hora: '',
    servicio: '',
    estado: 'Pendiente',
  });
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchCatalogos = async () => {
      try {
        const [clientesResponse, empleadosResponse, vehiculosResponse] = await Promise.all([
          fetch(`${apiGatewayUrl}/clientes`),
          fetch(`${apiGatewayUrl}/empleados`),
          fetch(`${apiGatewayUrl}/vehiculos`),
        ]);

        if (!clientesResponse.ok) {
          throw new Error(`Clientes: HTTP ${clientesResponse.status}`);
        }

        if (!empleadosResponse.ok) {
          throw new Error(`Empleados: HTTP ${empleadosResponse.status}`);
        }

        if (!vehiculosResponse.ok) {
          throw new Error(`Vehiculos: HTTP ${vehiculosResponse.status}`);
        }

        const clientesData = await clientesResponse.json();
        const empleadosData = await empleadosResponse.json();
        const vehiculosData = await vehiculosResponse.json();

        const rawClientes = Array.isArray(clientesData) ? clientesData : clientesData?.data ?? [];
        const rawEmpleados = Array.isArray(empleadosData) ? empleadosData : empleadosData?.data ?? [];
        const rawVehiculos = Array.isArray(vehiculosData) ? vehiculosData : vehiculosData?.data ?? [];

        const clientesNormalizados = rawClientes.map((item: Record<string, unknown>) => ({
          cedula: String(item.cedula ?? item.CEDULA ?? item.Cedula ?? ''),
          nombreCompleto: `${String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? '')} ${String(
            item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''
          )}`.trim(),
          correo: String(item.correo ?? item.CORREO ?? item.Correo ?? ''),
        }));

        const empleadosNormalizados = rawEmpleados.map((item: Record<string, unknown>) => ({
          idEmpleado: String(item.idEmpleado ?? item.ID_EMPLEADO ?? item.IdEmpleado ?? ''),
          nombreCompleto: `${String(item.nombre ?? item.NOMBRE ?? item.Nombre ?? '')} ${String(
            item.apellidos ?? item.APELLIDOS ?? item.Apellidos ?? ''
          )}`.trim(),
        }));

        const vehiculosNormalizados = rawVehiculos.map((item: Record<string, unknown>) => {
          const placa = String(item.placa ?? item.Placa ?? '');
          const marca = String(item.marca ?? item.Marca ?? '');
          const modelo = String(item.modelo ?? item.Modelo ?? '');

          return {
            placa,
            etiqueta: [placa, modelo || marca || 'Vehiculo sin nombre']
              .filter(Boolean)
              .join(' - '),
          };
        });

        if (!isMounted) return;

        setClientes(clientesNormalizados);
        setEmpleados(empleadosNormalizados);
        setVehiculos(vehiculosNormalizados);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar catalogos.');
        }
      } finally {
        if (isMounted) {
          setLoadingCatalogs(false);
        }
      }
    };

    fetchCatalogos();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.fecha || !form.hora || !form.servicio) {
        throw new Error('Fecha, hora y servicio son obligatorios.');
      }

      const Swal = (await import('sweetalert2')).default;
      const fechaHora = `${form.fecha}T${form.hora}`;

      const body = new FormData();
      body.append('fechaHora', fechaHora);
      body.append('estado', form.estado);
      body.append('servicio', form.servicio);

      const response = await fetch(`${apiGatewayUrl}/citas`, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      const created = await response.json();
      const idCita = String(created?.idCita ?? created?.IdCita ?? created?.Id ?? created?.id ?? '');

      if (idCita) {
        if (form.cedulaCliente) {
          const clienteSeleccionado = clientes.find((c) => c.cedula === form.cedulaCliente);
          const relBody = new FormData();
          relBody.append('idCita', idCita);
          relBody.append('cedulaCliente', form.cedulaCliente);
          if (clienteSeleccionado?.correo) {
            relBody.append('correoCliente', clienteSeleccionado.correo);
            relBody.append('nombreCliente', clienteSeleccionado.nombreCompleto);
          }
          const relResponse = await fetch(`${apiGatewayUrl}/citas-clientes`, {
            method: 'POST',
            body: relBody,
          });
          if (!relResponse.ok) {
            const relMessage = await relResponse.text();
            throw new Error(relMessage || `Error HTTP ${relResponse.status}`);
          }
        }

        if (form.placa) {
          const relBody = new FormData();
          relBody.append('idCita', idCita);
          relBody.append('placa', form.placa);
          const relResponse = await fetch(`${apiGatewayUrl}/citas-vehiculos`, {
            method: 'POST',
            body: relBody,
          });
          if (!relResponse.ok) {
            const relMessage = await relResponse.text();
            throw new Error(relMessage || `Error HTTP ${relResponse.status}`);
          }
        }

        if (form.idEmpleado) {
          const relBody = new FormData();
          relBody.append('idCita', idCita);
          relBody.append('idEmpleado', form.idEmpleado);
          const relResponse = await fetch(`${apiGatewayUrl}/citas-empleados`, {
            method: 'POST',
            body: relBody,
          });
          if (!relResponse.ok) {
            const relMessage = await relResponse.text();
            throw new Error(relMessage || `Error HTTP ${relResponse.status}`);
          }
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Cita creada',
        text: 'La cita fue guardada correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      setForm({
        cedulaCliente: '',
        idEmpleado: '',
        placa: '',
        fecha: '',
        hora: '',
        servicio: '',
        estado: 'Pendiente',
      });

      router.push('/admin/citas');
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
    <ProtectedRoute requiredScopes={['citas.write']}>
      {
        <Box maxW="600px" mx="auto" mt={10}>
          <Heading color={textColor} fontSize="2xl" mb={6}>
            Crear nueva cita
          </Heading>

          {error ? (
            <Alert status="error" borderRadius="16px" mb={6}>
              <AlertIcon />
              <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
            </Alert>
          ) : null}

          <Stack spacing={4} as="form" onSubmit={handleSubmit}>
            <FormControl>
              <FormLabel>Cedula cliente</FormLabel>
              <Select
                name="cedulaCliente"
                value={form.cedulaCliente}
                onChange={handleChange}
                isDisabled={loadingCatalogs}
              >
                <option value="">
                  {loadingCatalogs ? 'Cargando clientes...' : 'Seleccione un cliente'}
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.cedula} value={cliente.cedula}>
                    {cliente.cedula} - {cliente.nombreCompleto || 'Cliente sin nombre'}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>ID Empleado</FormLabel>
              <Select
                name="idEmpleado"
                value={form.idEmpleado}
                onChange={handleChange}
                isDisabled={loadingCatalogs}
              >
                <option value="">
                  {loadingCatalogs ? 'Cargando empleados...' : 'Seleccione un empleado'}
                </option>
                {empleados.map((empleado) => (
                  <option key={empleado.idEmpleado} value={empleado.idEmpleado}>
                    {empleado.idEmpleado} - {empleado.nombreCompleto || 'Empleado sin nombre'}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Placa vehiculo</FormLabel>
              <Select
                name="placa"
                value={form.placa}
                onChange={handleChange}
                isDisabled={loadingCatalogs}
              >
                <option value="">
                  {loadingCatalogs ? 'Cargando vehiculos...' : 'Seleccione un vehiculo'}
                </option>
                {vehiculos.map((vehiculo) => (
                  <option key={vehiculo.placa} value={vehiculo.placa}>
                    {vehiculo.etiqueta}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Fecha</FormLabel>
              <Input name="fecha" type="date" value={form.fecha} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Hora</FormLabel>
              <Input name="hora" type="time" value={form.hora} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Servicio</FormLabel>
              <Input
                name="servicio"
                placeholder="Tipo de servicio"
                value={form.servicio}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Estado</FormLabel>
              <Select name="estado" value={form.estado} onChange={handleChange}>
                <option>Pendiente</option>
                <option>Completada</option>
                <option>Cancelada</option>
              </Select>
            </FormControl>

            <Flex justify="end" mt={4}>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={loading}
                isDisabled={loadingCatalogs}
              >
                Guardar cita
              </Button>
            </Flex>

            <Link href="/admin/citas">
              <Button variant="ghost">Cancelar</Button>
            </Link>
          </Stack>
        </Box>
      }
    </ProtectedRoute>
  );
}
