import { IsString } from 'class-validator';

export class CreatePermisoDto {
  @IsString()
  permiso: string;

  @IsString()
  descripcion: string;
}
