// src/app/admin/vehiculos/components/VehiculosTable.tsx

'use client';

import {
  Box,
  Button,
  Flex,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Vehiculo } from '../types';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
  data: Vehiculo[];
  onDelete?: (placa: string) => Promise<void>;
  showActions?: boolean;
  editBasePath?: string;
  showDeleteAction?: boolean;
}

export default function VehiculosTable({
  data,
  onDelete,
  showActions = true,
  editBasePath = '/admin/vehiculos/editar',
  showDeleteAction = true,
}: Props) {
  const [deletingPlaca, setDeletingPlaca] = useState<string | null>(null);

  const handleDelete = async (placa: string) => {
    const Swal = (await import('sweetalert2')).default;
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar vehículo?',
      text: `Esta acción eliminará el vehículo ${placa}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (!confirmation.isConfirmed) return;

    try {
      setDeletingPlaca(placa);
      if (onDelete) {
        await onDelete(placa);
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://sin-limite-api-gatewaydev-exbkdvaucwaad0ey.mexicocentral-01.azurewebsites.net'}/vehiculos/${placa}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Vehículo eliminado',
        text: `El vehículo ${placa} fue eliminado.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: message,
      });
    } finally {
      setDeletingPlaca(null);
    }
  };

  return (
    <Box overflowX="auto" borderRadius="lg" border="1px solid" borderColor="gray.200">
      <Table variant="simple">
        <Thead bg={useColorModeValue('gray.100', 'gray.700')}>
          <Tr>
            <Th>Placa</Th>
            <Th>Marca</Th>
            <Th>Modelo</Th>
            <Th>Año</Th>
            <Th>Tipo</Th>
            <Th>Cliente</Th>
            {showActions ? <Th textAlign="center">Acciones</Th> : null}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((vehiculo) => (
            <Tr key={vehiculo.placa}>
              <Td>{vehiculo.placa}</Td>
              <Td>{vehiculo.marca}</Td>
              <Td>{vehiculo.modelo}</Td>
              <Td>{vehiculo.year}</Td>
              <Td>{vehiculo.tipo}</Td>
              <Td>{vehiculo.cedulaCliente || 'Sin asignar'}</Td>
              {showActions ? (
                <Td>
                  <Flex justify="center" gap={2}>
                    <Link href={`${editBasePath}?placa=${vehiculo.placa}`}>
                      <Button size="sm" colorScheme="blue">Editar</Button>
                    </Link>
                    {showDeleteAction ? (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        isLoading={deletingPlaca === vehiculo.placa}
                        onClick={() => handleDelete(vehiculo.placa)}
                      >
                        Eliminar
                      </Button>
                    ) : null}
                  </Flex>
                </Td>
              ) : null}
            </Tr>
          ))}
        </Tbody>
      </Table>

      {data.length === 0 && (
        <Text p={4} textAlign="center" color="gray.500">
          No hay vehículos registrados.
        </Text>
      )}
    </Box>
  );
}
