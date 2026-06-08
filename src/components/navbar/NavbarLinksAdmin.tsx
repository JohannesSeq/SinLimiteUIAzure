'use client';

import {
  Box,
  Button,
  Center,
  Flex,
  Icon,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';

import { useRouter } from 'next/navigation';
import { ItemContent } from 'components/menu/ItemContent';
import { SearchBar } from 'components/navbar/searchBar/SearchBar';
import { SidebarResponsive } from 'components/sidebar/Sidebar';
import { useAuthorizedRoutes } from 'hooks/useAuthorizedRoutes';
import { useAuth } from 'contexts/AuthContext';

import navImage from '/public/img/layout/Navbar.png';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import { MdInfoOutline, MdNotificationsNone } from 'react-icons/md';

import Swal from 'sweetalert2';

export default function HeaderLinks(props: {
  secondary: boolean;
  onOpen: boolean | any;
  fixed: boolean | any;
}) {
  const { secondary } = props;
  const router = useRouter();
  const { colorMode, toggleColorMode } = useColorMode();

  const navbarIcon = useColorModeValue('gray.400', 'white');
  const menuBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');
  const shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
    '14px 17px 40px 4px rgba(112, 144, 176, 0.06)',
  );
  const borderButton = useColorModeValue('secondaryGray.500', 'whiteAlpha.200');

  const { routes: filteredRoutes } = useAuthorizedRoutes();
  const { user, logout, loading } = useAuth();

  // ==========================
  // USER DATA
  // ==========================
  const emailName = user?.email?.split('@')[0] ?? 'Usuario';
  const userName = emailName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ') || 'Usuario';

  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'US';

  // ==========================
  // LOGOUT HANDLER
  // ==========================
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Tu sesión actual se cerrará.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    await logout();

    await Swal.fire({
      title: 'Sesión cerrada',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });

    router.push('/auth/sign-in');
  };

  return (
    <Flex
      w={{ sm: '100%', md: 'auto' }}
      alignItems="center"
      flexDirection="row"
      bg={menuBg}
      p="10px"
      borderRadius="30px"
      boxShadow={shadow}
    >
      <SearchBar me="10px" borderRadius="30px" />
      <SidebarResponsive routes={filteredRoutes} />

      {/* ================= NOTIFICATIONS ================= */}
      <Menu>
        <MenuButton p="0px">
          <Icon
            mt="6px"
            as={MdNotificationsNone}
            color={navbarIcon}
            w="18px"
            h="18px"
            me="10px"
          />
        </MenuButton>
        <MenuList boxShadow={shadow} p="20px" borderRadius="20px" bg={menuBg}>
          <Text fontWeight="600" color={textColor}>
            Notifications
          </Text>
          <MenuItem _hover={{ bg: 'none' }}>
            <ItemContent info="Horizon UI Dashboard PRO" />
          </MenuItem>
        </MenuList>
      </Menu>

      {/* ================= INFO MENU ================= */}
      <Menu>
        <MenuButton p="0px">
          <Icon
            mt="6px"
            as={MdInfoOutline}
            color={navbarIcon}
            w="18px"
            h="18px"
            me="10px"
          />
        </MenuButton>
        <MenuList boxShadow={shadow} p="20px" borderRadius="20px" bg={menuBg}>
          <Image src={navImage.src} borderRadius="16px" mb="20px" alt="" />
          <Link href="https://horizon-ui.com/pro">
            <Button w="100%" mb="10px" variant="brand">
              Buy Horizon UI PRO
            </Button>
          </Link>
          <Link href="https://horizon-ui.com/documentation/docs/introduction">
            <Button
              w="100%"
              mb="10px"
              border="1px solid"
              bg="transparent"
              borderColor={borderButton}
            >
              See Documentation
            </Button>
          </Link>
        </MenuList>
      </Menu>

      {/* ================= DARK MODE ================= */}
      <Button
        variant="no-hover"
        bg="transparent"
        p="0px"
        minW="unset"
        minH="unset"
        onClick={toggleColorMode}
      >
        <Icon
          me="10px"
          h="18px"
          w="18px"
          color={navbarIcon}
          as={colorMode === 'light' ? IoMdMoon : IoMdSunny}
        />
      </Button>

      {/* ================= USER AREA ================= */}

      {loading ? null : user ? (
        // ====== LOGUEADO ======
        <Menu>
          <MenuButton p="0px" position="relative">
            <Box
              bg="#11047A"
              w="40px"
              h="40px"
              borderRadius="50%"
              _hover={{ cursor: 'pointer' }}
            />
            <Center position="absolute" top={0} left={0} w="100%" h="100%">
              <Text fontSize="xs" fontWeight="bold" color="white">
                {userInitials}
              </Text>
            </Center>
          </MenuButton>

          <MenuList boxShadow={shadow} borderRadius="20px" bg={menuBg}>
            <Text
              px="20px"
              py="12px"
              borderBottom="1px solid"
              borderColor={borderColor}
              fontSize="sm"
              fontWeight="700"
              color={textColor}
            >
              👋 Bienvenido, {userName}
            </Text>

            <MenuItem onClick={() => router.push('/admin/mi-perfil')}>
              <Text fontSize="sm">Mi perfil</Text>
            </MenuItem>

            <MenuItem color="red.400" onClick={handleLogout}>
              <Text fontSize="sm">Cerrar Sesion</Text>
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        // ====== NO LOGUEADO ======
        <Button
          bg="#11047A"
          color="white"
          borderRadius="30px"
          size="sm"
          _hover={{ opacity: 0.9 }}
          onClick={() => router.push('/auth/sign-in')}
        >
          Iniciar sesión
        </Button>
      )}
    </Flex>
  );
}
