import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateCatalogoInsumoDto {
  @IsOptional()
  @IsNumber()
  renglon?: number | null;

  @IsNumber()
  codigoInsumo: number;

  @IsString()
  nombreInsumo: string;

  @IsOptional()
  @IsString()
  caracteristicas?: string;

  @IsOptional()
  @IsString()
  nombrePresentacion?: string;

  @IsOptional()
  @IsString()
  unidadMedida?: string;

  @IsOptional()
  @IsNumber()
  codigoPresentacion?: number | null;
}
