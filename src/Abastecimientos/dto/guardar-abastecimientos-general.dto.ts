import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';

class GuardarAbastecimientosGeneralResumenDto {
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
  valorInventarioEstimado: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  promedioMesesCobertura: number;
}

class GuardarAbastecimientosGeneralCoberturaFilaDto {
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

class GuardarAbastecimientosGeneralCoberturaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardarAbastecimientosGeneralCoberturaFilaDto)
  filas: GuardarAbastecimientosGeneralCoberturaFilaDto[];

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

export class GuardarAbastecimientoGeneralItemDto {
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
  existenciasBodega: number;

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

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  @IsNumber()
  @Min(0)
  totalUnidades?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  @IsNumber()
  @Min(0)
  consumoMensual?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  @IsNumber()
  @Min(0)
  mesesCobertura?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  @IsNumber()
  @Min(0)
  valorEstimado?: number;
}

export class GuardarAbastecimientosGeneralDto {
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
  @Type(() => GuardarAbastecimientosGeneralResumenDto)
  resumen: GuardarAbastecimientosGeneralResumenDto;

  @ValidateNested()
  @Type(() => GuardarAbastecimientosGeneralCoberturaDto)
  cobertura: GuardarAbastecimientosGeneralCoberturaDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardarAbastecimientoGeneralItemDto)
  insumos: GuardarAbastecimientoGeneralItemDto[];
}
