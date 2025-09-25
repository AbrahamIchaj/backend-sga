import { IsString, MinLength } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @MinLength(2)
  nombreRol: string;

  @IsString()
  @MinLength(2)
  descripcion: string;
}
