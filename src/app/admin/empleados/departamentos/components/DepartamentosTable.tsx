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
import { Departamento } from '../types';

interface Props {
  data: Departamento[];
  onDelete: (idDepartamento: string) => Promise<void>;
}

export default function DepartamentosTable({ data, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const headerBg = useColorModeValue('gray.100', 'gray.700');

  const handleDelete = async (departamento: Departamento) => {
    const result = await Swal.fire({
      title: 'Eliminar departamento',
      text: `El departamento "${departamento.nombreDepartamento}" sera eliminado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(departamento.idDepartamento);
      await onDelete(departamento.idDepartamento);

      await Swal.fire({
        title: 'Departamento eliminado',
        text: 'El departamento fue eliminado correctamente.',
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
            <Th>Descripcion</Th>
            <Th textAlign="center">Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((departamento) => (
            <Tr key={departamento.idDepartamento}>
              <Td>{departamento.nombreDepartamento}</Td>
              <Td>{departamento.descripcion || 'Sin descripcion'}</Td>
              <Td>
                <Flex justify="center" gap={2}>
                  <Link
                    href={`/admin/empleados/departamentos/editar?idDepartamento=${departamento.idDepartamento}`}
                  >
                    <Button size="sm" colorScheme="blue">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    isLoading={deletingId === departamento.idDepartamento}
                    onClick={() => handleDelete(departamento)}
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
          No hay departamentos registrados.
        </Text>
      ) : null}
    </Box>
  );
}
