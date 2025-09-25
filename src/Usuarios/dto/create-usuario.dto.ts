import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(2)
  nombres: string;

  @IsString()
  @MinLength(2)
  apellidos: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  telefono?: number;

  @Type(() => Number)
  @IsNumber()
  idRol: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activo?: boolean = true;
}
