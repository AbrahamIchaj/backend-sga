export class CreateCompraLoteDto {
  tipoIngreso: string;
  cantidad: number;
  lote?: string;
  fechaVencimiento?: Date | string;
  mesesDevolucion?: number;
  observacionesDevolucion?: string;
}

export class CreateCompraDetalleDto {
  idCatalogoInsumos: number;
  renglon: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion: number;
  presentacion: string;
  cantidadTotal: number;
  precioUnitario: number; 
  precioTotalFactura: number;
  cartaCompromiso?: boolean;
  observaciones?: string;
  lotes: CreateCompraLoteDto[];
}

export class CreateCompraDto {
  numeroFactura: number;
  serieFactura: string;
  tipoCompra: string;
  fechaIngreso: Date | string;
  proveedor: string;
  ordenCompra: number;
  programa: number;
  numero1h: number;
  noKardex: number;
  detalles: CreateCompraDetalleDto[];
}
