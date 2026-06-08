'use client';

import {
  Flex,
  Box,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import * as React from 'react';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import Card from 'components/card/Card';
import Menu from 'components/menu/MainMenu';

type Cita = {
  cliente: string;
  servicio: string;
  fecha: string;
  hora: string;
  tecnico: string;
  estado: string;
};

const columnHelper = createColumnHelper<Cita>();

export default function CheckTable({ tableData }: { tableData: Cita[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  const columns = [
    columnHelper.accessor('cliente', {
      id: 'cliente',
      header: () => <Text color="gray.400">Cliente</Text>,
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="500">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('servicio', {
      id: 'servicio',
      header: () => <Text color="gray.400">Servicio</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('fecha', {
      id: 'fecha',
      header: () => <Text color="gray.400">Fecha</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('hora', {
      id: 'hora',
      header: () => <Text color="gray.400">Hora</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('tecnico', {
      id: 'tecnico',
      header: () => <Text color="gray.400">Técnico</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('estado', {
      id: 'estado',
      header: () => <Text color="gray.400">Estado</Text>,
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
  ];

  const table = useReactTable({
    data: tableData ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
      <Table variant="simple">
        <Thead>
          {table.getHeaderGroups().map((hg) => (
            <Tr key={hg.id}>
              {hg.headers.map((header) => (
                <Th key={header.id} borderColor={borderColor}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>

        <Tbody>
          {table.getRowModel()?.rows?.slice(0, 5)?.map((row) => (
            <Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Td key={cell.id} borderColor="transparent">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
