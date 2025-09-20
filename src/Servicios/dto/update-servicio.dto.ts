import { IsOptional, IsString } from 'class-validator';

export class UpdateServicioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
