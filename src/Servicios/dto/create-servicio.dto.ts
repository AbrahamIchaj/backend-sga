import { IsString, IsOptional } from 'class-validator';

export class CreateServicioDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
