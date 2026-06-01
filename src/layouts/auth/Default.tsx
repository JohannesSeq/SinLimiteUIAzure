// Chakra imports
import { Box, Flex, Icon, useColorModeValue, Text } from '@chakra-ui/react';
import Footer from 'components/footer/FooterAuth';
import FixedPlugin from 'components/fixedPlugin/FixedPlugin';
// Assets
import { FaChevronLeft } from 'react-icons/fa';
import Link from 'next/link';
import { ReactNode } from 'react';

function AuthIllustration(props: {
  children: ReactNode;
  illustrationBackground: string; // Esta ya no se usa, pero se puede dejar si querés compatibilidad
}) {
  const authBg = useColorModeValue('white', 'navy.900');
  const { children } = props;

  return (
    <Flex
      minH="100vh"
      w="100%"
      bg={authBg}
      position="relative"
      align="center"
      justify="center"
      direction="column"
      px="25px"
    >
      <Link
        href="/admin/dashboard"
        style={{
          width: 'fit-content',
          marginBottom: '20px',
        }}
      >
        <Flex
          align="center"
          pt="20px"
          w="fit-content"
        >

          <Text ms="0px" fontSize="sm" color="secondaryGray.600">
            Volver al inicio
          </Text>
        </Flex>
      </Link>

      {/* Contenido centrado */}
      {children}

      <Footer mt="40px" mb={{ xl: '3vh' }} />
      <FixedPlugin />
    </Flex>
  );
}

export default AuthIllustration;
