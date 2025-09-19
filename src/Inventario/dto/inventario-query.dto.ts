import { IsOptional, IsString, IsInt, IsDateString, IsDecimal, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListInventarioQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoInsumo?: number;

  @IsOptional()
  @IsString()
  nombreInsumo?: string;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimientoDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimientoHasta?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  cantidadMinima?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoPresentacion?: number;

  @IsOptional()
  @IsString()
  presentacion?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  proximosVencer?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  stockBajo?: boolean;
}

export class InventarioExistenciasDto {
  @IsInt()
  @Type(() => Number)
  codigoInsumo: number;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoPresentacion?: number;
}

export class InventarioHistorialQueryDto {
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
  @IsInt()
  @Type(() => Number)
  idInventario?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoInsumo?: number;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsString()
  tipoMovimiento?: string; // 'INGRESO', 'DESPACHO', 'REAJUSTE'

  @IsOptional()
  @IsString()
  modulo?: string; // 'COMPRAS', 'DESPACHOS', 'REAJUSTES'

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idUsuario?: number;
}

export class ReporteInventarioDto {
  @IsOptional()
  @IsString()
  formato?: 'excel' | 'csv' | 'pdf' = 'excel';

  @IsOptional()
  @IsString()
  tipoReporte?: 'general' | 'vencimientos' | 'stockBajo' | 'movimientos' = 'general';

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  diasVencimiento?: number = 30; // Para reporte de próximos a vencer

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  stockMinimo?: number = 10; // Para reporte de stock bajo
}