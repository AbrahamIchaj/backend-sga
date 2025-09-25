export class ChangePasswordDto {
  usuarioId: number;
  newPassword: string;
}

export class AdminChangePasswordDto {
  usuarioId: number;
  newPassword?: string;
  generarTemporal?: boolean;
  notificarEmail?: boolean;
  adminEmail: string;
  ip?: string;
}

export class GenerateTemporaryPasswordDto {
  adminEmail: string;
  motivo?: string;
  ip?: string;
}

export class LoginDto {
  correo: string;
  password: string;
}

export class ResetPasswordDto {
  correo: string;
}
