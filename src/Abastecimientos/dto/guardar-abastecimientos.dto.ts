import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardarAbastecimientoItemDto)
  insumos: GuardarAbastecimientoItemDto[];
}
