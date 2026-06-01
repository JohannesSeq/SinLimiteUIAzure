'use client';
import { Box, Button, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react';

export default function EditarPerfil() {
  return (
    <Box>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Nombre</FormLabel>
          <Input placeholder="Juan Pérez" />
        </FormControl>
        <FormControl>
          <FormLabel>Correo</FormLabel>
          <Input type="email" placeholder="juan@example.com" />
        </FormControl>
        <FormControl>
          <FormLabel>Teléfono</FormLabel>
          <Input placeholder="123-456-7890" />
        </FormControl>
        <Button colorScheme="blue" mt={4}>
          Guardar cambios
        </Button>
      </Stack>
    </Box>
  );
}
