'use client';

import React from 'react';
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
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import DefaultAuthLayout from 'layouts/auth/Default';
import Link from 'next/link';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';

export default function SignInPage() {
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const brandStars = useColorModeValue('brand.500', 'brand.400');
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';

  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Correo y contraseña son obligatorios.');
      setLoading(false);
      return;
    }

    try {
      const body = new URLSearchParams({
        correo: email,
        password,
      });

      const response = await fetch(`${apiGatewayUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        let message = 'Credenciales invalidas.';

        try {
          const data = await response.json();
          if (typeof data?.Error === 'string' && data.Error.trim()) {
            message = data.Error;
          }
        } catch {
          // Si la respuesta no trae JSON, mantenemos el mensaje generico.
        }

        throw new Error(message);
      }

      window.location.replace('/admin/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrio un error al iniciar sesion.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultAuthLayout illustrationBackground="/img/auth/auth.png">
      <Flex
        maxW={{ base: '100%', md: 'max-content' }}
        w="100%"
        mx={{ base: 'auto', lg: '0px' }}
        me="auto"
        h="100%"
        alignItems="start"
        justifyContent="center"
        mb={{ base: '30px', md: '60px' }}
        px={{ base: '25px', md: '0px' }}
        mt={{ base: '40px', md: '14vh' }}
        flexDirection="column"
      >
        <Box me="auto">
          <Heading color={textColor} fontSize="36px" mb="10px">
            Iniciar sesion
          </Heading>
          <Text
            mb="36px"
            ms="4px"
            color={textColorSecondary}
            fontWeight="400"
            fontSize="md"
          >
            Ingresa tu correo y contraseña para continuar
          </Text>
        </Box>

        <Flex
          zIndex="2"
          direction="column"
          w={{ base: '100%', md: '420px' }}
          maxW="100%"
          background="transparent"
          borderRadius="15px"
          mx={{ base: 'auto', lg: 'unset' }}
          me="auto"
          mb={{ base: '20px', md: 'auto' }}
        >
          {error ? (
            <Alert status="error" borderRadius="16px" mb="20px">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <FormControl>
            <FormLabel color={textColor} fontSize="sm" fontWeight="500" mb="8px">
              Correo electronico <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <Input
              placeholder="correo@ejemplo.com"
              size="lg"
              mb="20px"
              type="email"
              variant="auth"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FormLabel color={textColor} fontSize="sm" fontWeight="500" mb="8px">
              Contraseña <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <InputGroup size="md" mb="24px">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                size="lg"
                variant="auth"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputRightElement display="flex" alignItems="center" mt="4px">
                <Icon
                  color="gray.400"
                  _hover={{ cursor: 'pointer' }}
                  as={showPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </InputRightElement>
            </InputGroup>

            <Button
              fontSize="sm"
              variant="brand"
              fontWeight="500"
              w="100%"
              h="50px"
              mb="24px"
              onClick={handleSignIn}
              isLoading={loading}
            >
              Iniciar sesion
            </Button>
          </FormControl>

          <Flex flexDirection="column" justifyContent="center" alignItems="start" mt="0px">
            <Link href="/auth/sign-up">
              <Text color={textColor} fontWeight="400" fontSize="14px">
                No tienes cuenta?
                <Text as="span" ms="5px" color={textColorBrand} fontWeight="500">
                  Registrate
                </Text>
              </Text>
            </Link>
          </Flex>
        </Flex>
      </Flex>
    </DefaultAuthLayout>
  );
}
