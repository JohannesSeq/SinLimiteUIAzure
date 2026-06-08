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
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from 'react';
import { Usuario } from '../types';
import { Rol } from '../../types';

interface Props {
  data: Usuario[];
  onDelete?: (idUsuario: string) => Promise<void>;
}

export default function UsuariosTable({ data, onDelete }: Props) {
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (usuario: Usuario) => {
    const result = await Swal.fire({
      title: '¿Eliminar asignación?',
      text: `El usuario "${usuario.correo}" será desasignado del rol.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(usuario.idUsuario);

      if (onDelete) {
        await onDelete(usuario.idUsuario);
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online'}/AsignacionRoles/${usuario.idUsuario}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }
      }

      await Swal.fire({
        title: 'Asignacion eliminada correctamente',
        text: `El usuario ${usuario.correo} fue eliminado correctamente del rol.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';

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
        <Thead bg={useColorModeValue('gray.100', 'gray.700')}>
          <Tr>
            <Th>Correo</Th>
            <Th textAlign="center">Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((usuario) => (
            <Tr key={usuario.idUsuario}>
              <Td>{usuario.correo}</Td>
              <Td>
                <Flex justify="center" gap={2}>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    isLoading={deletingId === usuario.idUsuario}
                    onClick={() => handleDelete(usuario)}
                  >
                    Eliminar
                  </Button>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {data.length === 0 && (
        <Text p={4} textAlign="center" color="gray.500">
          No hay roles registrados.
        </Text>
      )}
    </Box>
  );
}
