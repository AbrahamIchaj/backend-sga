import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListarAbastecimientosQueryDto {
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
}
