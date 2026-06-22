'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  idUsuario: string;
  tipoUsuario: string;
  apiGatewayUrl: string;
}

export default function EliminarCuentaModal({ isOpen, onClose, idUsuario, tipoUsuario, apiGatewayUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEliminar = async () => {
    setLoading(true);
    setError(null);

    try {
      if (tipoUsuario === 'Cliente') {
        const clienteRes = await fetch(`${apiGatewayUrl}/clientes/usuario/${idUsuario}`);
        if (clienteRes.ok) {
          const cliente = await clienteRes.json() as Record<string, unknown>;
          const cedula = String(cliente.cedula ?? cliente.Cedula ?? '');
          if (cedula) {
            await fetch(`${apiGatewayUrl}/clientes/${cedula}`, { method: 'DELETE' });
          }
        }
      }

      await fetch(`${apiGatewayUrl}/usuarios/${idUsuario}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      await fetch(`${apiGatewayUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      router.push('/auth/sign-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta.');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Eliminar cuenta</ModalHeader>
        <ModalBody>
          <Text>¿Estás seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.</Text>
          {error ? (
            <Text color="red.500" mt={3} fontSize="sm">{error}</Text>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button colorScheme="red" onClick={handleEliminar} isLoading={loading}>
            Eliminar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
