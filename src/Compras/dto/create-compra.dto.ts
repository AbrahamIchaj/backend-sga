export class CreateCompraLoteDto {
  tipoIngreso: string; // Ej.: 'COMPRA', 'DONACION'
  cantidad: number;
  lote?: string; // Requerido para inventario (lote no puede ser null en Inventario)
  fechaVencimiento?: Date | string;
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
  precioUnitario: number; // Se almacenará como Decimal en DB
  precioTotalFactura: number; // Se almacenará como Decimal en DB
  cartaCompromiso?: boolean;
  observaciones?: string;
  lotes: CreateCompraLoteDto[];
}

export class CreateCompraDto {
  numeroFactura: number;
  serieFactura: string;
  tipoCompra: string;
  fechaIngreso: Date | string; // ISO string permitido
  proveedor: string;
  ordenCompra: number;
  programa: number;
  numero1h: number;
  noKardex: number;
  detalles: CreateCompraDetalleDto[];
}
