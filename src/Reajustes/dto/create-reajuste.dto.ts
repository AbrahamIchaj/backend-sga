import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  IsBoolean,
} from 'class-validator';

export class CreateReajusteDetalleDto {
  @IsOptional()
  @IsInt()
  idCatalogoInsumos?: number;

  @IsOptional()
  @IsInt()
  renglon?: number;

  @IsOptional()
  @IsInt()
  codigoInsumo?: number;

  @IsOptional()
  @IsInt()
  codigoPresentacion?: number;

  @IsOptional()
  @IsString()
  nombreInsumo?: string;

  @IsOptional()
  @IsString()
  caracteristicas?: string;

  @IsOptional()
  @IsString()
  presentacion?: string;

  @IsOptional()
  @IsString()
  unidadMedida?: string;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: Date | string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioUnitario?: number;

  @IsOptional()
  @IsBoolean()
  cartaCompromiso?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  mesesDevolucion?: number;

  @IsOptional()
  @IsString()
  observacionesDevolucion?: string;
}

export class CreateReajusteDto {
  @IsOptional()
  @IsDateString()
  fechaReajuste?: Date | string;

  @IsInt()
  tipoReajuste: number; // 1 = entrada, 2 = salida

  @IsString()
  @MaxLength(100)
  referenciaDocumento: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReajusteDetalleDto)
  detalles: CreateReajusteDetalleDto[];
}
