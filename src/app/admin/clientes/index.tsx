'use client';

import { Box, SimpleGrid } from '@chakra-ui/react';
import ClientesTable from './components/ClienteTable';
import { tableDataClientes } from './tableDataClientes';

export default function ClientesPage() {
  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <SimpleGrid columns={1} gap="20px">
        <ClientesTable data={tableDataClientes} />
      </SimpleGrid>
    </Box>
  );
}
