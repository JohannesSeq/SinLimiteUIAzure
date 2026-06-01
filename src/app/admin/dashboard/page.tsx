'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  MdAssignment,
  MdBuildCircle,
  MdCalendarToday,
  MdChecklist,
  MdDirectionsCar,
  MdGroups,
  MdPendingActions,
  MdPeople,
  MdPerson,
} from 'react-icons/md';

import Card from 'components/card/Card';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import { useAuth } from 'contexts/AuthContext';

type Cliente = {
  cedula: string;
  nombre: string;
  apellidos: string;
  numeroTelefono: string;
  idUsuario: string;
};

type Empleado = {
  idEmpleado: number;
  nombre: string;
  apellidos: string;
  puesto: string;
};

type Vehiculo = {
  placa: string;
  marca: string;
  modelo: string;
  tipo: string;
  cedulaCliente: string;
};

type Cita = {
  idCita: string;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string;
  cedulaCliente?: string;
  placa: string;
  idEmpleado?: string;
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

const getBadgeScheme = (estado: string) => {
  const normalized = estado.trim().toLowerCase();

  if (normalized.includes('complet')) return 'green';
  if (normalized.includes('cancel')) return 'red';
  if (normalized.includes('pend')) return 'orange';

  return 'blue';
};

const formatDate = (dateValue: string) => {
  if (!dateValue) return 'Sin fecha';

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getCollection = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [
      record.data,
      record.items,
      record.result,
      record.clientes,
      record.empleados,
      record.vehiculos,
      record.citas,
    ];

    const collection = candidates.find(Array.isArray);
    return Array.isArray(collection) ? collection : [];
  }

  return [];
};

const normalizeClientes = (payload: unknown): Cliente[] =>
  getCollection(payload).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      cedula: String(record.cedula ?? record.CEDULA ?? record.Cedula ?? ''),
      nombre: String(record.nombre ?? record.NOMBRE ?? record.Nombre ?? ''),
      apellidos: String(record.apellidos ?? record.APELLIDOS ?? record.Apellidos ?? ''),
      numeroTelefono: String(
        record.numeroTelefono ??
          record.numeroDeTelefono ??
          record.NUMERO_DE_TELEFONO ??
          record.NumeroDeTelefono ??
          ''
      ),
      idUsuario: String(record.idUsuario ?? record.ID_USUARIO ?? record.IdUsuario ?? ''),
    };
  });

const normalizeEmpleados = (payload: unknown): Empleado[] =>
  getCollection(payload).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      idEmpleado: Number(record.idEmpleado ?? record.ID_EMPLEADO ?? record.IdEmpleado ?? 0),
      nombre: String(record.nombre ?? record.NOMBRE ?? record.Nombre ?? ''),
      apellidos: String(record.apellidos ?? record.APELLIDOS ?? record.Apellidos ?? ''),
      puesto: String(
        record.nombrePuesto ??
          record.puesto ??
          record.Puesto ??
          record.NombrePuesto ??
          record.nombreDelPuesto ??
          ''
      ),
    };
  });

const normalizeVehiculos = (payload: unknown): Vehiculo[] =>
  getCollection(payload).map((item) => {
    const record = item as Record<string, unknown>;
    const vehiculosClientes = (record.vehiculosClientes ??
      record.VehiculosClientes ??
      []) as Array<Record<string, unknown>>;

    return {
      placa: String(record.placa ?? record.Placa ?? ''),
      marca: String(record.marca ?? record.Marca ?? ''),
      modelo: String(record.modelo ?? record.Modelo ?? ''),
      tipo: String(record.tipo ?? record.Tipo ?? ''),
      cedulaCliente: String(
        vehiculosClientes[0]?.cedulaCliente ?? vehiculosClientes[0]?.CedulaCliente ?? ''
      ),
    };
  });

