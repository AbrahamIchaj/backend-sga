import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCompraDto {
  @IsOptional()
  // numeroFactura puede venir como string o number (DB es BigInt). Se normaliza en el servicio.
  numeroFactura?: string | number;

  @IsOptional()
  @IsString()
  serieFactura?: string;

  @IsOptional()
  @IsString()
  tipoCompra?: string;

  @IsOptional()
  @IsDateString()
  fechaIngreso?: Date | string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @IsNumber()
  ordenCompra?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  programas?: number[];

  @IsOptional()
  @IsNumber()
  numero1h?: number;

  @IsOptional()
  @IsNumber()
  noKardex?: number;
}

export class AnularCompraDto {
  @IsOptional()
  @IsString()
  motivo?: string;

  @IsNumber()
  idUsuario: number;
}

export class ListComprasQueryDto {
  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  numeroFactura?: string;

  @IsOptional()
  @IsString()
  serieFactura?: string;

  @IsOptional()
  @IsString()
  tipoCompra?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  programa?: number;
}

export type CompraResumen = {
  idIngresoCompras: number;
  fechaIngreso: Date;
  proveedor: string;
  numeroFactura: number;
  serieFactura: string;
  tipoCompra: string;
  programas: number[];
  noKardex: number;
  totalItems: number;
  totalCantidad: number;
  totalFactura: number;
};
