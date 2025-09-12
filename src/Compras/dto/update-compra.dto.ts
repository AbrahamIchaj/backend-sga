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
  idUsuario: number;
}

export class ListComprasQueryDto {
  proveedor?: string;
  desde?: string;
  hasta?: string;
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
