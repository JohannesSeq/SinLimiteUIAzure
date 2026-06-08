'use client';

import {
  Box,
  Button,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import * as React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Cliente } from '../types';
import Card from 'components/card/Card';
import { FiEdit, FiTrash } from 'react-icons/fi';

const columnHelper = createColumnHelper<Cliente>();

export default function ClientesTable({
  data,
  onDelete,
}: {
  data: Cliente[];
  onDelete?: (cedula: string) => Promise<void>;
}) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const toast = useToast();

  const [deletingCedula, setDeletingCedula] = React.useState<string | null>(null);

  const handleDelete = async (cedula: string) => {
    const Swal = (await import('sweetalert2')).default;

    const result = await Swal.fire({
      title: 'Eliminar cliente',
      text: `Se eliminara el cliente con cedula ${cedula}. Esta accion no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingCedula(cedula);
      if (onDelete) {
        await onDelete(cedula);
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online'}/clientes/${cedula}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }
      }

      toast({
        title: 'Cliente eliminado',
        description: `El cliente con cedula ${cedula} fue eliminado.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
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
      setDeletingCedula(null);
    }
  };

  const columns = [
    columnHelper.accessor('cedula', {
      header: () => <Text color="gray.400">Cedula</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('nombre', {
      header: () => <Text color="gray.400">Nombre</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('apellidos', {
      header: () => <Text color="gray.400">Apellidos</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('numeroTelefono', {
      header: () => <Text color="gray.400">Telefono</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('idUsuario', {
      header: () => <Text color="gray.400">ID Usuario</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <Text color="gray.400">Acciones</Text>,
      cell: ({ row }) => (
        <Flex gap={2}>
          <Link href={`/admin/clientes/edit?cedula=${row.original.cedula}`}>
            <IconButton
              aria-label="Editar"
              icon={<FiEdit />}
              variant="ghost"
              colorScheme="blue"
              size="sm"
            />
          </Link>
          <IconButton
            aria-label="Eliminar"
            icon={<FiTrash />}
            variant="ghost"
            colorScheme="red"
            size="sm"
            isLoading={deletingCedula === row.original.cedula}
            onClick={() => handleDelete(row.original.cedula)}
          />
        </Flex>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
      <Flex justify="space-between" align="center" px={6} py={4}>
        <Text fontSize="xl" fontWeight="bold" color={textColor}>
          Clientes
        </Text>
        <Link href="/admin/clientes/create">
          <Button colorScheme="blue" size="sm">
            + Crear cliente
          </Button>
        </Link>
      </Flex>

      <Box>
        <Table variant="simple" color="gray.500" mb="24px">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Th key={header.id} borderColor={borderColor}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td key={cell.id} borderColor="transparent" fontSize="sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Card>
  );
}
