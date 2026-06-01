'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';

export default function CambiarPassword() {
  const router = useRouter();
  const textColor = useColorModeValue('navy.700', 'white');
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';

  const [show, setShow] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSuccess(null);
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword.length < 8) {
      setSuccess(null);
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSuccess(null);
      setError('La confirmacion no coincide con la nueva contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const body = new FormData();
      body.append('password', currentPassword);
      body.append('newPassword', newPassword);

      const response = await fetch(`${apiGatewayUrl}/actualizarpassword`, {
        method: 'PUT',
        body,
        credentials: 'include',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.Error ?? 'No fue posible actualizar la contraseña.'
        );
      }

      await fetch(`${apiGatewayUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null);

      setSuccess(
        data?.Msg ?? 'Contraseña actualizada. Inicie sesion nuevamente.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.refresh();
        window.location.replace('/auth/sign-in');
      }, 1200);
    } catch (submitError) {
      setSuccess(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Ocurrio un error inesperado.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      direction="column"
      pt={{ base: '130px', md: '80px', xl: '80px' }}
      align="center"
      px={4}
    >
      <Box
        bg="white"
        _dark={{ bg: 'navy.800' }}
        p={8}
        borderRadius="lg"
        boxShadow="md"
        w="100%"
        maxW="600px"
      >
        <Heading fontSize="2xl" mb="6" color={textColor}>
          Cambiar contraseña
        </Heading>

        {error ? (
          <Alert status="error" borderRadius="16px" mb={6}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {success ? (
          <Alert status="success" borderRadius="16px" mb={6}>
            <AlertIcon />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        <FormControl mb="4">
          <FormLabel color={textColor}>Contraseña actual</FormLabel>
          <InputGroup>
            <Input
              type={show ? 'text' : 'password'}
              placeholder="********"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <InputRightElement>
              <Icon
                as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                cursor="pointer"
                onClick={() => setShow(!show)}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <FormControl mb="4">
          <FormLabel color={textColor}>Nueva contraseña</FormLabel>
          <InputGroup>
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder="Minimo 8 caracteres"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <InputRightElement>
              <Icon
                as={showNew ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                cursor="pointer"
                onClick={() => setShowNew(!showNew)}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <FormControl mb="6">
          <FormLabel color={textColor}>Confirmar nueva contraseña</FormLabel>
          <InputGroup>
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repetir contraseña"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <InputRightElement>
              <Icon
                as={showConfirm ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                cursor="pointer"
                onClick={() => setShowConfirm(!showConfirm)}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Button
          colorScheme="blue"
          w="full"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Guardando"
        >
          Guardar nueva contraseña
        </Button>
      </Box>
    </Flex>
  );
}
