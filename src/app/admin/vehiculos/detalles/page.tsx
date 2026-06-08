'use client';
import ProtectedRoute from 'components/Auth/ProtectedRoute';

import {
  Box,
  Heading,
  Text,
  Stack,
  Divider,
  Button,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

// Mock de datos
const vehiculoMock = {
  placa: 'ABC123',
  marca: 'Toyota',
  modelo: 'Corolla',
  año: 2020,
  tipo: 'Sedán',
  cliente: 'Juan Pérez',
  correoCliente: 'juan.perez@example.com',
};

export default function DetallesVehiculoPage() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const router = useRouter();

  return (
    <ProtectedRoute requiredScopes={['vehiculos.read']}>{
    <Box p={5}>
      <Heading fontSize="2xl" color={textColor} mb={6}>
        Detalles del vehículo
      </Heading>

      <Box p={6} borderWidth="1px" borderRadius="lg">
        <Stack spacing={4}>
          <Flex justify="space-between">
            <Text fontWeight="bold" color={textColor}>
              Placa:
            </Text>
            <Text>{vehiculoMock.placa}</Text>
          </Flex>

          <Flex justify="space-between">
            <Text fontWeight="bold" color={textColor}>
              Marca:
            </Text>
            <Text>{vehiculoMock.marca}</Text>
          </Flex>

          <Flex justify="space-between">
            <Text fontWeight="bold" color={textColor}>
              Modelo:
            </Text>
            <Text>{vehiculoMock.modelo}</Text>
          </Flex>

          <Flex justify="space-between">
            <Text fontWeight="bold" color={textColor}>
              Año:
            </Text>
            <Text>{vehiculoMock.año}</Text>
          </Flex>

          <Flex justify="space-between">
            <Text fontWeight="bold" color={textColor}>
              Tipo:
            </Text>
            <Text>{vehiculoMock.tipo}</Text>
          </Flex>

          <Divider my={2} />

          <Flex justify="space-between">
            <Text fontWeight="bold" color={textColor}>
              Cliente asociado:
            </Text>
            <Text>{vehiculoMock.cliente}</Text>
          </Flex>

          <Flex justify="space-between">
            <Text fontWeight="bold" color={textColor}>
              Correo del cliente:
            </Text>
            <Text>{vehiculoMock.correoCliente}</Text>
          </Flex>
        </Stack>

        <Flex mt={6} gap={4} justify="flex-end">
          <Button variant="outline" onClick={() => router.back()}>
            Volver
          </Button>
          <Button colorScheme="blue">Editar</Button>
        </Flex>
      </Box>
    </Box>
    }</ProtectedRoute>
  );
}
