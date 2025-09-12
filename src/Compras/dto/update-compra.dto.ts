export class UpdateCompraDto {
  numeroFactura?: number;
  serieFactura?: string;
  tipoCompra?: string;
  fechaIngreso?: Date | string;
  proveedor?: string;
  ordenCompra?: number;
  programa?: number;
  numero1h?: number;
  noKardex?: number;
}

export class AnularCompraDto {
  motivo: string;
  idUsuario: number; // Para auditoría del historial
}

export class ListComprasQueryDto {
  proveedor?: string;
  desde?: string; // ISO date string
  hasta?: string; // ISO date string
  numeroFactura?: number;
  serieFactura?: string;
  tipoCompra?: string;
  page?: number;
  limit?: number;
}

export type CompraResumen = {
  idIngresoCompras: number;
  fechaIngreso: Date;
  proveedor: string;
  numeroFactura: number;
  serieFactura: string;
  tipoCompra: string;
  totalItems: number;
  totalCantidad: number;
  totalFactura: number;
};
