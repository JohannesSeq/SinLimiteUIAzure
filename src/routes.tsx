import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdLock,
  MdCarRepair,
  MdPeople,
  MdAssignment,
  MdSettings,
  MdPersonAdd,
  MdVerifiedUser,
} from 'react-icons/md';

import { IRoute } from 'types/navigation';

const routes: IRoute[] = [
  {
    name: 'Inicio',
    layout: '/admin',
    path: '/dashboard',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Empleados',
    layout: '/admin',
    path: '/empleados',
    icon: <Icon as={MdPeople} width="20px" height="20px" color="inherit" />,
    scopes: ['empleados.read'],
  },
  {
    name: 'Clientes',
    layout: '/admin',
    path: '/clientes',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    scopes: ['clientes.read'],
  },
  {
    name: 'Citas',
    layout: '/admin',
    path: '/citas',
    icon: <Icon as={MdAssignment} width="20px" height="20px" color="inherit" />,
    scopes: ['citas.read'],
  },
  {
    name: 'Vehículos',
    layout: '/admin',
    path: '/vehiculos',
    icon: <Icon as={MdCarRepair} width="20px" height="20px" color="inherit" />,
    scopes: ['vehiculos.read'],
  },
  {
    name: 'Roles',
    layout: '/admin',
    path: '/roles',
    icon: <Icon as={MdVerifiedUser} width="20px" height="20px" color="inherit" />,
    scopes: ['roles.read'],
  },
  {
    name: 'Mis citas',
    layout: '/admin',
    path: '/citas/cita-usuario',
    icon: <Icon as={MdAssignment} width="20px" height="20px" color="inherit" />,
    private: true,
    onlyClient: true,
  },
  {
    name: 'Mis vehiculos',
    layout: '/admin',
    path: '/vehiculos/mis-vehiculos',
    icon: <Icon as={MdCarRepair} width="20px" height="20px" color="inherit" />,
    private: true,
    onlyClient: true,
  },
  {
    name: 'Mi perfil',
    layout: '/admin',
    path: '/mi-perfil',
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    private: true,
  },
  {
    name: 'Iniciar Sesion',
    layout: '/auth',
    path: '/login',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    onlyGuest: true,
  },
  {
    name: 'Registrarme',
    layout: '/auth',
    path: '/sign-up',
    icon: <Icon as={MdPersonAdd} width="20px" height="20px" color="inherit" />,
    onlyGuest: true,
  },
];

export default routes;
