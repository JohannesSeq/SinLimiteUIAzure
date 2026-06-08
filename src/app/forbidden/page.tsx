'use client';

import { Box, Button, Heading, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import Link from 'next/link';

export default function ForbiddenPage() {
  const bg = useColorModeValue('white', 'navy.800');
  const titleColor = useColorModeValue('secondaryGray.900', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Box
        bg={bg}
        p={{ base: 8, md: 10 }}
        borderRadius="xl"
        boxShadow="lg"
        w="100%"
        maxW="560px"
        textAlign="center"
      >
        <Text fontSize="sm" fontWeight="bold" color="red.400" mb={2}>
          Error 403
        </Text>
        <Heading color={titleColor} fontSize={{ base: '2xl', md: '3xl' }} mb={4}>
          Acceso denegado
        </Heading>
        <Text color={textColor} mb={8}>
          No tienes permisos para acceder a esta pagina.
        </Text>

        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} justify="center">
          <Link href="/admin/dashboard">
            <Button colorScheme="blue">Ir al dashboard</Button>
          </Link>
          <Link href="/auth/sign-in">
            <Button variant="outline">Iniciar sesion</Button>
          </Link>
        </Stack>
      </Box>
    </Box>
  );
}
