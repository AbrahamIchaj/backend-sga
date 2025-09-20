import { IsOptional, IsString } from 'class-validator';

export class UpdatePermisoDto {
  @IsOptional()
  @IsString()
  permiso?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