const normalizeCitas = (payload: unknown): Cita[] =>
  getCollection(payload).map((item) => {
    const record = item as Record<string, unknown>;
    const fechaHora = String(record.fechaHora ?? record.FechaHora ?? '');
    const clientesRelacion = (record.citasClientes ??
      record.CitasClientes ??
      []) as Array<Record<string, unknown>>;
    const vehiculosRelacion = (record.citasVehiculos ??
      record.CitasVehiculos ??
      []) as Array<Record<string, unknown>>;
    const empleadosRelacion = (record.citasEmpleados ??
      record.CitasEmpleados ??
      []) as Array<Record<string, unknown>>;
    const { fecha, hora } = splitFechaHora(fechaHora);

    return {
      idCita: String(record.idCita ?? record.IdCita ?? ''),
      fecha,
      hora,
      servicio: String(record.servicio ?? record.Servicio ?? ''),
      estado: String(record.estado ?? record.Estado ?? ''),
      cedulaCliente: String(
        clientesRelacion[0]?.cedulaCliente ?? clientesRelacion[0]?.CedulaCliente ?? ''
      ),
      placa: String(vehiculosRelacion[0]?.placa ?? vehiculosRelacion[0]?.Placa ?? ''),
      idEmpleado: String(
        empleadosRelacion[0]?.idEmpleado ?? empleadosRelacion[0]?.IdEmpleado ?? ''
      ),
    };
  });

const getTodayIso = () => new Date().toISOString().slice(0, 10);

