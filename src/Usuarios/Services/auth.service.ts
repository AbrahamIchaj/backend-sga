import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { HashService } from './hash.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
  ) {}

  async login(loginDto: LoginDto) {
    const { correo, password } = loginDto;

    try {
      // Buscar usuario por correo con relaciones
      const usuario = await this.prisma.usuarios.findUnique({
        where: { correo },
        include: {
          Roles: {
            include: {
              RolPermisos: {
                where: { activo: true },
                include: {
                  Permisos: true,
                },
              },
            },
          },
        },
      });

      if (!usuario) {
        this.logger.warn(`Intento de login con correo inexistente: ${correo}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (!usuario.activo) {
        this.logger.warn(`Intento de login con usuario inactivo: ${correo}`);
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Verificar contraseña usando HashService
      const isPasswordValid = await this.hashService.verifyPassword(
        password,
        usuario.passwordHash,
      );
      if (!isPasswordValid) {
        this.logger.warn(
          `Intento de login con contraseña incorrecta: ${correo}`,
        );
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Construir lista de permisos
      const permisos =
        usuario.Roles?.RolPermisos?.filter(
          (rp) => rp.activo && rp.Permisos,
        )?.map((rp) => rp.Permisos.permiso) || [];

      // Construir respuesta sin password
      const { passwordHash: _, ...usuarioSinPassword } = usuario;

      const response = {
        usuario: {
          ...usuarioSinPassword,
          rol: {
            idRoles: usuario.Roles?.idRoles,
            nombreRol: usuario.Roles?.nombreRol,
            descripcion: usuario.Roles?.descripcion,
            permisos,
          },
        },
      };

      this.logger.log(
        `Login exitoso para usuario: ${correo} con rol: ${usuario.Roles?.nombreRol}`,
      );
      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Error en login: ${error.message}`, error.stack);
      throw new UnauthorizedException('Error de autenticación');
    }
  }

  /**
   * Método para validar si un usuario tiene permisos específicos
   */
  async validateUserPermissions(
    userId: number,
    requiredPermissions: string[],
  ): Promise<boolean> {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: userId },
        include: {
          Roles: {
            include: {
              RolPermisos: {
                where: { activo: true },
                include: {
                  Permisos: true,
                },
              },
            },
          },
        },
      });

      if (!usuario || !usuario.activo) {
        return false;
      }

      const userPermissions =
        usuario.Roles?.RolPermisos?.filter(
          (rp) => rp.activo && rp.Permisos,
        )?.map((rp) => rp.Permisos.permiso) || [];

      // Verificar si tiene alguno de los permisos requeridos
      return requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );
    } catch (error) {
      this.logger.error(`Error validando permisos: ${error.message}`);
      return false;
    }
  }
}
