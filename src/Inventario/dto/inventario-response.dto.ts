export interface InventarioResponse {
  idInventario: number;
  renglon: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion: number;
  presentacion: string;
  unidadMedida: string;
  lote: string;
  cartaCompromiso?: boolean;
  mesesDevolucion?: number | null;
  observacionesDevolucion?: string | null;
  fechaVencimiento: Date | null;
  cantidadDisponible: number;
  precioUnitario: number;
  precioTotal: number;
  // Información de la compra origen
  ingresoCompras: {
    idIngresoCompras: number | null;
    numeroFactura: string | null;
    serieFactura: string | null;
    fechaIngreso: Date | null;
    proveedor: string | null;
  } | null;
}

export interface ExistenciasResponse {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  presentacion: string;
  unidadMedida: string;
  existenciaTotal: number;
  lotes: {
    lote: string;
    cartaCompromiso?: boolean;
    mesesDevolucion?: number | null;
    observacionesDevolucion?: string | null;
    fechaVencimiento: Date | null;
    cantidad: number;
    precioUnitario: number;
    diasParaVencer?: number;
  }[];
}

export interface HistorialInventarioResponse {
  idHistorial: number;
  lote: string | null;
  fechaVencimiento: Date | null;
  cantidad: number;
  tipoMovimiento: string;
  modulo: string;
  fechaMovimiento: Date;
  // Información del producto
  catalogoInsumos?: {
    codigoInsumo: number | null;
    nombreInsumo: string | null;
    presentacion: string | null;
  } | null;
  // Información del usuario
  usuario: {
    nombres: string;
    apellidos: string;
  };
  // Información adicional según el tipo de movimiento
  referencia?: {
    numeroFactura?: string | null;
    serieFactura?: string | null;
    proveedor?: string | null;
    servicio?: string | null;
    referenciaDocumento?: string | null;
  };
}

export interface ResumenInventarioResponse {
  totalItems: number;
  valorTotalInventario: number;
  itemsProximosVencer: number;
  itemsStockBajo: number;
  totalLotes: number;
  ultimaActualizacion: Date;
}

export interface MovimientosRecientesResponse {
  fecha: Date;
  tipoMovimiento: string;
  modulo: string;
  cantidad: number;
  producto: string;
  lote: string | null;
  usuario: string;
}

export interface AlertasInventarioResponse {
  productosVencidos: {
    codigoInsumo: number;
    nombreInsumo: string;
    lote: string;
    fechaVencimiento: Date;
    diasVencido: number;
    cantidad: number;
  }[];
  productosProximosVencer: {
    codigoInsumo: number;
    nombreInsumo: string;
    lote: string;
    fechaVencimiento: Date;
    diasParaVencer: number;
    cantidad: number;
  }[];
  productosStockBajo: {
    codigoInsumo: number;
    nombreInsumo: string;
    cantidadDisponible: number;
    stockMinimo: number;
  }[];
}