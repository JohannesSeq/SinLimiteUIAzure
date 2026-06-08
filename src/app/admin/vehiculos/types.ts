// src/app/admin/vehiculos/types.ts

export interface Vehiculo {
  placa: string;
  marca: string;
  modelo: string;
  year: string;
  tipo: string;
  cedulaCliente?: string;
}
