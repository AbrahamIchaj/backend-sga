import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DespachoDetalleRequestDto {
  @IsInt()
  @Type(() => Number)
  codigoInsumo: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  codigoPresentacion?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idCatalogoInsumos?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  cantidad: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observaciones?: string;
}

export class CreateDespachoDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idServicio?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DespachoDetalleRequestDto)
  detalles: DespachoDetalleRequestDto[];
}
