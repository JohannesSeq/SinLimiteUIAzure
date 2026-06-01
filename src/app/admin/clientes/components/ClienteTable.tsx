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
} from '@chakra-ui/react';
import Link from 'next/link';
import * as React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Card from 'components/card/Card';
import { FiEdit } from 'react-icons/fi'; // Icono de edición

type Cliente = {
  id?: string;
  nombre: string;
  cedula: string;
  correo: string;
  telefono: string;
  fechaRegistro: string;
};

const columnHelper = createColumnHelper<Cliente>();

export default function ClientesTable({ data }: { data: Cliente[] }) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  const columns = [
    columnHelper.accessor('nombre', {
      header: () => <Text color="gray.400">Nombre</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('cedula', {
      header: () => <Text color="gray.400">Cédula</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('correo', {
      header: () => <Text color="gray.400">Correo</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('telefono', {
      header: () => <Text color="gray.400">Teléfono</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('fechaRegistro', {
      header: () => <Text color="gray.400">Fecha Registro</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <Text color="gray.400">Acciones</Text>,
      cell: ({ row }) => (
        <Link href={`/admin/clientes/edit?id=${row.original.id}`}>
          <IconButton
            aria-label="Editar"
            icon={<FiEdit />}
            variant="ghost"
            colorScheme="blue"
            size="sm"
          />
        </Link>
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
