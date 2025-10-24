import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class ActualizarEstadoAbastecimientoDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(2000)
  anio: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  codigoInsumo: number;

  @IsBoolean()
  activo: boolean;
}
