import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

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
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUsuario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
    }

    return String(value)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0);
  })
  renglones?: number[];
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
