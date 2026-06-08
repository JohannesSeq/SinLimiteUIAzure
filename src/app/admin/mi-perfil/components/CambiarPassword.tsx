'use client';
import { Box, Button, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react';

export default function CambiarPassword() {
  return (
    <Box>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Contraseña actual</FormLabel>
          <Input type="password" />
        </FormControl>
        <FormControl>
          <FormLabel>Nueva contraseña</FormLabel>
          <Input type="password" />
        </FormControl>
        <FormControl>
          <FormLabel>Confirmar nueva contraseña</FormLabel>
          <Input type="password" />
        </FormControl>
        <Button colorScheme="blue" mt={4}>
          Cambiar contraseña
        </Button>
      </Stack>
    </Box>
  );
}
