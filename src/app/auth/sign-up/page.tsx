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
import { useRouter } from 'next/navigation';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';

interface MeResponse {
  id: string;
  email: string;
  estado: string;
  tipoUsuario?: string;
  scopes: string[];
}

export default function SignUp() {
  const router = useRouter();
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const brandStars = useColorModeValue('brand.500', 'brand.400');
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:5200';

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [nombre, setNombre] = React.useState('');
  const [apellidos, setApellidos] = React.useState('');
  const [cedula, setCedula] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [telefono, setTelefono] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSignUp = async () => {
    setLoading(true);
    setError('');

    if (!nombre || !apellidos) {
      setError('Ingrese nombre y apellidos.');
      setLoading(false);
      return;
    }

    if (!cedula || !telefono || !email || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('La confirmacion de contraseña no coincide.');
      setLoading(false);
      return;
    }

    if (!/^\d+$/.test(cedula)) {
      setError('La cedula debe contener solo numeros.');
      setLoading(false);
      return;
    }

    if (!/^\d+$/.test(telefono)) {
      setError('El telefono debe contener solo numeros.');
      setLoading(false);
      return;
    }

    try {
      const registroBody = new URLSearchParams({
        correo: email,
        password,
        tipoUsuario: 'Cliente',
      });

      const registroResponse = await fetch(`${apiGatewayUrl}/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: registroBody,
      });

      const registroData = await registroResponse.json().catch(() => null);

      if (!registroResponse.ok) {
        throw new Error(
          registroData?.Error ?? 'Error creando el usuario.'
        );
      }

      const meResponse = await fetch(`${apiGatewayUrl}/me`, {
        method: 'GET',
        credentials: 'include',
      });

      const meData = (await meResponse.json().catch(() => null)) as
        | MeResponse
        | null;

      if (!meResponse.ok || !meData?.id) {
        throw new Error('No fue posible recuperar el usuario recien creado.');
      }

      const clienteBody = new FormData();
      clienteBody.append('cedula', cedula);
      clienteBody.append('nombre', nombre);
      clienteBody.append('apellidos', apellidos);
      clienteBody.append('numeroTelefono', telefono);
      clienteBody.append('correo', email);
      clienteBody.append('idUsuario', meData.id);

      const clienteResponse = await fetch(`${apiGatewayUrl}/clientes`, {
        method: 'POST',
        body: clienteBody,
      });

      const clienteData = await clienteResponse.json().catch(() => null);

      if (!clienteResponse.ok) {
        throw new Error(
          clienteData?.Error ?? 'Error creando el cliente.'
        );
      }

      router.push('/admin/mi-perfil');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrio un error inesperado.'
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
            Crear cuenta
          </Heading>
          <Text
            mb="36px"
            ms="4px"
            color={textColorSecondary}
            fontWeight="400"
            fontSize="md"
          >
            Completa los siguientes campos para registrarte
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
              Nombre <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <Input
              placeholder="Juan"
              size="lg"
              mb="20px"
              variant="auth"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <FormLabel color={textColor} fontSize="sm" fontWeight="500" mb="8px">
              Apellidos <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <Input
              placeholder="Perez Lopez"
              size="lg"
              mb="20px"
              variant="auth"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
            />

            <FormLabel color={textColor} fontSize="sm" fontWeight="500" mb="8px">
              Cedula <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <Input
              placeholder="12345678"
              size="lg"
              mb="20px"
              variant="auth"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />

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
              Telefono <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <Input
              placeholder="88887777"
              size="lg"
              mb="20px"
              type="tel"
              variant="auth"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />

            <FormLabel color={textColor} fontSize="sm" fontWeight="500" mb="8px">
              Contraseña <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <InputGroup size="md" mb="20px">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimo 8 caracteres"
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

            <FormLabel color={textColor} fontSize="sm" fontWeight="500" mb="8px">
              Confirmar contraseña <Text as="span" color={brandStars}>*</Text>
            </FormLabel>
            <InputGroup size="md" mb="24px">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repetir contraseña"
                size="lg"
                variant="auth"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <InputRightElement display="flex" alignItems="center" mt="4px">
                <Icon
                  color="gray.400"
                  _hover={{ cursor: 'pointer' }}
                  as={showConfirm ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                  onClick={() => setShowConfirm(!showConfirm)}
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
              onClick={handleSignUp}
              isLoading={loading}
            >
              Registrarse
            </Button>
          </FormControl>

          <Flex flexDirection="column" justifyContent="center" alignItems="start" mt="0px">
            <Link href="/auth/sign-in">
              <Text color={textColor} fontWeight="400" fontSize="14px">
                Ya tienes una cuenta?
                <Text as="span" ms="5px" color={textColorBrand} fontWeight="500">
                  Inicia sesion
                </Text>
              </Text>
            </Link>
          </Flex>
        </Flex>
      </Flex>
    </DefaultAuthLayout>
  );
}
