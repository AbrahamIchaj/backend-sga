import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReporteFiltroQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(2000)
  anio?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(2000)
  anioInicio?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(2000)
  anioFin?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idServicio?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoInsumo?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idUsuario?: number;

  @IsOptional()
  @IsString()
  renglones?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  mesesPromedio?: number;
}