const addDays = (baseDate: string, days: number) => {
  const date = new Date(`${baseDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export default function DashboardPage() {
  const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedText = useColorModeValue('gray.500', 'gray.300');
  const cardBg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const { user, loading: authLoading } = useAuth();

  const isCliente = user?.tipoUsuario?.trim().toLowerCase() === 'cliente';

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [vehiculosOperativos, setVehiculosOperativos] = useState<Vehiculo[]>([]);
  const [citasOperativas, setCitasOperativas] = useState<Cita[]>([]);
  const [loadingOperationalData, setLoadingOperationalData] = useState(false);
  const [operationalError, setOperationalError] = useState<string | null>(null);
  const [servicioFilter, setServicioFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchClienteDashboard = async () => {
      if (!user || !isCliente) {
        return;
      }

      try {
        setLoadingClientData(true);
        setClientError(null);

        const clientesResponse = await fetch(`${apiGatewayUrl}/clientes`, {
          credentials: 'include',
        });
        if (!clientesResponse.ok) {
          throw new Error(`Clientes: HTTP ${clientesResponse.status}`);
        }

        const clientesData = await clientesResponse.json();
        const clienteEncontrado = normalizeClientes(clientesData).find(
          (item) => item.idUsuario === user.id
        );

        if (!clienteEncontrado) {
          if (!isMounted) return;
          setCliente(null);
          setVehiculos([]);
          setCitas([]);
          return;
        }

        const [vehiculosResponse, citasResponse] = await Promise.all([
          fetch(`${apiGatewayUrl}/vehiculos`, { credentials: 'include' }),
          fetch(`${apiGatewayUrl}/citas`, { credentials: 'include' }),
        ]);

        if (!vehiculosResponse.ok) {
          throw new Error(`Vehiculos: HTTP ${vehiculosResponse.status}`);
        }

        if (!citasResponse.ok) {
          throw new Error(`Citas: HTTP ${citasResponse.status}`);
        }

        const vehiculosCliente = normalizeVehiculos(await vehiculosResponse.json()).filter(
          (vehiculo) => vehiculo.cedulaCliente === clienteEncontrado.cedula
        );

        const citasCliente = normalizeCitas(await citasResponse.json())
          .filter((cita) => cita.cedulaCliente === clienteEncontrado.cedula)
          .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

        if (!isMounted) return;

        setCliente(clienteEncontrado);
        setVehiculos(vehiculosCliente);
        setCitas(citasCliente);
      } catch (fetchError) {
        if (isMounted) {
          setClientError(
            fetchError instanceof Error
              ? fetchError.message
              : 'No se pudo cargar el dashboard del cliente.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingClientData(false);
        }
      }
    };

    fetchClienteDashboard();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, isCliente, user]);

  useEffect(() => {
    let isMounted = true;

    const fetchOperationalDashboard = async () => {
      if (!user || isCliente) {
        return;
      }

      try {
        setLoadingOperationalData(true);
        setOperationalError(null);

        const [clientesResponse, empleadosResponse, vehiculosResponse, citasResponse] =
          await Promise.all([
            fetch(`${apiGatewayUrl}/clientes`, { credentials: 'include' }),
            fetch(`${apiGatewayUrl}/empleados`, { credentials: 'include' }),
            fetch(`${apiGatewayUrl}/vehiculos`, { credentials: 'include' }),
            fetch(`${apiGatewayUrl}/citas`, { credentials: 'include' }),
          ]);

        const failedResponse = [
          ['Clientes', clientesResponse],
          ['Empleados', empleadosResponse],
          ['Vehiculos', vehiculosResponse],
          ['Citas', citasResponse],
        ].find(([, response]) => !response.ok);

        if (failedResponse) {
          throw new Error(`${failedResponse[0]}: HTTP ${failedResponse[1].status}`);
        }

        const [clientesData, empleadosData, vehiculosData, citasData] = await Promise.all([
          clientesResponse.json(),
          empleadosResponse.json(),
          vehiculosResponse.json(),
          citasResponse.json(),
        ]);

        if (!isMounted) return;

        setClientes(normalizeClientes(clientesData));
        setEmpleados(normalizeEmpleados(empleadosData));
        setVehiculosOperativos(normalizeVehiculos(vehiculosData));
        setCitasOperativas(
          normalizeCitas(citasData).sort((a, b) =>
            `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
          )
        );
      } catch (fetchError) {
        if (isMounted) {
          setOperationalError(
            fetchError instanceof Error
              ? fetchError.message
              : 'No se pudo cargar el dashboard operativo.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingOperationalData(false);
        }
      }
    };

    fetchOperationalDashboard();

    return () => {
      isMounted = false;
    };
  }, [apiGatewayUrl, isCliente, user]);

  const proximasCitas = useMemo(() => citas.slice(0, 5), [citas]);
  const citasPendientes = useMemo(
    () => citas.filter((cita) => cita.estado.toLowerCase().includes('pend')).length,
    [citas]
  );
  const clienteNombre = [cliente?.nombre, cliente?.apellidos].filter(Boolean).join(' ');

  const serviciosDisponibles = useMemo(
    () =>
      [...new Set(citasOperativas.map((cita) => cita.servicio).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [citasOperativas]
  );

  const estadosDisponibles = useMemo(
    () =>
      [...new Set(citasOperativas.map((cita) => cita.estado).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [citasOperativas]
  );

  const citasOperativasFiltradas = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return citasOperativas.filter((cita) => {
      if (servicioFilter && cita.servicio !== servicioFilter) return false;
      if (estadoFilter && cita.estado !== estadoFilter) return false;

      if (!normalizedTerm) return true;

      return [
        cita.idCita,
        cita.placa,
        cita.cedulaCliente,
        cita.idEmpleado,
        cita.servicio,
        cita.estado,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedTerm));
    });
  }, [citasOperativas, estadoFilter, searchTerm, servicioFilter]);

  const todayIso = getTodayIso();
  const nextWeekIso = addDays(todayIso, 7);

  const citasHoy = useMemo(
    () => citasOperativas.filter((cita) => cita.fecha === todayIso).length,
    [citasOperativas, todayIso]
  );

  const proximasCitasOperativas = useMemo(
    () =>
      citasOperativasFiltradas
        .filter((cita) => cita.fecha >= todayIso && cita.fecha <= nextWeekIso)
        .slice(0, 8),
    [citasOperativasFiltradas, nextWeekIso, todayIso]
  );

  const serviciosResumen = useMemo(() => {
    const counters = new Map<string, number>();

    citasOperativasFiltradas.forEach((cita) => {
      const key = cita.servicio || 'Sin servicio';
      counters.set(key, (counters.get(key) ?? 0) + 1);
    });

    return [...counters.entries()]
      .map(([servicio, cantidad]) => ({ servicio, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [citasOperativasFiltradas]);

  const cargaTecnicos = useMemo(() => {
    const counters = new Map<string, number>();

    citasOperativasFiltradas.forEach((cita) => {
      const key = cita.idEmpleado || 'Sin asignar';
      counters.set(key, (counters.get(key) ?? 0) + 1);
    });

    return empleados
      .map((empleado) => {
        const nombre = [empleado.nombre, empleado.apellidos].filter(Boolean).join(' ');
        return {
          idEmpleado: empleado.idEmpleado,
          nombre: nombre || `Empleado ${empleado.idEmpleado}`,
          puesto: empleado.puesto || 'Sin puesto',
          citas: counters.get(String(empleado.idEmpleado)) ?? 0,
        };
      })
      .sort((a, b) => b.citas - a.citas)
      .slice(0, 5);
  }, [citasOperativasFiltradas, empleados]);

  if (authLoading) {
    return (
      <Flex pt={{ base: '130px', md: '80px', xl: '80px' }} justify="center" align="center">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!user) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <SimpleGrid columns={{ base: 1, xl: 2 }} gap="20px" mb="20px">
          <Card p="32px">
            <Heading color={textColor} fontSize="3xl" mb={4}>
              Bienvenido a Sin Limite
            </Heading>
            <Text color={mutedText} mb={6}>
              Aqui ira una introduccion atractiva del negocio para nuevos clientes, con los
              beneficios principales, tipos de servicio y por que elegir el taller.
            </Text>
            <Flex gap={3} flexWrap="wrap">
              <Link href="/auth/sign-in">
                <Button colorScheme="blue">Iniciar sesion</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline">Crear cuenta</Button>
              </Link>
            </Flex>
          </Card>

          <Card p="32px">
            <Heading color={textColor} fontSize="xl" mb={4}>
              Proximamente
            </Heading>
            <Stack spacing={3} color={mutedText}>
              <Text>Espacio para promociones, horarios de atencion y servicios destacados.</Text>
              <Text>Seccion para testimonios o informacion del equipo tecnico.</Text>
              <Text>Bloque para preguntas frecuentes y llamadas a la accion.</Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Box>
    );
  }

  if (isCliente) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Flex
          mb="20px"
          gap="16px"
          direction={{ base: 'column', lg: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', lg: 'center' }}
        >
          <Box>
            <Heading color={textColor} fontSize="2xl" mb={2}>
              Dashboard del cliente
            </Heading>
            <Text color={mutedText}>
              Resumen rapido de tus citas, vehiculos y datos principales.
            </Text>
          </Box>
          <Flex gap={3} flexWrap="wrap">
            <Link href="/admin/citas/cita-usuario">
              <Button colorScheme="blue">Ver mis citas</Button>
            </Link>
            <Link href="/admin/vehiculos/mis-vehiculos">
              <Button variant="outline">Ver mis vehiculos</Button>
            </Link>
          </Flex>
        </Flex>

        {clientError ? (
          <Alert status="warning" borderRadius="16px" mb="20px">
            <AlertIcon />
            <AlertDescription>{clientError}</AlertDescription>
          </Alert>
        ) : null}

        {loadingClientData ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" />
          </Flex>
        ) : !cliente ? (
          <Card p="32px">
            <Heading color={textColor} fontSize="xl" mb={3}>
              Perfil sin cliente asociado
            </Heading>
            <Text color={mutedText}>
              Tu usuario esta autenticado, pero todavia no encontramos un perfil de cliente
              vinculado para mostrar tu resumen.
            </Text>
          </Card>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="20px" mb="20px">
              <MiniStatistics
                startContent={
                  <IconBox
                    w="56px"
                    h="56px"
                    bg={boxBg}
                    icon={<Icon w="28px" h="28px" as={MdPerson} color={brandColor} />}
                  />
                }
                name="Cliente"
                value={clienteNombre || 'Cliente'}
              />
              <MiniStatistics
                startContent={
                  <IconBox
                    w="56px"
                    h="56px"
                    bg={boxBg}
                    icon={<Icon w="28px" h="28px" as={MdDirectionsCar} color={brandColor} />}
                  />
                }
                name="Vehiculos"
                value={vehiculos.length}
              />
              <MiniStatistics
                startContent={
                  <IconBox
                    w="56px"
                    h="56px"
                    bg={boxBg}
                    icon={<Icon w="28px" h="28px" as={MdCalendarToday} color={brandColor} />}
                  />
                }
                name="Citas"
                value={citas.length}
              />
              <MiniStatistics
                startContent={
                  <IconBox
                    w="56px"
                    h="56px"
                    bg={boxBg}
                    icon={<Icon w="28px" h="28px" as={MdPendingActions} color={brandColor} />}
                  />
                }
                name="Pendientes"
                value={citasPendientes}
              />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 3 }} gap="20px" mb="20px">
              <Card p="24px">
                <Heading fontSize="lg" color={textColor} mb={4}>
                  Mi perfil
                </Heading>
                <Stack spacing={3}>
                  <Text color={textColor}>
                    <strong>Nombre:</strong> {clienteNombre || 'Sin nombre'}
                  </Text>
                  <Text color={textColor}>
                    <strong>Cedula:</strong> {cliente.cedula}
                  </Text>
                  <Text color={textColor}>
                    <strong>Telefono:</strong> {cliente.numeroTelefono || 'Sin telefono'}
                  </Text>
                  <Text color={textColor}>
                    <strong>Correo:</strong> {user.email}
                  </Text>
                </Stack>
              </Card>

              <Card p="24px" gridColumn={{ base: 'span 1', xl: 'span 2' }}>
                <Heading fontSize="lg" color={textColor} mb={4}>
                  Mis vehiculos
                </Heading>
                {vehiculos.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
                    {vehiculos.map((vehiculo) => (
                      <Box
                        key={vehiculo.placa}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="16px"
                        p="16px"
                        bg={cardBg}
                      >
                        <Text color={textColor} fontWeight="700" mb={2}>
                          {vehiculo.placa}
                        </Text>
                        <Text color={mutedText}>{vehiculo.modelo || 'Sin modelo'}</Text>
                        <Text color={mutedText}>{vehiculo.marca || 'Sin marca'}</Text>
                        <Text color={mutedText}>{vehiculo.tipo || 'Sin tipo'}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text color={mutedText}>Todavia no tienes vehiculos registrados.</Text>
                )}
              </Card>
            </SimpleGrid>

            <Card p="24px">
              <Flex justify="space-between" align="center" mb={4} gap={4} flexWrap="wrap">
                <Box>
                  <Heading fontSize="lg" color={textColor} mb={1}>
                    Mis proximas citas
                  </Heading>
                  <Text color={mutedText} fontSize="sm">
                    Vista resumida de tus citas registradas.
                  </Text>
                </Box>
                <Link href="/admin/citas/cita-usuario">
                  <Button size="sm" variant="outline">
                    Ver detalle completo
                  </Button>
                </Link>
              </Flex>

              {proximasCitas.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Fecha</Th>
                        <Th>Servicio</Th>
                        <Th>Vehiculo</Th>
                        <Th>Estado</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {proximasCitas.map((cita) => (
                        <Tr key={cita.idCita}>
                          <Td>{cita.idCita}</Td>
                          <Td>
                            <Text color={textColor} fontWeight="600">
                              {formatDate(cita.fecha)}
                            </Text>
                            <Text color={mutedText} fontSize="sm">
                              {cita.hora || 'Sin hora'}
                            </Text>
                          </Td>
                          <Td>{cita.servicio || 'Sin servicio'}</Td>
                          <Td>{cita.placa || 'Sin vehiculo'}</Td>
                          <Td>
                            <Badge
                              colorScheme={getBadgeScheme(cita.estado)}
                              borderRadius="full"
                              px={3}
                              py={1}
                            >
                              {cita.estado || 'Sin estado'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={mutedText}>No tienes citas registradas por el momento.</Text>
              )}
            </Card>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex
        mb="20px"
        gap="16px"
        direction={{ base: 'column', lg: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', lg: 'center' }}
      >
        <Box>
          <Heading color={textColor} fontSize="2xl" mb={2}>
            Dashboard operativo
          </Heading>
          <Text color={mutedText}>
            Vista general del taller para empleados y administradores.
          </Text>
        </Box>
        <Flex gap={3} flexWrap="wrap">
          <Link href="/admin/citas">
            <Button colorScheme="blue">Gestionar citas</Button>
          </Link>
          <Link href="/admin/empleados">
            <Button variant="outline">Ver empleados</Button>
          </Link>
        </Flex>
      </Flex>

      {operationalError ? (
        <Alert status="warning" borderRadius="16px" mb="20px">
          <AlertIcon />
          <AlertDescription>{operationalError}</AlertDescription>
        </Alert>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdGroups} color={brandColor} />}
            />
          }
          name="Empleados"
          value={loadingOperationalData ? <Skeleton height="22px" /> : empleados.length}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdPeople} color={brandColor} />}
            />
          }
          name="Clientes"
          value={loadingOperationalData ? <Skeleton height="22px" /> : clientes.length}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdDirectionsCar} color={brandColor} />}
            />
          }
          name="Vehiculos"
          value={loadingOperationalData ? <Skeleton height="22px" /> : vehiculosOperativos.length}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="28px" h="28px" as={MdChecklist} color={brandColor} />}
            />
          }
          name="Citas hoy"
          value={loadingOperationalData ? <Skeleton height="22px" /> : citasHoy}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} gap="20px" mb="20px">
        <Card p="24px" gridColumn={{ base: 'span 1', xl: 'span 2' }}>
          <Flex justify="space-between" align="center" gap={4} mb={5} flexWrap="wrap">
            <Box>
              <Heading fontSize="lg" color={textColor} mb={1}>
                Resumen filtrado
              </Heading>
              <Text color={mutedText} fontSize="sm">
                Ajusta la vista por servicio, estado o texto libre.
              </Text>
            </Box>
            <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
              {citasOperativasFiltradas.length} citas
            </Badge>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap="16px">
            <FormControl>
              <FormLabel color={mutedText}>Servicio</FormLabel>
              <Select value={servicioFilter} onChange={(event) => setServicioFilter(event.target.value)}>
                <option value="">Todos</option>
                {serviciosDisponibles.map((servicio) => (
                  <option key={servicio} value={servicio}>
                    {servicio}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color={mutedText}>Estado</FormLabel>
              <Select value={estadoFilter} onChange={(event) => setEstadoFilter(event.target.value)}>
                <option value="">Todos</option>
                {estadosDisponibles.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color={mutedText}>Buscar</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color={mutedText} />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ID, placa, cedula, tecnico..."
                />
              </InputGroup>
            </FormControl>
          </SimpleGrid>
        </Card>

        <Card p="24px">
          <Heading fontSize="lg" color={textColor} mb={4}>
            Proximas citas
          </Heading>
          <Stack spacing={3}>
            {loadingOperationalData ? (
              <>
                <Skeleton height="56px" />
                <Skeleton height="56px" />
                <Skeleton height="56px" />
              </>
            ) : proximasCitasOperativas.length > 0 ? (
              proximasCitasOperativas.map((cita) => (
                <Box
                  key={cita.idCita}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="16px"
                  p="14px"
                  bg={cardBg}
                >
                  <Flex justify="space-between" align="center" mb={2} gap={3}>
                    <Text color={textColor} fontWeight="700">
                      {cita.servicio || 'Sin servicio'}
                    </Text>
                    <Badge colorScheme={getBadgeScheme(cita.estado)}>
                      {cita.estado || 'Sin estado'}
                    </Badge>
                  </Flex>
                  <Text color={mutedText} fontSize="sm">
                    {formatDate(cita.fecha)} · {cita.hora || 'Sin hora'}
                  </Text>
                  <Text color={mutedText} fontSize="sm">
                    Placa: {cita.placa || 'Sin vehiculo'}
                  </Text>
                </Box>
              ))
            ) : (
              <Text color={mutedText}>No hay citas proximas con los filtros actuales.</Text>
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} gap="20px">
        <Card p="24px" gridColumn={{ base: 'span 1', xl: 'span 2' }}>
          <Flex justify="space-between" align="center" mb={4} gap={4} flexWrap="wrap">
            <Box>
              <Heading fontSize="lg" color={textColor} mb={1}>
                Agenda reciente
              </Heading>
              <Text color={mutedText} fontSize="sm">
                Citas visibles segun los filtros aplicados.
              </Text>
            </Box>
            <Link href="/admin/citas">
              <Button size="sm" variant="outline">
                Ir a citas
              </Button>
            </Link>
          </Flex>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Fecha</Th>
                  <Th>Servicio</Th>
                  <Th>Cliente</Th>
                  <Th>Placa</Th>
                  <Th>Tecnico</Th>
                  <Th>Estado</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loadingOperationalData ? (
                  <Tr>
                    <Td colSpan={7}>
                      <Skeleton height="24px" />
                    </Td>
                  </Tr>
                ) : citasOperativasFiltradas.length > 0 ? (
                  citasOperativasFiltradas.slice(0, 10).map((cita) => (
                    <Tr key={cita.idCita}>
                      <Td>{cita.idCita || 'N/D'}</Td>
                      <Td>
                        <Text color={textColor} fontWeight="600">
                          {formatDate(cita.fecha)}
                        </Text>
                        <Text color={mutedText} fontSize="sm">
                          {cita.hora || 'Sin hora'}
                        </Text>
                      </Td>
                      <Td>{cita.servicio || 'Sin servicio'}</Td>
                      <Td>{cita.cedulaCliente || 'Sin cliente'}</Td>
                      <Td>{cita.placa || 'Sin placa'}</Td>
                      <Td>{cita.idEmpleado || 'Sin asignar'}</Td>
                      <Td>
                        <Badge colorScheme={getBadgeScheme(cita.estado)} borderRadius="full" px={3} py={1}>
                          {cita.estado || 'Sin estado'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7}>
                      <Text color={mutedText}>No se encontraron citas con esos filtros.</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>

        <Stack spacing="20px">
          <Card p="24px">
            <Flex align="center" gap={3} mb={4}>
              <Icon as={MdBuildCircle} color={brandColor} boxSize={6} />
              <Heading fontSize="lg" color={textColor}>
                Distribucion operativa
              </Heading>
            </Flex>
            <Stack spacing={3}>
              {loadingOperationalData ? (
                <>
                  <Skeleton height="18px" />
                  <Skeleton height="18px" />
                  <Skeleton height="18px" />
                </>
              ) : serviciosResumen.length > 0 ? (
                serviciosResumen.map((item) => (
                  <Flex key={item.servicio} justify="space-between" align="center">
                    <Text color={textColor}>{item.servicio}</Text>
                    <Badge colorScheme="blue">{item.cantidad}</Badge>
                  </Flex>
                ))
              ) : (
                <Text color={mutedText}>Aun no hay servicios registrados para resumir.</Text>
              )}
            </Stack>
          </Card>

          <Card p="24px">
            <Flex align="center" gap={3} mb={4}>
              <Icon as={MdAssignment} color={brandColor} boxSize={6} />
              <Heading fontSize="lg" color={textColor}>
                Carga por tecnico
              </Heading>
            </Flex>
            <Stack spacing={3}>
              {loadingOperationalData ? (
                <>
                  <Skeleton height="18px" />
                  <Skeleton height="18px" />
                  <Skeleton height="18px" />
                </>
              ) : cargaTecnicos.length > 0 ? (
                cargaTecnicos.map((item) => (
                  <Box key={item.idEmpleado}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text color={textColor}>{item.nombre}</Text>
                      <Badge colorScheme="purple">{item.citas}</Badge>
                    </Flex>
                    <Text color={mutedText} fontSize="sm">
                      {item.puesto}
                    </Text>
                  </Box>
                ))
              ) : (
                <Text color={mutedText}>Todavia no hay carga asignada a tecnicos.</Text>
              )}
            </Stack>
          </Card>
        </Stack>
      </SimpleGrid>
    </Box>
  );
}
