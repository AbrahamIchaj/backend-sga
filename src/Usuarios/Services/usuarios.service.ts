import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HashService } from './hash.service';
import { PasswordTemporalService } from './password-temporal.service';
import { Usuarios, Roles, Prisma } from '@prisma/client';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { AdminChangePasswordDto } from '../dto/password.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';

type UsuarioConRol = Usuarios & {
  Roles: Roles | null;
};

type UsuarioSinPassword = Omit<UsuarioConRol, 'passwordHash'>;

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
    private passwordTemporalService: PasswordTemporalService,
  ) {}

  async create(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioSinPassword> {
    try {
      // 1. Verificar que el correo no esté en uso
      const existingUser = await this.prisma.usuarios.findUnique({
        where: { correo: createUsuarioDto.correo },
      });

      if (existingUser) {
        throw new ConflictException(
          `El correo ${createUsuarioDto.correo} ya está registrado`,
        );
      }

      const roleExists = await this.prisma.roles.findUnique({
        where: { idRoles: createUsuarioDto.idRol },
      });

      if (!roleExists) {
        throw new NotFoundException(
          `Rol con ID ${createUsuarioDto.idRol} no encontrado`,
        );
      }

      const passwordValidation = this.hashService.validatePasswordStrength(
        createUsuarioDto.password,
      );
      if (!passwordValidation.isValid) {
        throw new BadRequestException(
          `Contraseña débil: ${passwordValidation.feedback.join(', ')}`,
        );
      }

      // 4. Hashear la contraseña
      const passwordHash = await this.hashService.hashPassword(
        createUsuarioDto.password,
      );

      const usuario = await this.prisma.usuarios.create({
        data: {
          nombres: createUsuarioDto.nombres.trim(),
          apellidos: createUsuarioDto.apellidos.trim(),
          correo: createUsuarioDto.correo.toLowerCase().trim(),
          passwordHash,
          telefono: createUsuarioDto.telefono,
          idRol: createUsuarioDto.idRol,
          activo: createUsuarioDto.activo ?? true,
        },
        include: {
          Roles: true,
        },
      });

      this.logger.log(
        `Usuario creado exitosamente: ${usuario.correo} (ID: ${usuario.idUsuario})`,
      );

      const { passwordHash: _, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    } catch (error) {
      this.logger.error(`Error al crear usuario: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<UsuarioSinPassword[]> {
    try {
      const usuarios = await this.prisma.usuarios.findMany({
        include: {
          Roles: true,
        },
        orderBy: {
          fechaCreacion: 'desc',
        },
      });

      // Remover hash de contraseña de todos los usuarios
      const usuariosSinPassword = usuarios.map(
        ({ passwordHash, ...usuario }) => usuario,
      );

      this.logger.log(`Se encontraron ${usuariosSinPassword.length} usuarios`);
      return usuariosSinPassword;
    } catch (error) {
      this.logger.error(`Error al obtener usuarios: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number): Promise<UsuarioSinPassword | null> {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
        include: {
          Roles: true,
        },
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      // Actualizar último acceso
      await this.prisma.usuarios.update({
        where: { idUsuario: id },
        data: { ultimoAcceso: new Date() },
      });

      const { passwordHash, ...usuarioSinPassword } = usuario;

      this.logger.log(`Usuario encontrado: ${usuario.correo} (ID: ${id})`);
      return usuarioSinPassword;
    } catch (error) {
      this.logger.error(
        `Error al obtener usuario con ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async obtenerPerfil(id: number) {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
        include: {
          Roles: true,
        },
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      const perfil = this.mapearPerfil(usuario);

      this.logger.log(`Perfil obtenido para usuario ${id}`);
      return perfil;
    } catch (error) {
      this.logger.error(
        `Error al obtener el perfil del usuario ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async actualizarPerfil(id: number, updatePerfilDto: UpdatePerfilDto) {
    try {
      const usuarioActual = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
      });

      if (!usuarioActual) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      const data: Prisma.UsuariosUpdateInput = {};

      if (updatePerfilDto.nombres) {
        data.nombres = updatePerfilDto.nombres.trim();
      }

      if (updatePerfilDto.apellidos) {
        data.apellidos = updatePerfilDto.apellidos.trim();
      }

      if (updatePerfilDto.correo) {
        const correo = updatePerfilDto.correo.toLowerCase().trim();

        if (correo !== usuarioActual.correo) {
          const correoExistente = await this.prisma.usuarios.findUnique({
            where: { correo },
          });

          if (correoExistente) {
            throw new ConflictException(
              `El correo ${updatePerfilDto.correo} ya está registrado`,
            );
          }
        }

        data.correo = correo;
      }

      if (updatePerfilDto.telefono !== undefined) {
        const telefonoLimpio = updatePerfilDto.telefono
          ?.replace(/[^\d]/g, '')
          .trim();

        if (telefonoLimpio) {
          const telefono = Number(telefonoLimpio);

          if (Number.isNaN(telefono)) {
            throw new BadRequestException(
              'El teléfono proporcionado no es válido',
            );
          }

          data.telefono = telefono;
        } else {
          data.telefono = null;
        }
      }

      if (updatePerfilDto.fotoBase64 !== undefined) {
        const fotoNormalizada = updatePerfilDto.fotoBase64
          ? updatePerfilDto.fotoBase64.trim()
          : null;

        data.img = fotoNormalizada
          ? Buffer.from(fotoNormalizada, 'utf8')
          : null;
      }

      if (updatePerfilDto.eliminarFoto) {
        data.img = null;
      }

      if (Object.keys(data).length === 0) {
        return this.obtenerPerfil(id);
      }

      const usuarioActualizado = await this.prisma.usuarios.update({
        where: { idUsuario: id },
        data,
        include: {
          Roles: true,
        },
      });

      const perfil = this.mapearPerfil(usuarioActualizado);

      this.logger.log(`Perfil actualizado para usuario ${id}`);
      return perfil;
    } catch (error) {
      this.logger.error(
        `Error al actualizar el perfil del usuario ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<UsuarioSinPassword> {
    try {
      const existingUser = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
      });

      if (!existingUser) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      if (
        updateUsuarioDto.correo &&
        updateUsuarioDto.correo !== existingUser.correo
      ) {
        const emailInUse = await this.prisma.usuarios.findUnique({
          where: { correo: updateUsuarioDto.correo },
        });

        if (emailInUse) {
          throw new ConflictException(
            `El correo ${updateUsuarioDto.correo} ya está registrado`,
          );
        }
      }

      if (updateUsuarioDto.idRol) {
        const roleExists = await this.prisma.roles.findUnique({
          where: { idRoles: updateUsuarioDto.idRol },
        });

        if (!roleExists) {
          throw new NotFoundException(
            `Rol con ID ${updateUsuarioDto.idRol} no encontrado`,
          );
        }
      }

      // Actualizar el usuario
      const usuario = await this.prisma.usuarios.update({
        where: { idUsuario: id },
        data: {
          ...(updateUsuarioDto.nombres && {
            nombres: updateUsuarioDto.nombres.trim(),
          }),
          ...(updateUsuarioDto.apellidos && {
            apellidos: updateUsuarioDto.apellidos.trim(),
          }),
          ...(updateUsuarioDto.correo && {
            correo: updateUsuarioDto.correo.toLowerCase().trim(),
          }),
          ...(updateUsuarioDto.telefono !== undefined && {
            telefono: updateUsuarioDto.telefono,
          }),
          ...(updateUsuarioDto.idRol && { idRol: updateUsuarioDto.idRol }),
          ...(updateUsuarioDto.activo !== undefined && {
            activo: updateUsuarioDto.activo,
          }),
        },
        include: {
          Roles: true,
        },
      });

      const { passwordHash, ...usuarioSinPassword } = usuario;

      this.logger.log(`Usuario actualizado: ${usuario.correo} (ID: ${id})`);
      return usuarioSinPassword;
    } catch (error) {
      this.logger.error(
        `Error al actualizar usuario con ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
        include: {
          Despachos: true,
          HistorialInventario: true,
          Reajustes: true,
        },
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      // Verificar si tiene registros asociados
      const hasRecords =
        usuario.Despachos.length > 0 ||
        usuario.HistorialInventario.length > 0 ||
        usuario.Reajustes.length > 0;

      if (hasRecords) {
        // Soft delete si tiene registros asociados
        await this.prisma.usuarios.update({
          where: { idUsuario: id },
          data: {
            activo: false,
            fechaDesabilitacion: new Date(),
          },
        });
        this.logger.log(
          `Usuario deshabilitado (soft delete): ${usuario.correo} (ID: ${id})`,
        );
      } else {
        // Hard delete si no tiene registros asociados
        await this.prisma.usuarios.delete({
          where: { idUsuario: id },
        });
        this.logger.log(
          `Usuario eliminado permanentemente: ${usuario.correo} (ID: ${id})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al eliminar usuario con ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  private mapearPerfil(usuario: UsuarioConRol) {
    const { passwordHash: _password, Roles: rol, img, ...resto } = usuario;

    const foto = this.normalizarImagen(img as unknown as Buffer | null);

    return {
      ...resto,
      rol: rol
        ? {
            idRoles: rol.idRoles,
            nombreRol: rol.nombreRol,
            descripcion: rol.descripcion,
          }
        : null,
      fotoPerfil: foto,
    };
  }

  private normalizarImagen(img: Buffer | Uint8Array | null): string | null {
    if (!img) {
      return null;
    }

    const buffer = Buffer.isBuffer(img) ? img : Buffer.from(img);
    const posibleCadena = buffer.toString('utf8').trim();

    const cadenaNormalizada = this.normalizarCadenaImagen(posibleCadena);
    if (cadenaNormalizada) {
      return cadenaNormalizada;
    }

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  private normalizarCadenaImagen(cadena: string): string | null {
    if (!cadena) {
      return null;
    }

    if (cadena.startsWith('data:image')) {
      return cadena;
    }

    if (this.esCadenaBase64(cadena)) {
      return `data:image/png;base64,${cadena}`;
    }

    return null;
  }

  private esCadenaBase64(cadena: string): boolean {
    if (!cadena || cadena.length % 4 !== 0) {
      return false;
    }

    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    return base64Regex.test(cadena);
  }

  //METODO DE GESTION DE CONTRASEÑAS
  async adminChangePassword(
    adminChangePasswordDto: AdminChangePasswordDto,
  ): Promise<{
    success: boolean;
    temporaryPassword?: string;
    message: string;
    fechaExpiracion?: Date;
  }> {
    try {
      const {
        usuarioId,
        newPassword,
        generarTemporal,
        notificarEmail,
        adminEmail,
        ip,
      } = adminChangePasswordDto;

      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: usuarioId },
      });

      if (!usuario) {
        throw new NotFoundException(
          `Usuario con ID ${usuarioId} no encontrado`,
        );
      }

      if (generarTemporal) {
        // GENERAR CONTRASEÑA TEMPORAL (24 horas)
        const resultado =
          await this.passwordTemporalService.generarPasswordTemporal(
            usuarioId,
            adminEmail,
            'Cambio de contraseña por administrador',
            ip,
          );

        this.logger.log(
          `Contraseña temporal generada para: ${usuario.correo} por admin: ${adminEmail}`,
        );

        return {
          success: true,
          temporaryPassword: resultado.passwordTemporal,
          fechaExpiracion: resultado.fechaExpiracion,
          message: `Contraseña temporal generada. Válida hasta ${resultado.fechaExpiracion.toLocaleString()}`,
        };
      } else {
        if (!newPassword) {
          throw new BadRequestException(
            'Se requiere newPassword cuando generarTemporal es false',
          );
        }

        const validation =
          this.hashService.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
          throw new BadRequestException(
            `Contraseña débil: ${validation.feedback.join(', ')}`,
          );
        }

        // Hashear la nueva contraseña
        const passwordHash = await this.hashService.hashPassword(newPassword);

        await this.prisma.usuarios.update({
          where: { idUsuario: usuarioId },
          data: {
            passwordHash,
            esTemporal: false,
            debesCambiarPassword: false,
          },
        });

        this.logger.log(
          `Contraseña actualizada directamente por administrador para usuario: ${usuario.correo}`,
        );

        return {
          success: true,
          message: 'Contraseña actualizada exitosamente',
        };
      }
    } catch (error) {
      this.logger.error(
        `Error en cambio de contraseña por admin: ${error.message}`,
      );
      throw error;
    }
  }

  //VERIFICAR CREDENCIALES
  async verifyCredentials(
    correo: string,
    password: string,
  ): Promise<{
    usuario: UsuarioSinPassword | null;
    esTemporal: boolean;
    debeExpirar: boolean;
    mensaje: string;
  }> {
    try {
      // Buscar usuario por correo
      const usuario = await this.prisma.usuarios.findUnique({
        where: { correo: correo.toLowerCase().trim() },
        include: { Roles: true },
      });

      if (!usuario || !usuario.activo) {
        return {
          usuario: null,
          esTemporal: false,
          debeExpirar: false,
          mensaje: 'Credenciales inválidas o usuario inactivo',
        };
      }

      // Si tiene contraseña temporal, verificar por ese método
      if (usuario.esTemporal) {
        const verificacionTemporal =
          await this.passwordTemporalService.verificarPasswordTemporal(
            usuario.idUsuario,
            password,
          );

        if (!verificacionTemporal.esValido) {
          if (verificacionTemporal.debeExpirar) {
            // Desactivar usuario con contraseña temporal expirada
            await this.prisma.usuarios.update({
              where: { idUsuario: usuario.idUsuario },
              data: { activo: false },
            });
          }

          this.logger.warn(
            `Intento de login fallido con contraseña temporal para: ${correo}`,
          );
          return {
            usuario: null,
            esTemporal: true,
            debeExpirar: verificacionTemporal.debeExpirar,
            mensaje: verificacionTemporal.mensaje,
          };
        }

        // Login exitoso con contraseña temporal
        await this.prisma.usuarios.update({
          where: { idUsuario: usuario.idUsuario },
          data: { ultimoAcceso: new Date() },
        });

        const { passwordHash, ...usuarioSinPassword } = usuario;

        this.logger.log(
          `Login exitoso con contraseña temporal para: ${correo}`,
        );
        return {
          usuario: usuarioSinPassword,
          esTemporal: true,
          debeExpirar: false,
          mensaje:
            'Login exitoso con contraseña temporal. Debe cambiar su contraseña.',
        };
      } else {
        // Verificación de contraseña permanente normal
        const isValidPassword = await this.hashService.verifyPassword(
          password,
          usuario.passwordHash,
        );

        if (!isValidPassword) {
          this.logger.warn(`Intento de login fallido para: ${correo}`);
          return {
            usuario: null,
            esTemporal: false,
            debeExpirar: false,
            mensaje: 'Credenciales inválidas',
          };
        }

        // Actualizar último acceso
        await this.prisma.usuarios.update({
          where: { idUsuario: usuario.idUsuario },
          data: { ultimoAcceso: new Date() },
        });

        const { passwordHash, ...usuarioSinPassword } = usuario;

        this.logger.log(`Login exitoso para: ${correo}`);
        return {
          usuario: usuarioSinPassword,
          esTemporal: false,
          debeExpirar: false,
          mensaje: 'Login exitoso',
        };
      }
    } catch (error) {
      this.logger.error(
        `Error en verificación de credenciales: ${error.message}`,
      );
      return {
        usuario: null,
        esTemporal: false,
        debeExpirar: false,
        mensaje: 'Error interno del servidor',
      };
    }
  }

  // BUSCAR USUARIOS
  async search(query: string): Promise<UsuarioSinPassword[]> {
    try {
      const usuarios = await this.prisma.usuarios.findMany({
        where: {
          OR: [
            { nombres: { contains: query, mode: 'insensitive' } },
            { apellidos: { contains: query, mode: 'insensitive' } },
            { correo: { contains: query, mode: 'insensitive' } },
            { Roles: { nombreRol: { contains: query, mode: 'insensitive' } } },
          ],
        },
        include: { Roles: true },
        orderBy: { nombres: 'asc' },
      });

      const usuariosSinPassword = usuarios.map(
        ({ passwordHash, ...usuario }) => usuario,
      );

      this.logger.log(
        `Búsqueda "${query}" encontró ${usuariosSinPassword.length} usuarios`,
      );
      return usuariosSinPassword;
    } catch (error) {
      this.logger.error(`Error en búsqueda de usuarios: ${error.message}`);
      throw error;
    }
  }

  //ESTADISTICAS DE USUARIOS
  async getEstadisticas(): Promise<{
    totalUsuarios: number;
    usuariosActivos: number;
    usuariosInactivos: number;
    porRoles: Array<{ rol: string; cantidad: number }>;
  }> {
    try {
      const [totalUsuarios, usuariosActivos, usuariosInactivos, porRoles] =
        await Promise.all([
          this.prisma.usuarios.count(),
          this.prisma.usuarios.count({ where: { activo: true } }),
          this.prisma.usuarios.count({ where: { activo: false } }),
          this.prisma.usuarios.groupBy({
            by: ['idRol'],
            _count: { idRol: true },
          }),
        ]);

      // Obtener nombres de roles
      const rolesData = await this.prisma.roles.findMany();
      const rolesMap = new Map(
        rolesData.map((rol) => [rol.idRoles, rol.nombreRol]),
      );

      const estadisticasPorRoles = porRoles.map((item) => ({
        rol: rolesMap.get(item.idRol) || 'Desconocido',
        cantidad: item._count.idRol,
      }));

      return {
        totalUsuarios,
        usuariosActivos,
        usuariosInactivos,
        porRoles: estadisticasPorRoles,
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`);
      throw error;
    }
  }

  //CAMBIO DE CONTRASEÑA TEMPORAL POR UNA PERMANENTE
  async cambiarPasswordTemporal(
    usuarioId: number,
    nuevaPassword: string,
  ): Promise<{ success: boolean; mensaje: string }> {
    try {
      return await this.passwordTemporalService.cambiarPasswordTemporalAPermanente(
        usuarioId,
        nuevaPassword,
      );
    } catch (error) {
      this.logger.error(
        `Error al cambiar contraseña temporal: ${error.message}`,
      );
      throw error;
    }
  }

  // CONTRASEÑAS TEMPORALES ADMIN
  async obtenerPasswordsTemporalesAdmin(adminEmail: string) {
    try {
      return await this.passwordTemporalService.obtenerPasswordsTemporalesAdmin(
        adminEmail,
      );
    } catch (error) {
      this.logger.error(
        `Error al obtener contraseñas temporales: ${error.message}`,
      );
      throw error;
    }
  }

  // LIMPIAR CONTRASEÑAS TEMPORALES EXPIRADAS
  async limpiarPasswordsExpiradas() {
    try {
      return await this.passwordTemporalService.limpiarPasswordsExpiradas();
    } catch (error) {
      this.logger.error(
        `Error en limpieza de contraseñas temporales: ${error.message}`,
      );
      throw error;
    }
  }
}
