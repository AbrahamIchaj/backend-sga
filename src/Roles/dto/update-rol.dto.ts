import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRolDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombreRol?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
