import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';

class GuardarAbastecimientosResumenDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  totalInsumos: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  activos: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  inactivos: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  existenciasBodegaActual: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  existenciasCocinaRegistrada: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  valorInventarioEstimado: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  promedioMesesCobertura: number;
}

class GuardarAbastecimientosCoberturaFilaDto {
  @IsString()
  @IsNotEmpty()
  etiqueta: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  cantidad: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  porcentaje: number;
}

class GuardarAbastecimientosCoberturaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardarAbastecimientosCoberturaFilaDto)
  filas: GuardarAbastecimientosCoberturaFilaDto[];

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  totalCantidad: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  totalPorcentaje: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  disponibilidad: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  abastecimiento: number;
}

export class GuardarAbastecimientoItemDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  codigoInsumo: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  renglon: number;

  @Transform(({ value }) => {
    const numero = Number(value ?? 0);
    return Number.isFinite(numero) ? Math.max(0, Math.trunc(numero)) : 0;
  })
  @IsInt()
  existenciasCocina: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? Math.max(0, Math.trunc(numero)) : undefined;
  })
  @IsInt()
  existenciasBodega?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  promedioMensual?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  precioUnitario?: number;

  @IsOptional()
  @IsString()
  nombreInsumo?: string;

  @IsOptional()
  @IsString()
  presentacion?: string;

  @IsOptional()
  @IsString()
  unidadMedida?: string;

  @IsOptional()
  @IsString()
  caracteristicas?: string;

  @IsBoolean()
  activo: boolean;
}

export class GuardarAbastecimientosDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(2000)
  anio: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  @IsInt()
  idUsuario?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value && value !== 0) {
      return undefined;
    }

    if (Array.isArray(value)) {
      const lista = value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));
      return lista.length ? lista : undefined;
    }

    if (typeof value === 'string') {
      const lista = value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
      return lista.length ? lista : undefined;
    }

    const numero = Number(value);
    return Number.isFinite(numero) ? [numero] : undefined;
  })
  @IsArray()
  renglones?: number[];

  @IsISO8601()
  fechaConsulta: string;

  @ValidateNested()
  @Type(() => GuardarAbastecimientosResumenDto)
  resumen: GuardarAbastecimientosResumenDto;

  @ValidateNested()
  @Type(() => GuardarAbastecimientosCoberturaDto)
  cobertura: GuardarAbastecimientosCoberturaDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardarAbastecimientoItemDto)
  insumos: GuardarAbastecimientoItemDto[];
}
