import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AsignarPermisosDto {
  @IsArray()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  permisos: number[];
}

export class RevocarPermisosDto {
  @IsArray()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  permisos: number[];
}

export class SincronizarPermisosDto {
  @IsArray()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  permisos: number[];
}
