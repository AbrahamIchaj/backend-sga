export interface DespachoDetalleResponse {
  idDespachoDetalle: number;
  idInventario: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion?: number | null;
  presentacion?: string | null;
  unidadMedida?: string | null;
  lote?: string | null;
  fechaVencimiento?: Date | null;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

export interface DespachoResponse {
  idDespacho: number;
  codigoDespacho: string;
  fechaDespacho: Date;
  observaciones?: string | null;
  totalCantidad: number;
  totalGeneral: number;
  servicio?: {
    idServicio: number | null;
    nombre: string | null;
  } | null;
  usuario: {
    idUsuario: number;
    nombres: string;
    apellidos: string;
  };
  detalles: DespachoDetalleResponse[];
}

export interface DespachoListItem {
  idDespacho: number;
  codigoDespacho: string;
  fechaDespacho: Date;
  servicio?: string | null;
  usuario: string;
  totalCantidad: number;
  totalGeneral: number;
  totalItems: number;
}

export interface DisponibilidadProductoResponse {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  presentacion: string;
  unidadMedida: string;
  existenciaTotal: number;
  lotes: {
    idInventario: number;
    lote: string;
    fechaVencimiento: Date | null;
    cantidad: number;
    precioUnitario: number;
    cartaCompromiso: boolean;
  }[];
}
