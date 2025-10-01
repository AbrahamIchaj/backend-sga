import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdatePerfilDto {
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
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  fotoBase64?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  eliminarFoto?: boolean;
}
