'use client';

import Swal from 'sweetalert2';
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
import Link from 'next/link';
import { useState } from 'react';
import { Puesto } from '../types';

interface Props {
  data: Puesto[];
  onDelete: (idPuesto: string) => Promise<void>;
}

export default function PuestosTable({ data, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const headerBg = useColorModeValue('gray.100', 'gray.700');

  const handleDelete = async (puesto: Puesto) => {
    const result = await Swal.fire({
      title: 'Eliminar puesto',
      text: `El puesto "${puesto.nombrePuesto}" sera eliminado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(puesto.idPuesto);
      await onDelete(puesto.idPuesto);

      await Swal.fire({
        title: 'Puesto eliminado',
        text: 'El puesto fue eliminado correctamente.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      await Swal.fire({
        title: 'No se pudo eliminar',
        text: message,
        icon: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box overflowX="auto" borderRadius="lg" border="1px solid" borderColor="gray.200">
      <Table variant="simple">
        <Thead bg={headerBg}>
          <Tr>
            <Th>Nombre</Th>
            <Th>Salario base</Th>
            <Th>Descripcion</Th>
            <Th textAlign="center">Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((puesto) => (
            <Tr key={puesto.idPuesto}>
              <Td>{puesto.nombrePuesto}</Td>
              <Td>{puesto.salarioBase.toLocaleString('es-CR')}</Td>
              <Td>{puesto.descripcion || 'Sin descripcion'}</Td>
              <Td>
                <Flex justify="center" gap={2}>
                  <Link href={`/admin/empleados/puestos/editar?idPuesto=${puesto.idPuesto}`}>
                    <Button size="sm" colorScheme="blue">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    isLoading={deletingId === puesto.idPuesto}
                    onClick={() => handleDelete(puesto)}
                  >
                    Eliminar
                  </Button>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {data.length === 0 ? (
        <Text p={4} textAlign="center" color="gray.500">
          No hay puestos registrados.
        </Text>
      ) : null}
    </Box>
  );
}
