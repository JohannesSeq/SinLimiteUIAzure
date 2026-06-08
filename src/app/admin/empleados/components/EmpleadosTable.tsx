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
import { FiEdit, FiTrash } from 'react-icons/fi';
import Card from 'components/card/Card';
import { Empleado } from '../types';

const columnHelper = createColumnHelper<Empleado>();

export default function EmpleadosTable({
  data,
  onDelete,
}: {
  data: Empleado[];
  onDelete?: (idEmpleado: number) => Promise<void>;
}) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const toast = useToast();
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (empleado: Empleado) => {
    try {
      const Swal = (await import('sweetalert2')).default;
      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Eliminar empleado?',
        text: `Se eliminará a ${empleado.nombre} ${empleado.apellidos}.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;

      setDeletingId(empleado.idEmpleado);
      if (onDelete) {
        await onDelete(empleado.idEmpleado);
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'https://dev.gateway.limitlesscr.online'}/empleados/${empleado.idEmpleado}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Error HTTP ${response.status}`);
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Empleado eliminado',
        text: 'El empleado fue eliminado correctamente.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'No se pudo eliminar',
        description: message,
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    columnHelper.accessor('idEmpleado', {
      header: () => <Text color="gray.400">ID</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('nombre', {
      header: () => <Text color="gray.400">Nombre</Text>,
      cell: ({ row }) => (
        <Text color={textColor}>{`${row.original.nombre} ${row.original.apellidos}`}</Text>
      ),
    }),
    columnHelper.accessor('puesto', {
      header: () => <Text color="gray.400">Puesto</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('departamento', {
      header: () => <Text color="gray.400">Departamento</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('numeroTelefono', {
      header: () => <Text color="gray.400">Teléfono</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue() || '-'}</Text>,
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <Text color="gray.400">Acciones</Text>,
      cell: ({ row }) => (
        <Flex gap={2}>
          <Link href={`/admin/empleados/perfil?idEmpleado=${row.original.idEmpleado}`}>
            <Button size="sm" variant="outline" colorScheme="gray">
              Detalles
            </Button>
          </Link>
          <Link href={`/admin/empleados/editar?idEmpleado=${row.original.idEmpleado}`}>
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
            isLoading={deletingId === row.original.idEmpleado}
            onClick={() => handleDelete(row.original)}
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
          Empleados
        </Text>
        <Flex gap={2}>
          <Link href="/admin/empleados/crear">
            <Button colorScheme="blue" size="sm">
              + Crear empleado
            </Button>
          </Link>
          

        </Flex>
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
