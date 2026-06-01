'use client';

import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormLabel,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

export const PERMISSION_CATALOG = [
  {
    module: 'Usuarios',
    permissions: ['usuarios.read', 'usuarios.write', 'usuarios.delete'],
  },
  {
    module: 'Roles',
    permissions: ['roles.read', 'roles.write', 'roles.delete'],
  },
  {
    module: 'Clientes',
    permissions: ['clientes.read', 'clientes.write', 'clientes.delete'],
  },
  {
    module: 'Empleados',
    permissions: ['empleados.read', 'empleados.write', 'empleados.delete'],
  },
  {
    module: 'Vehiculos',
    permissions: ['vehiculos.read', 'vehiculos.write', 'vehiculos.delete'],
  },
  {
    module: 'Citas',
    permissions: ['citas.read', 'citas.write', 'citas.delete'],
  },
];

type PermissionSelectorProps = {
  value: string[];
  onChange: (permissions: string[]) => void;
};

const prettyPermissionName = (permission: string) => {
  const action = permission.split('.').pop() ?? permission;

  if (action === 'read') return 'Leer';
  if (action === 'write') return 'Crear / Editar';
  if (action === 'delete') return 'Eliminar';

  return action;
};

export default function PermissionSelector({ value, onChange }: PermissionSelectorProps) {
  const cardBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  const toggleModule = (permissions: readonly string[]) => {
    const allSelected = permissions.every((permission) => value.includes(permission));

    if (allSelected) {
      onChange(value.filter((permission) => !permissions.includes(permission)));
      return;
    }

    onChange(Array.from(new Set([...value, ...permissions])));
  };

  const clearAll = () => onChange([]);
  const selectAll = () =>
    onChange(Array.from(new Set(PERMISSION_CATALOG.flatMap((item) => [...item.permissions]))));

  return (
    <FormControl>
      <Flex justify="space-between" align={{ base: 'start', md: 'center' }} mb={3} gap={3} flexWrap="wrap">
        <FormLabel m={0}>Permisos</FormLabel>
        <Flex gap={2} flexWrap="wrap">
          <Button size="sm" variant="outline" onClick={selectAll}>
            Seleccionar todo
          </Button>
          <Button size="sm" variant="ghost" onClick={clearAll}>
            Limpiar
          </Button>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {PERMISSION_CATALOG.map((group) => (
          <Box
            key={group.module}
            borderWidth="1px"
            borderColor={borderColor}
            bg={cardBg}
            borderRadius="xl"
            p={4}
          >
            <Flex justify="space-between" align="center" mb={3} gap={3}>
              <Text fontWeight="bold">{group.module}</Text>
              <Button size="xs" variant="link" onClick={() => toggleModule(group.permissions)}>
                {group.permissions.every((permission) => value.includes(permission))
                  ? 'Quitar modulo'
                  : 'Agregar modulo'}
              </Button>
            </Flex>

            <CheckboxGroup value={value} onChange={(nextValue) => onChange(nextValue as string[])}>
              <Stack spacing={3}>
                {group.permissions.map((permission) => (
                  <Checkbox key={permission} value={permission}>
                    {prettyPermissionName(permission)}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </Box>
        ))}
      </SimpleGrid>

      <Box mt={4}>
        <Text fontSize="sm" color="gray.500" mb={2}>
          Permisos seleccionados: {value.length}
        </Text>
        <Flex gap={2} flexWrap="wrap">
          {value.length > 0 ? (
            value.map((permission) => (
              <Badge key={permission} colorScheme="blue" borderRadius="full" px={3} py={1}>
                {permission}
              </Badge>
            ))
          ) : (
            <Text fontSize="sm" color="gray.500">
              No hay permisos seleccionados.
            </Text>
          )}
        </Flex>
      </Box>
    </FormControl>
  );
}
