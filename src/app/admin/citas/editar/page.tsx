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
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type ClienteOption = {
  cedula: string;
  nombreCompleto: string;
};

type EmpleadoOption = {
  idEmpleado: string;
  nombreCompleto: string;
};

type VehiculoOption = {
  placa: string;
  etiqueta: string;
};

const splitFechaHora = (value: string) => {
  if (!value) {
    return { fecha: '', hora: '' };
  }

  const [fecha, tiempo] = value.split('T');
  return {
    fecha: fecha || '',
    hora: tiempo ? tiempo.slice(0, 5) : '',
  };
};

function EditarCitaContent() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online';
  const router = useRouter();
  const searchParams = useSearchParams();
  const idCita = searchParams.get('idCita') ?? '';

  const [form, setForm] = useState({
    cedulaCliente: '',
    idEmpleado: '',
    placa: '',
    fecha: '',
    hora: '',
    servicio: '',
    estado: 'Pendiente',
  });
  const [initialRelations, setInitialRelations] = useState({
    cedulaCliente: '',
    idEmpleado: '',
    placa: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingCita, setLoadingCita] = useState(true);
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

  useEffect(() => {
    let isMounted = true;

    const fetchCita = async () => {
      if (!idCita) {
        if (isMounted) {
          setError('No se recibio el ID de la cita.');
          setLoadingCita(false);
        }
        return;
      }

      try {
        const response = await fetch(`${apiGatewayUrl}/citas/${idCita}`);
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }

        const item = await response.json();
        const fechaHora = String(item?.fechaHora ?? item?.FechaHora ?? '');
        const { fecha, hora } = splitFechaHora(fechaHora);
        const relacionesCliente = (item?.citasClientes ?? item?.CitasClientes ?? []) as Array<
          Record<string, unknown>
        >;
        const relacionesVehiculo = (item?.citasVehiculos ?? item?.CitasVehiculos ?? []) as Array<
          Record<string, unknown>
        >;
        const relacionesEmpleado = (item?.citasEmpleados ?? item?.CitasEmpleados ?? []) as Array<
          Record<string, unknown>
        >;

        const cedulaCliente = String(
          relacionesCliente[0]?.cedulaCliente ?? relacionesCliente[0]?.CedulaCliente ?? ''
        );
        const placa = String(relacionesVehiculo[0]?.placa ?? relacionesVehiculo[0]?.Placa ?? '');
        const idEmpleadoActual = String(
          relacionesEmpleado[0]?.idEmpleado ?? relacionesEmpleado[0]?.IdEmpleado ?? ''
        );

        if (isMounted) {
          setForm({
            cedulaCliente,
            idEmpleado: idEmpleadoActual,
            placa,
            fecha,
            hora,
            servicio: String(item?.servicio ?? item?.Servicio ?? ''),
            estado: String(item?.estado ?? item?.Estado ?? 'Pendiente'),
          });
          setInitialRelations({
            cedulaCliente,
            idEmpleado: idEmpleadoActual,
            placa,
          });
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isMounted) {
          setLoadingCita(false);
        }
      }
    };

    fetchCita();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, idCita]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const syncRelacion = async (config: {
    currentValue: string;
    initialValue: string;
    putUrl: string;
    postUrl: string;
    fieldName: string;
  }) => {
    if (!config.currentValue) {
      return;
    }

    const body = new FormData();
    if (!config.initialValue) {
      body.append('idCita', idCita);
    }
    body.append(config.fieldName, config.currentValue);

    const response = await fetch(
      `${apiGatewayUrl}/${config.initialValue ? config.putUrl : config.postUrl}`,
      {
        method: config.initialValue ? 'PUT' : 'POST',
        body,
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'No fue posible actualizar una relacion de la cita.');
    }
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
      const confirmation = await Swal.fire({
        icon: 'question',
        title: 'Confirmar cambios',
        text: 'Deseas guardar los cambios de la cita?',
        showCancelButton: true,
        confirmButtonText: 'Si, guardar',
        cancelButtonText: 'Cancelar',
      });

      if (!confirmation.isConfirmed) {
        setLoading(false);
        return;
      }

      const fechaHora = `${form.fecha}T${form.hora}`;
      const body = new FormData();
      body.append('fechaHora', fechaHora);
      body.append('servicio', form.servicio);
      body.append('estado', form.estado);

      const response = await fetch(`${apiGatewayUrl}/citas/${idCita}`, {
        method: 'PUT',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error HTTP ${response.status}`);
      }

      await syncRelacion({
        currentValue: form.cedulaCliente,
        initialValue: initialRelations.cedulaCliente,
        putUrl: `citas-clientes/${idCita}`,
        postUrl: 'citas-clientes',
        fieldName: initialRelations.cedulaCliente ? 'nuevaCedulaCliente' : 'cedulaCliente',
      });

      await syncRelacion({
        currentValue: form.placa,
        initialValue: initialRelations.placa,
        putUrl: `citas-vehiculos/${idCita}`,
        postUrl: 'citas-vehiculos',
        fieldName: initialRelations.placa ? 'nuevaPlacaVehiculo' : 'placa',
      });

      await syncRelacion({
        currentValue: form.idEmpleado,
        initialValue: initialRelations.idEmpleado,
        putUrl: `citas-empleados/${idCita}`,
        postUrl: 'citas-empleados',
        fieldName: initialRelations.idEmpleado ? 'nuevoIdEmpleado' : 'idEmpleado',
      });

      await Swal.fire({
        icon: 'success',
        title: 'Cita actualizada',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonText: 'Ir al listado',
      });

      router.push('/admin/citas');
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
    <ProtectedRoute requiredScopes={['citas.write']}>
      {
        <Box maxW="600px" mx="auto" mt={10}>
          <Heading color={textColor} fontSize="2xl" mb={6}>
            Editar cita
          </Heading>

          {error ? (
            <Alert status="error" borderRadius="16px" mb={6}>
              <AlertIcon />
              <AlertDescription whiteSpace="pre-wrap">{error}</AlertDescription>
            </Alert>
          ) : null}

          {loadingCita ? <Box color="gray.500">Cargando cita...</Box> : null}

          <Box as="form" onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired isDisabled>
                <FormLabel>IdCita</FormLabel>
                <Input value={idCita} readOnly />
              </FormControl>

              <FormControl>
                <FormLabel>Cedula cliente</FormLabel>
                <Select
                  name="cedulaCliente"
                  value={form.cedulaCliente}
                  onChange={handleChange}
                  isDisabled={loadingCatalogs || loadingCita}
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
                  isDisabled={loadingCatalogs || loadingCita}
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
                  isDisabled={loadingCatalogs || loadingCita}
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
                <Input name="servicio" value={form.servicio} onChange={handleChange} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Estado</FormLabel>
                <Select name="estado" value={form.estado} onChange={handleChange}>
                  <option>Pendiente</option>
                  <option>Completada</option>
                  <option>Cancelada</option>
                </Select>
              </FormControl>

              <Button
                type="submit"
                colorScheme="green"
                mt={4}
                isLoading={loading}
                isDisabled={!idCita || loadingCita || loadingCatalogs}
              >
                Guardar cambios
              </Button>

              <Link href="/admin/citas">
                <Button variant="ghost">Cancelar</Button>
              </Link>
            </Stack>
          </Box>
        </Box>
      }
    </ProtectedRoute>
  );
}

export default function EditarCitaPage() {
  return (
    <Suspense fallback={null}>
      <EditarCitaContent />
    </Suspense>
  );
}
