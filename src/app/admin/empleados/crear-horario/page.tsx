'use client';

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';

export default function CrearHorarioPage() {
  const textColor = useColorModeValue('navy.700', 'white');

  return (
    <Flex direction="column" pt={{ base: '130px', md: '80px', xl: '80px' }} align="center" px={4}>
      <Box
        bg="white"
        _dark={{ bg: 'navy.800' }}
        p={8}
        borderRadius="lg"
        boxShadow="md"
        w="100%"
        maxW="600px"
      >
        <Heading fontSize="2xl" mb={6} color={textColor}>
          Crear horario
        </Heading>

        <FormControl mb={4}>
          <FormLabel color={textColor}>Empleado</FormLabel>
          <Select placeholder="Seleccione un empleado">
            <option value="1">Carlos Rodríguez</option>
            <option value="2">Laura Gómez</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel color={textColor}>Día de la semana</FormLabel>
          <Select placeholder="Seleccione un día">
            <option>Lunes</option>
            <option>Martes</option>
            <option>Miércoles</option>
            <option>Jueves</option>
            <option>Viernes</option>
            <option>Sábado</option>
            <option>Domingo</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel color={textColor}>Hora de inicio</FormLabel>
          <Input type="time" />
        </FormControl>

        <FormControl mb={6}>
          <FormLabel color={textColor}>Hora de fin</FormLabel>
          <Input type="time" />
        </FormControl>

        <Button colorScheme="blue" w="full">
          Guardar horario
        </Button>
      </Box>
    </Flex>
  );
}
