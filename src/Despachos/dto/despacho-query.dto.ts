import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListDespachosQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idServicio?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idUsuario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
    }
    return undefined;
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  renglones?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  buscar?: string;
}

export class DisponibilidadDespachoQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoInsumo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(75)
  lote?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoPresentacion?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  idUsuario?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
    }
    return undefined;
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  renglones?: number[];
}
