import { Transform, Type } from 'class-transformer';
import { IsString, IsEmail, IsNumber, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  apellidos?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  telefono?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  idRol?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activo?: boolean;
}
