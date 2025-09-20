import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Debe ser un email válido' })
  correo: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}