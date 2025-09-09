export class CreateUsuarioDto {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  telefono?: number;
  idRol: number;
  activo?: boolean = true;
}
