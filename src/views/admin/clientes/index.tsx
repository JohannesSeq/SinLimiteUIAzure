'use client';

import { Box, Text } from '@chakra-ui/react';
import ClientesTable from './ClientesTable';
import { tableDataClientes } from './tableDataClientes';

export default function ClientesPage() {
  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Text fontSize="2xl" fontWeight="bold" mb="6">
        Lista de Clientes
      </Text>
      <ClientesTable data={tableDataClientes} />
    </Box>
  );
}
