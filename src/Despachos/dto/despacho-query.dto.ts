import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsInt()
  @Type(() => Number)
  idUsuarioCreador?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  anio?: number;

  @IsOptional()
  @IsString()
  renglones?: string;

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
  idUsuario?: number;

  @IsOptional()
  @IsString()
  renglones?: string;
}

export class DetalleDespachoQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idUsuario?: number;

  @IsOptional()
  @IsString()
  renglones?: string;
}
