export type MovimientoTipo = 'compra' | 'venta' | 'flete';

export interface Movimiento {
  id?: string | undefined;
  tipo: MovimientoTipo;
  fecha: string;
  entidad: string; // Nombre de Granja o Cliente
  rosadoPrecio: number | undefined;
  pardoPrecio: number | undefined;
  jumboPrecio: number | undefined;
  kilosTotal: number;
  paquetesTotal: number;
  paquetesRosados?: number | undefined;
  paquetesPardos?: number | undefined;
  paquetesJumbos?: number | undefined;
  montoTotal: number;
  tienePesosCompra?: boolean | undefined;
  createdAt: number;
  estado?: 'EN_CURSO' | 'TERMINADO';
  gananciaC?: number;
  excluidos?: number;
}

export interface ViajeResumen {
  fecha: string;
  origen: string;
  destino: string;
  estado: 'En curso' | 'Cerrado';
  compradoKg: number;
  compradoPaq: number;
  vendidoKg: number;
  vendidoPaq: number;
  enCamionKg: number;
  enCamionPaq: number;
  totalMovimientos: number;
}

export interface CompraFormData {
  fecha: string;
  granja: string;
  rosadoPrecio: number | undefined;
  pardoPrecio: number | undefined;
  jumboPrecio: number | undefined;
  kilosTotal?: number;
  paquetesTotal?: number;
}

export interface VentaFormData {
  fecha: string;
  cliente: string;
  rosadoPrecio: number | undefined;
  pardoPrecio: number | undefined;
  jumboPrecio: number | undefined;
  tienePesosCompra: boolean;
  kilosTotal?: number;
  paquetesTotal?: number;
}

export interface FleteFormData {
  granja: string;
  paquetesRosados: number | '';
  paquetesPardos: number | '';
  paquetesJumbos: number | '';
}

export interface EditarFleteData {
  granja: string;
  paquetesRosados: number;
  paquetesPardos: number;
  paquetesJumbos: number;
}
