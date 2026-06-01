'use client';

import {
  Box,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import * as React from 'react';
import { Cita } from '../types';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

export default function CitasTable({ 
  data,
  onDelete 
}: {
  data: Cita[]; 
  onDelete?: (idCita: string) => Promise<void>;
}) {
  const toast = useToast();

  const[deletingCita, setDeletingCita] = React.useState<string | null>(null);

  const handleDelete = async (idCita: string) => {
    try {
      const Swal = (await import('sweetalert2')).default;
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: '¿Eliminar cita?',
        text: 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (!confirmation.isConfirmed) return;

      setDeletingCita(idCita);
      if (onDelete) {
        await onDelete(idCita);
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200'}/citas/${idCita}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Cita eliminada',
        text: 'La cita fue eliminada correctamente.',
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'No se pudo eliminar',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingCita(null);
    }
  };
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" color="gray.700">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Cliente</Th>
            <Th>Empleado</Th>
            <Th>Vehículo</Th>
            <Th>Fecha</Th>
            <Th>Hora</Th>
            <Th>Servicio</Th>
            <Th>Estado</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((cita) => (
            <Tr key={cita.idCita}>
              <Td>{cita.idCita}</Td>
              <Td>{cita.cedulaCliente || 'Sin asignar'}</Td>
              <Td>{cita.idEmpleado || 'Sin asignar'}</Td>
              <Td>{cita.placa || 'Sin asignar'}</Td>
              <Td>{cita.fecha}</Td>
              <Td>{cita.hora}</Td>
              <Td>{cita.servicio}</Td>
              <Td>{cita.estado}</Td>
              <Td>
                <Flex gap={2}>
                  <Link href={`/admin/citas/detalles?idCita=${cita.idCita}`}>
                    <IconButton aria-label="Ver" icon={<FiEye />} size="sm" />
                  </Link>
                  <Link href={`/admin/citas/editar?idCita=${cita.idCita}`}>
                    <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" colorScheme="blue" />
                  </Link>
                  <IconButton aria-label="Eliminar" icon={<FiTrash2 />} size="sm" colorScheme="red"
                    isLoading={deletingCita === cita.idCita}
                    onClick={() => handleDelete(cita.idCita)}
                  />
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
