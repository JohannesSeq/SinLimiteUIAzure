'use client'
/* eslint-disable */
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Link,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbarLinks from 'components/navbar/NavbarLinksAdmin'
import { isWindowAvailable } from 'utils/navigation'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Inicio',
  dashboard: 'Inicio',
  empleados: 'Empleados',
  crear: 'Crear',
  editar: 'Editar',
  perfil: 'Perfil',
  clientes: 'Clientes',
  create: 'Crear',
  edit: 'Editar',
  citas: 'Citas',
  detalles: 'Detalles',
  'cita-usuario': 'Mis Citas',
  vehiculos: 'Vehiculos',
  roles: 'Roles',
  asignar: 'Asignar',
  'mi-perfil': 'Mi Perfil',
  'cambiar-password': 'Cambiar Contraseña',
  puestos: 'Puestos',
  departamentos: 'Departamentos',
  auth: 'Autenticacion',
  'sign-in': 'Iniciar Sesion',
  'sign-up': 'Registrarme'
}

const humanizeSegment = (segment: string) => {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment]
  }

  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const normalizeBreadcrumbHref = (href: string, pathname: string) => {
  if (href === '/admin') {
    return '/admin/dashboard'
  }

  if (href === '/admin/citas' && pathname.startsWith('/admin/citas/cita-usuario')) {
    return '/admin/citas/cita-usuario'
  }

  if (href === '/admin/vehiculos' && pathname.startsWith('/admin/vehiculos/mis-vehiculos')) {
    return '/admin/vehiculos/mis-vehiculos'
  }

  return href
}

export default function AdminNavbar (props: {
  secondary: boolean
  message: string | boolean
  brandText: string
  logoText: string
  fixed: boolean
  onOpen: (...args: any[]) => any
}) {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (isWindowAvailable()) {
      window.addEventListener('scroll', changeNavbar)

      return () => {
        window.removeEventListener('scroll', changeNavbar)
      }
    }
  }, [])

  const { secondary } = props

  let mainText = useColorModeValue('navy.700', 'white')
  let secondaryText = useColorModeValue('gray.700', 'white')
  let navbarPosition = 'fixed' as const
  let navbarFilter = 'none'
  let navbarBackdrop = 'blur(20px)'
  let navbarShadow = 'none'
  let navbarBg = useColorModeValue(
    'rgba(244, 247, 254, 0.2)',
    'rgba(11,20,55,0.5)'
  )
  let navbarBorder = 'transparent'
  let secondaryMargin = '0px'
  let paddingX = '15px'
  let gap = '0px'
  const changeNavbar = () => {
    if (isWindowAvailable() && window.scrollY > 1) {
      setScrolled(true)
    } else {
      setScrolled(false)
    }
  }

  const breadcrumbs = useMemo(() => {
    const segments = (pathname || '/')
      .split('/')
      .filter(Boolean)

    if (segments.length === 0) {
      return [{ label: 'Inicio', href: '/admin/dashboard' }]
    }

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      return {
        label: humanizeSegment(segment),
        href: normalizeBreadcrumbHref(href, pathname || '/')
      }
    })
  }, [pathname])

  const currentLabel = breadcrumbs[breadcrumbs.length - 1]?.label || props.brandText || 'Inicio'

  return (
    <Box
      position={navbarPosition}
      boxShadow={navbarShadow}
      bg={navbarBg}
      borderColor={navbarBorder}
      filter={navbarFilter}
      backdropFilter={navbarBackdrop}
      backgroundPosition='center'
      backgroundSize='cover'
      borderRadius='16px'
      borderWidth='1.5px'
      borderStyle='solid'
      transitionDelay='0s, 0s, 0s, 0s'
      transitionDuration=' 0.25s, 0.25s, 0.25s, 0s'
      transitionProperty='box-shadow, background-color, filter, border'
      transitionTimingFunction='linear, linear, linear, linear'
      alignItems={{ xl: 'center' }}
      display={secondary ? 'block' : 'flex'}
      minH='75px'
      justifyContent={{ xl: 'center' }}
      lineHeight='25.6px'
      mx='auto'
      mt={secondaryMargin}
      pb='8px'
      right={{ base: '12px', md: '30px', lg: '30px', xl: '30px' }}
      px={{
        sm: paddingX,
        md: '10px'
      }}
      ps={{
        xl: '12px'
      }}
      pt='8px'
      top={{ base: '12px', md: '16px', xl: '18px' }}
      w={{
        base: 'calc(100vw - 6%)',
        md: 'calc(100vw - 8%)',
        lg: 'calc(100vw - 6%)',
        xl: 'calc(100vw - 350px)',
        '2xl': 'calc(100vw - 365px)'
      }}
    >
      <Flex
        w='100%'
        flexDirection={{
          sm: 'column',
          md: 'row'
        }}
        alignItems={{ xl: 'center' }}
        mb={gap}
      >
        <Box mb={{ sm: '8px', md: '0px' }}>
          <Breadcrumb>
            <BreadcrumbItem color={secondaryText} fontSize='sm' mb='5px'>
              <BreadcrumbLink
                as={NextLink}
                href='/admin/dashboard'
                color={secondaryText}
              >
                Pages
              </BreadcrumbLink>
            </BreadcrumbItem>

            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <BreadcrumbItem key={`${index}-${crumb.label}-${crumb.href}`} color={secondaryText} fontSize='sm'>
                  <BreadcrumbLink
                    as={NextLink}
                    href={crumb.href}
                    color={secondaryText}
                    pointerEvents={isLast ? 'none' : 'auto'}
                    opacity={isLast ? 0.8 : 1}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )
            })}
          </Breadcrumb>
          <Link
            as={NextLink}
            color={mainText}
            href={breadcrumbs[breadcrumbs.length - 1]?.href || '/admin/dashboard'}
            bg='inherit'
            borderRadius='inherit'
            fontWeight='bold'
            fontSize='34px'
            _hover={{ color: mainText }}
            _active={{
              bg: 'inherit',
              transform: 'none',
              borderColor: 'transparent'
            }}
            _focus={{
              boxShadow: 'none'
            }}
          >
            {currentLabel}
          </Link>
        </Box>
        <Box ms='auto' w={{ sm: '100%', md: 'unset' }}>
          <AdminNavbarLinks
            onOpen={props.onOpen}
            secondary={props.secondary}
            fixed={props.fixed}
          />
        </Box>
      </Flex>
    </Box>
  )
}
