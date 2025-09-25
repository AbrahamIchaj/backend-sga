import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ListReajustesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: Date | string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: Date | string;

  @IsOptional()
  @IsInt()
  tipoReajuste?: number;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsInt()
  idUsuario?: number;
}
