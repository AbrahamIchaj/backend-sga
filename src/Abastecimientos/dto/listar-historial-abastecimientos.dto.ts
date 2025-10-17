import { Transform } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

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
}
