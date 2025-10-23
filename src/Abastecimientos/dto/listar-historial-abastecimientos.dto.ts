import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class ListarHistorialAbastecimientosQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  @IsInt()
  @Min(2000)
  anio?: number;

  @IsOptional()
  @Transform(({ value }) => {
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : undefined))
  @IsISO8601({ strict: true })
  fechaDesde?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : undefined))
  @IsISO8601({ strict: true })
  fechaHasta?: string;

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
}
