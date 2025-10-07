import {
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCompraLoteDto {
  @IsNumber()
  @Min(0)
  cantidad: number;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: Date | string;

  @IsOptional()
  cartaCompromiso?: number | boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mesesDevolucion?: number;

  @IsOptional()
  @IsString()
  observacionesDevolucion?: string;
}

export class CreateCompraDetalleDto {
  @IsNumber()
  idCatalogoInsumos: number;

  @IsNumber()
  @Min(1)
  renglon: number;

  @IsNumber()
  codigoInsumo: number;

  @IsString()
  nombreInsumo: string;

  @IsString()
  caracteristicas: string;

  @IsNumber()
  codigoPresentacion: number;

  @IsString()
  presentacion: string;

  @IsNumber()
  @Min(0)
  cantidadTotal: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsNumber()
  @Min(0)
  precioTotalFactura: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompraLoteDto)
  lotes?: CreateCompraLoteDto[];
}

export class CreateCompraDto {
  @IsNumber()
  // numeroFactura puede llegar como string grande desde el cliente, aceptamos string|number
  numeroFactura: string | number;

  @IsString()
  serieFactura: string;

  @IsString()
  tipoCompra: string;

  @IsDateString()
  fechaIngreso: Date | string;

  @IsString()
  proveedor: string;

  @IsNumber()
  ordenCompra: number;

  @IsArray()
  @Type(() => Number)
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  programas: number[];

  @IsNumber()
  numero1h: number;

  @IsNumber()
  noKardex: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompraDetalleDto)
  detalles: CreateCompraDetalleDto[];
}
