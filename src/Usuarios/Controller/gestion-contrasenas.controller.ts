import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  Put, 
  Get,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { UsuariosService } from '../Services/usuarios.service';
import { AdminChangePasswordDto, GenerateTemporaryPasswordDto } from '../dto/password.dto';

@Controller('usuarios/auth')
export class GestionContrasenasController {
  private readonly logger = new Logger(GestionContrasenasController.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  @Put(':id/password')
  async adminChangePassword(
    @Param('id', ParseIntPipe) usuarioId: number,
    @Body() adminChangePasswordDto: Omit<AdminChangePasswordDto, 'usuarioId'>,
  ) {
    try {
      // Agregar el ID del usuario al DTO
      const fullDto: AdminChangePasswordDto = {
        ...adminChangePasswordDto,
        usuarioId,
      };

      const resultado = await this.usuariosService.adminChangePassword(fullDto);
      
      return {
        success: resultado.success,
        message: resultado.message,
        data: {
          temporaryPassword: resultado.temporaryPassword,
          fechaExpiracion: resultado.fechaExpiracion,
          passwordChanged: true,
        },
      };
    } catch (error) {
      this.logger.error(`Error al cambiar contraseña del usuario ${usuarioId}: ${error.message}`);
      throw error;
    }
  }


  // VERIFICACIÓN DE CREDENCIALES
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyCredentials(
    @Body() credentials: { correo: string; password: string },
  ) {
    try {
      if (!credentials.correo || !credentials.password) {
        throw new BadRequestException('Correo y contraseña son requeridos');
      }

      const resultado = await this.usuariosService.verifyCredentials(
        credentials.correo,
        credentials.password,
      );

      if (!resultado.usuario) {
        return {
          success: false,
          message: resultado.mensaje,
          data: null,
          temporal: {
            esTemporal: resultado.esTemporal,
            expirada: resultado.debeExpirar,
          }
        };
      }

      return {
        success: true,
        message: resultado.mensaje,
        data: resultado.usuario,
        temporal: {
          esTemporal: resultado.esTemporal,
          debeExpirar: resultado.debeExpirar,
          instructions: resultado.esTemporal ? [
            'Estás usando una contraseña temporal',
            'Debes cambiar tu contraseña inmediatamente',
            'La contraseña temporal expira en 24 horas'
          ] : undefined,
        }
      };
    } catch (error) {
      this.logger.error(`Error al verificar credenciales: ${error.message}`);
      throw error;
    }
  }


  // CAMBIO DE CONTRASEÑA POR USUARIO

  @Put(':id/change-password')
  async userChangePassword(
    @Param('id', ParseIntPipe) usuarioId: number,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    try {
      // Primero verificar la contraseña actual
      const usuario = await this.usuariosService.findOne(usuarioId);
      if (!usuario) {
        throw new BadRequestException('Usuario no encontrado');
      }

      const verificacion = await this.usuariosService.verifyCredentials(
        usuario.correo,
        body.currentPassword
      );

      if (!verificacion.usuario) {
        throw new BadRequestException('Contraseña actual incorrecta');
      }

      // Si es contraseña temporal, usar el método específico
      if (verificacion.esTemporal) {
        const resultado = await this.usuariosService.cambiarPasswordTemporal(
          usuarioId,
          body.newPassword
        );
        
        return {
          success: resultado.success,
          message: 'Contraseña temporal cambiada exitosamente',
          data: {
            passwordChanged: true,
            wasTemporary: true,
            isTemporary: false,
          },
        };
      } else {
        // Cambio de contraseña normal (admin)
        const adminChangeDto: AdminChangePasswordDto = {
          usuarioId,
          newPassword: body.newPassword,
          generarTemporal: false,
          adminEmail: usuario.correo, // Usuario se cambia su propia contraseña
        };

        const resultado = await this.usuariosService.adminChangePassword(adminChangeDto);
        
        return {
          success: resultado.success,
          message: 'Contraseña actualizada exitosamente',
          data: {
            passwordChanged: true,
            wasTemporary: false,
            isTemporary: false,
          },
        };
      }
    } catch (error) {
      this.logger.error(`Error al cambiar contraseña del usuario ${usuarioId}: ${error.message}`);
      throw error;
    }
  }


  // GESTIÓN DE CONTRASEÑAS TEMPORALES
  @Post(':id/password/generate')
  async generateTemporaryPassword(
    @Param('id', ParseIntPipe) usuarioId: number,
    @Body() body: GenerateTemporaryPasswordDto,
  ) {
    try {
      const adminChangeDto: AdminChangePasswordDto = {
        usuarioId,
        generarTemporal: true,
        notificarEmail: false,
        adminEmail: body.adminEmail,
        ip: body.ip,
      };

      const resultado = await this.usuariosService.adminChangePassword(adminChangeDto);
      
      return {
        success: true,
        message: 'Contraseña temporal generada exitosamente',
        data: {
          temporaryPassword: resultado.temporaryPassword,
          fechaExpiracion: resultado.fechaExpiracion,
          instructions: [
            'Guarda esta contraseña temporal de forma segura',
            'Válida por 24 horas únicamente',
            'El usuario debe cambiarla en su primer inicio de sesión',
            'Esta contraseña temporal no se mostrará nuevamente'
          ],
          security: {
            expiresIn: '24 horas',
            mustChangeOnFirstLogin: true,
            oneTimeView: true,
          }
        },
      };
    } catch (error) {
      this.logger.error(`Error al generar contraseña temporal para usuario ${usuarioId}: ${error.message}`);
      throw error;
    }
  }

  // CAMBIO DE CONTRASEÑA TEMPORAL POR USUARIO
  @Put(':id/password/change-temporary')
  async changeTemporaryPassword(
    @Param('id', ParseIntPipe) usuarioId: number,
    @Body() body: { nuevaPassword: string },
  ) {
    try {
      const resultado = await this.usuariosService.cambiarPasswordTemporal(
        usuarioId,
        body.nuevaPassword
      );
      
      return {
        success: resultado.success,
        message: resultado.mensaje,
        data: {
          passwordChanged: true,
          isTemporary: false,
          instructions: [
            'Contraseña cambiada exitosamente',
            'Ya no es temporal',
            'Puedes usar esta contraseña para futuros inicios de sesión'
          ]
        },
      };
    } catch (error) {
      this.logger.error(`Error al cambiar contraseña temporal del usuario ${usuarioId}: ${error.message}`);
      throw error;
    }
  }

  // ADMIN: OBTENER CONTRASEÑAS TEMPORALES GENERADAS
  @Get('admin/temporary-passwords')
  async getAdminTemporaryPasswords(
    @Query('adminEmail') adminEmail: string,
  ) {
    try {
      if (!adminEmail) {
        throw new BadRequestException('Se requiere adminEmail como parámetro');
      }

      const passwords = await this.usuariosService.obtenerPasswordsTemporalesAdmin(adminEmail);
      
      return {
        success: true,
        message: `Se encontraron ${passwords.length} contraseñas temporales generadas por ${adminEmail}`,
        data: passwords,
        security: {
          warning: 'Esta información es altamente sensible',
          adminResponsible: adminEmail,
          generatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.logger.error(`Error al obtener contraseñas temporales: ${error.message}`);
      throw error;
    }
  }

  // LIMPIAR CONTRASEÑAS TEMPORALES EXPIRADAS
  @Post('admin/cleanup-expired')
  async cleanupExpiredPasswords() {
    try {
      const resultado = await this.usuariosService.limpiarPasswordsExpiradas();
      
      return {
        success: true,
        message: `Limpieza completada. ${resultado.eliminadas} contraseñas temporales expiradas fueron marcadas como usadas`,
        data: {
          eliminadas: resultado.eliminadas,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Error en limpieza de contraseñas temporales: ${error.message}`);
      throw error;
    }
  }

  // ESTADÍSTICAS DE CONTRASEÑAS TEMPORALES
  @Get('admin/temporary-passwords/stats')
  async getTemporaryPasswordsStats(@Query('adminEmail') adminEmail?: string) {
    try {
      if (!adminEmail) {
        throw new BadRequestException('Se requiere adminEmail para obtener estadísticas');
      }

      const passwords = await this.usuariosService.obtenerPasswordsTemporalesAdmin(adminEmail);
      
      const stats = {
        totalGeneradas: passwords.length,
        activas: passwords.filter(p => !p.usado && !p.expirada).length,
        expiradas: passwords.filter(p => p.expirada).length,
        usadas: passwords.filter(p => p.usado).length,
        adminEmail,
        ultimaGeneracion: passwords.length > 0 ? passwords[0].fechaGeneracion : null,
      };

      return {
        success: true,
        message: `Estadísticas de contraseñas temporales para ${adminEmail}`,
        data: stats,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas de contraseñas temporales: ${error.message}`);
      throw error;
    }
  }
}
