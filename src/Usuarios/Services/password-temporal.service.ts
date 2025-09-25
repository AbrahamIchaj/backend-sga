import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HashService } from './hash.service';

@Injectable()
export class PasswordTemporalService {
  private readonly logger = new Logger(PasswordTemporalService.name);

  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
  ) {}

  //Generar password temporal
  async generarPasswordTemporal(
    usuarioId: number,
    adminEmail: string,
    motivo: string,
    ip?: string,
  ): Promise<{
    passwordTemporal: string;
    fechaExpiracion: Date;
    logId: number;
  }> {
    try {
      // Verificar que el usuario existe
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: usuarioId },
      });

      if (!usuario) {
        throw new NotFoundException(
          `Usuario con ID ${usuarioId} no encontrado`,
        );
      }

      // Generar contraseña temporal
      const passwordTemporal = this.hashService.generateTemporaryPassword(14);
      const fechaExpiracion = this.hashService.getTemporaryPasswordExpiration();

      // Hashear la contraseña temporal para almacenar en usuarios
      const passwordHashTemporal =
        await this.hashService.hashPassword(passwordTemporal);

      // Marcar anteriores passwords temporales como usadas
      await this.prisma.logPasswordsTemporales.updateMany({
        where: {
          idUsuario: usuarioId,
          usado: false,
        },
        data: { usado: true, fechaUso: new Date() },
      });

      const log = await this.prisma.logPasswordsTemporales.create({
        data: {
          idUsuario: usuarioId,
          passwordTemporal,
          fechaExpiracion,
          adminGenerador: adminEmail,
          motivoGeneracion: motivo,
          ipGeneracion: ip,
        },
      });

      // Actualizar usuario con contraseña temporal
      await this.prisma.usuarios.update({
        where: { idUsuario: usuarioId },
        data: {
          passwordHash: passwordHashTemporal,
          esTemporal: true,
          fechaPasswordTemporal: new Date(),
          debesCambiarPassword: true,
          intentosCambioPassword: 0,
        },
      });

      this.logger.warn(
        `PASSWORD TEMPORAL generado para usuario ${usuario.correo} por admin ${adminEmail}. Motivo: ${motivo}`,
      );

      return {
        passwordTemporal,
        fechaExpiracion,
        logId: log.idLog,
      };
    } catch (error) {
      this.logger.error(
        `Error al generar contraseña temporal: ${error.message}`,
      );
      throw error;
    }
  }

  //Verificar login con contraseña temporal
  async verificarPasswordTemporal(
    usuarioId: number,
    password: string,
  ): Promise<{
    esValido: boolean;
    debeExpirar: boolean;
    mensaje: string;
  }> {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: usuarioId },
      });

      if (!usuario || !usuario.esTemporal) {
        return {
          esValido: false,
          debeExpirar: false,
          mensaje: 'No tiene contraseña temporal activa',
        };
      }

      // Buscar contraseña temporal activa
      const logTemporal = await this.prisma.logPasswordsTemporales.findFirst({
        where: {
          idUsuario: usuarioId,
          usado: false,
        },
        orderBy: { fechaGeneracion: 'desc' },
      });

      if (!logTemporal) {
        return {
          esValido: false,
          debeExpirar: false,
          mensaje: 'No se encontró contraseña temporal válida',
        };
      }

      // Verificar expiración
      if (
        this.hashService.isTemporaryPasswordExpired(logTemporal.fechaExpiracion)
      ) {
        // Marcar como usada por expiración
        await this.prisma.logPasswordsTemporales.update({
          where: { idLog: logTemporal.idLog },
          data: { usado: true, fechaUso: new Date() },
        });

        return {
          esValido: false,
          debeExpirar: true,
          mensaje: 'Contraseña temporal expirada (24 horas)',
        };
      }

      // Verificar si la contraseña coincide con la temporal
      const esPasswordTemporal = password === logTemporal.passwordTemporal;

      if (esPasswordTemporal) {
        // Marcar como usada
        await this.prisma.logPasswordsTemporales.update({
          where: { idLog: logTemporal.idLog },
          data: { usado: true, fechaUso: new Date() },
        });

        this.logger.log(
          `Login exitoso con contraseña temporal para usuario ID ${usuarioId}`,
        );
        return {
          esValido: true,
          debeExpirar: false,
          mensaje: 'Contraseña temporal válida',
        };
      }

      return {
        esValido: false,
        debeExpirar: false,
        mensaje: 'Contraseña temporal incorrecta',
      };
    } catch (error) {
      this.logger.error(
        `Error al verificar contraseña temporal: ${error.message}`,
      );
      return { esValido: false, debeExpirar: false, mensaje: 'Error interno' };
    }
  }

  //CAMBIAR CONTRASEÑA TEMPORAL POR PERMANENTE
  async cambiarPasswordTemporalAPermanente(
    usuarioId: number,
    nuevaPassword: string,
  ): Promise<{ success: boolean; mensaje: string }> {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: usuarioId },
      });

      if (!usuario) {
        throw new NotFoundException(
          `Usuario con ID ${usuarioId} no encontrado`,
        );
      }

      if (!usuario.esTemporal) {
        throw new BadRequestException(
          'El usuario no tiene contraseña temporal activa',
        );
      }

      // Validar fortaleza de nueva contraseña
      const validacion =
        this.hashService.validatePasswordStrength(nuevaPassword);
      if (!validacion.isValid) {
        throw new BadRequestException(
          `Contraseña débil: ${validacion.feedback.join(', ')}`,
        );
      }

      // Hashear nueva contraseña permanente
      const nuevaPasswordHash =
        await this.hashService.hashPassword(nuevaPassword);

      // Actualizar usuario
      await this.prisma.usuarios.update({
        where: { idUsuario: usuarioId },
        data: {
          passwordHash: nuevaPasswordHash,
          esTemporal: false,
          fechaPasswordTemporal: null,
          debesCambiarPassword: false,
          intentosCambioPassword: 0,
        },
      });

      this.logger.log(
        `Usuario ${usuario.correo} cambió contraseña temporal por permanente`,
      );

      return {
        success: true,
        mensaje: 'Contraseña cambiada exitosamente. Ya no es temporal.',
      };
    } catch (error) {
      this.logger.error(
        `Error al cambiar contraseña temporal: ${error.message}`,
      );
      throw error;
    }
  }

  //OBTENER CONTRASEÑAS TEMPORALES ACTIVAS (SOLO ADMIN)
  async obtenerPasswordsTemporalesAdmin(adminEmail: string): Promise<
    Array<{
      idLog: number;
      usuario: string;
      passwordTemporal: string;
      fechaGeneracion: Date;
      fechaExpiracion: Date;
      usado: boolean;
      motivo: string;
      expirada: boolean;
    }>
  > {
    try {
      const logs = await this.prisma.logPasswordsTemporales.findMany({
        where: {
          adminGenerador: adminEmail,
          usado: false,
        },
        include: {
          Usuario: {
            select: {
              nombres: true,
              apellidos: true,
              correo: true,
            },
          },
        },
        orderBy: { fechaGeneracion: 'desc' },
      });

      const resultado = logs.map((log) => ({
        idLog: log.idLog,
        usuario: `${log.Usuario.nombres} ${log.Usuario.apellidos} (${log.Usuario.correo})`,
        passwordTemporal: log.passwordTemporal,
        fechaGeneracion: log.fechaGeneracion,
        fechaExpiracion: log.fechaExpiracion,
        usado: log.usado,
        motivo: log.motivoGeneracion,
        expirada: this.hashService.isTemporaryPasswordExpired(
          log.fechaExpiracion,
        ),
      }));

      this.logger.warn(
        `⚠️ Admin ${adminEmail} consultó ${resultado.length} contraseñas temporales`,
      );

      return resultado;
    } catch (error) {
      this.logger.error(
        `Error al obtener contraseñas temporales: ${error.message}`,
      );
      throw error;
    }
  }

  //LIMPIAR CONTRASEÑAS TEMPORALES EXPIRADAS
  async limpiarPasswordsExpiradas(): Promise<{ eliminadas: number }> {
    try {
      const ahora = new Date();

      const resultado = await this.prisma.logPasswordsTemporales.updateMany({
        where: {
          fechaExpiracion: { lt: ahora },
          usado: false,
        },
        data: {
          usado: true,
          fechaUso: ahora,
        },
      });

      // Actualizar usuarios que tenían contraseñas expiradas
      await this.prisma.usuarios.updateMany({
        where: {
          esTemporal: true,
          fechaPasswordTemporal: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        data: {
          activo: false, // Desactivar hasta que admin genere nueva temporal
          debesCambiarPassword: false,
        },
      });

      return { eliminadas: resultado.count };
    } catch (error) {
      this.logger.error(
        `Error en limpieza de contraseñas temporales: ${error.message}`,
      );
      throw error;
    }
  }
}
