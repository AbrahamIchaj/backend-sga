import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles, Permisos } from '@prisma/client';
import { CreateRolDto } from '../dto/create-rol.dto';
import { UpdateRolDto } from '../dto/update-rol.dto';
import { AsignarPermisosDto, RevocarPermisosDto, SincronizarPermisosDto } from '../dto/permisos-rol.dto';

type RolConPermisos = Roles & {
  RolPermisos: Array<{
    Permisos: Permisos;
  }>;
  Usuarios: Array<any>;
};

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createRolDto: CreateRolDto): Promise<RolConPermisos> {
    try {
      const rol = await this.prisma.roles.create({
        data: {
          nombreRol: createRolDto.nombreRol.trim(),
          descripcion: createRolDto.descripcion.trim(),
        },
        include: {
          RolPermisos: {
            include: {
              Permisos: true,
            },
          },
          Usuarios: true,
        },
      });

      this.logger.log(`Rol creado con ID: ${rol.idRoles}`);
      return rol;
    } catch (error) {
      this.logger.error(`Error al crear rol: ${error.message}`);
      
      // Manejar error de duplicado (unique constraint)
      if (error.code === 'P2002') {
        throw new Error(`El rol "${createRolDto.nombreRol}" ya existe`);
      }
      
      throw error;
    }
  }

  async findAll(): Promise<RolConPermisos[]> {
    try {
      const roles = await this.prisma.roles.findMany({
        orderBy: {
          nombreRol: 'asc',
        },
        include: {
          RolPermisos: {
            where: { activo: true }, // Solo permisos activos
            include: {
              Permisos: true,
            },
          },
          Usuarios: {
            select: {
              idUsuario: true,
              nombre: true,
              correo: true,
              activo: true,
            },
          },
        },
      });

      this.logger.log(`Se encontraron ${roles.length} roles`);
      return roles;
    } catch (error) {
      this.logger.error(`Error al obtener roles: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number): Promise<RolConPermisos | null> {
    try {
      const rol = await this.prisma.roles.findUnique({
        where: { idRoles: id },
        include: {
          RolPermisos: {
            where: { activo: true }, // Solo permisos activos
            include: {
              Permisos: true,
            },
          },
          Usuarios: {
            select: {
              idUsuario: true,
              nombre: true,
              correo: true,
              activo: true,
              fechaCreacion: true,
            },
          },
        },
      });

      if (rol) {
        this.logger.log(`Rol encontrado con ID: ${id}`);
      } else {
        this.logger.warn(`Rol no encontrado con ID: ${id}`);
      }

      return rol;
    } catch (error) {
      this.logger.error(`Error al obtener rol con ID ${id}: ${error.message}`);
      throw error;
    }
  }


  async update(id: number, updateRolDto: UpdateRolDto): Promise<RolConPermisos> {
    try {
      const rol = await this.prisma.roles.update({
        where: { idRoles: id },
        data: {
          ...(updateRolDto.nombreRol && { nombreRol: updateRolDto.nombreRol.trim() }),
          ...(updateRolDto.descripcion && { descripcion: updateRolDto.descripcion.trim() }),
        },
        include: {
          RolPermisos: {
            where: { activo: true }, // Solo permisos activos
            include: {
              Permisos: true,
            },
          },
          Usuarios: {
            select: {
              idUsuario: true,
              nombre: true,
              correo: true,
              activo: true,
            },
          },
        },
      });

      this.logger.log(`Rol actualizado con ID: ${id}`);
      return rol;
    } catch (error) {
      this.logger.error(`Error al actualizar rol con ID ${id}: ${error.message}`);
      
      // Manejar error de duplicado (unique constraint)
      if (error.code === 'P2002') {
        throw new Error(`El rol "${updateRolDto.nombreRol}" ya existe`);
      }
      
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Verificar si el rol está siendo usado por algún usuario
      const usuariosConRol = await this.prisma.usuarios.findMany({
        where: { idRol: id },
        select: { idUsuario: true, nombre: true },
      });

      if (usuariosConRol.length > 0) {
        const nombresUsuarios = usuariosConRol.map(u => u.nombre).join(', ');
        throw new Error(`No se puede eliminar el rol porque está asignado a los siguientes usuarios: ${nombresUsuarios}`);
      }

      // Eliminar primero las relaciones con permisos
      await this.prisma.rolPermisos.deleteMany({
        where: { idRoles: id },
      });

      // Eliminar el rol
      await this.prisma.roles.delete({
        where: { idRoles: id },
      });

      this.logger.log(`Rol eliminado con ID: ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar rol con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  // ================================
  // MÉTODOS AVANZADOS PARA GESTIÓN DE PERMISOS
  // ================================

  async asignarPermisos(rolId: number, asignarPermisosDto: AsignarPermisosDto): Promise<RolConPermisos> {
    try {
      // Verificar que el rol existe
      const rolExiste = await this.prisma.roles.findUnique({
        where: { idRoles: rolId },
      });

      if (!rolExiste) {
        throw new Error(`Rol con ID ${rolId} no encontrado`);
      }

      // Verificar que todos los permisos existen
      const permisosExistentes = await this.prisma.permisos.findMany({
        where: {
          idPermisos: { in: asignarPermisosDto.permisos },
        },
      });

      if (permisosExistentes.length !== asignarPermisosDto.permisos.length) {
        const idsEncontrados = permisosExistentes.map(p => p.idPermisos);
        const idsFaltantes = asignarPermisosDto.permisos.filter(id => !idsEncontrados.includes(id));
        throw new Error(`Los siguientes permisos no existen: ${idsFaltantes.join(', ')}`);
      }

      // Asignar permisos (skipDuplicates evita errores por permisos ya asignados)
      await this.prisma.rolPermisos.createMany({
        data: asignarPermisosDto.permisos.map(idPermiso => ({
          idRoles: rolId,
          idPermisos: idPermiso,
          activo: true,
        })),
        skipDuplicates: true,
      });

      this.logger.log(`Permisos asignados al rol ${rolId}: ${asignarPermisosDto.permisos.join(', ')}`);

      // Retornar rol actualizado con permisos
      const rolActualizado = await this.findOne(rolId);
      if (!rolActualizado) {
        throw new Error(`Error al obtener rol actualizado con ID ${rolId}`);
      }
      return rolActualizado;
    } catch (error) {
      this.logger.error(`Error al asignar permisos al rol ${rolId}: ${error.message}`);
      throw error;
    }
  }

  async revocarPermisos(rolId: number, revocarPermisosDto: RevocarPermisosDto): Promise<RolConPermisos> {
    try {
      // Verificar que el rol existe
      const rolExiste = await this.prisma.roles.findUnique({
        where: { idRoles: rolId },
      });

      if (!rolExiste) {
        throw new Error(`Rol con ID ${rolId} no encontrado`);
      }

      // Revocar permisos específicos (eliminar de la tabla junction)
      await this.prisma.rolPermisos.deleteMany({
        where: {
          idRoles: rolId,
          idPermisos: { in: revocarPermisosDto.permisos },
        },
      });

      this.logger.log(`Permisos revocados del rol ${rolId}: ${revocarPermisosDto.permisos.join(', ')}`);

      // Retornar rol actualizado
      const rolActualizado = await this.findOne(rolId);
      if (!rolActualizado) {
        throw new Error(`Error al obtener rol actualizado con ID ${rolId}`);
      }
      return rolActualizado;
    } catch (error) {
      this.logger.error(`Error al revocar permisos del rol ${rolId}: ${error.message}`);
      throw error;
    }
  }

  async sincronizarPermisos(rolId: number, sincronizarPermisosDto: SincronizarPermisosDto): Promise<RolConPermisos> {
    try {
      // Usar transacción para garantizar atomicidad
      return await this.prisma.$transaction(async (prisma) => {
        // Verificar que el rol existe
        const rolExiste = await prisma.roles.findUnique({
          where: { idRoles: rolId },
        });

        if (!rolExiste) {
          throw new Error(`Rol con ID ${rolId} no encontrado`);
        }

        // Verificar que todos los permisos nuevos existen
        if (sincronizarPermisosDto.permisos.length > 0) {
          const permisosExistentes = await prisma.permisos.findMany({
            where: {
              idPermisos: { in: sincronizarPermisosDto.permisos },
            },
          });

          if (permisosExistentes.length !== sincronizarPermisosDto.permisos.length) {
            const idsEncontrados = permisosExistentes.map(p => p.idPermisos);
            const idsFaltantes = sincronizarPermisosDto.permisos.filter(id => !idsEncontrados.includes(id));
            throw new Error(`Los siguientes permisos no existen: ${idsFaltantes.join(', ')}`);
          }
        }

        // 1. Eliminar TODOS los permisos actuales del rol
        await prisma.rolPermisos.deleteMany({
          where: { idRoles: rolId },
        });

        // 2. Asignar SOLO los permisos especificados
        if (sincronizarPermisosDto.permisos.length > 0) {
          await prisma.rolPermisos.createMany({
            data: sincronizarPermisosDto.permisos.map(idPermiso => ({
              idRoles: rolId,
              idPermisos: idPermiso,
              activo: true,
            })),
          });
        }

        this.logger.log(`Permisos sincronizados para rol ${rolId}. Nuevos permisos: ${sincronizarPermisosDto.permisos.join(', ')}`);

        // 3. Retornar rol actualizado
        const rolActualizado = await prisma.roles.findUnique({
          where: { idRoles: rolId },
          include: {
            RolPermisos: {
              where: { activo: true }, // Solo permisos activos
              include: {
                Permisos: true,
              },
            },
            Usuarios: {
              select: {
                idUsuario: true,
                nombre: true,
                correo: true,
                activo: true,
              },
            },
          },
        });

        if (!rolActualizado) {
          throw new Error(`Error al obtener rol actualizado con ID ${rolId}`);
        }

        return rolActualizado;
      });
    } catch (error) {
      this.logger.error(`Error al sincronizar permisos del rol ${rolId}: ${error.message}`);
      throw error;
    }
  }

  async obtenerPermisosDeRol(rolId: number): Promise<Permisos[]> {
    try {
      const rolPermisos = await this.prisma.rolPermisos.findMany({
        where: { 
          idRoles: rolId,
          activo: true, // Solo permisos activos
        },
        include: {
          Permisos: true,
        },
      });

      const permisos = rolPermisos.map(rp => rp.Permisos);
      this.logger.log(`Se encontraron ${permisos.length} permisos activos para el rol ${rolId}`);
      
      return permisos;
    } catch (error) {
      this.logger.error(`Error al obtener permisos del rol ${rolId}: ${error.message}`);
      throw error;
    }
  }

  async verificarPermiso(rolId: number, nombrePermiso: string): Promise<boolean> {
    try {
      const permisoExiste = await this.prisma.rolPermisos.findFirst({
        where: {
          idRoles: rolId,
          activo: true,
          Permisos: {
            permiso: nombrePermiso,
          },
        },
      });

      const tienePermiso = permisoExiste !== null;
      this.logger.log(`Rol ${rolId} ${tienePermiso ? 'TIENE' : 'NO TIENE'} el permiso "${nombrePermiso}"`);
      
      return tienePermiso;
    } catch (error) {
      this.logger.error(`Error al verificar permiso "${nombrePermiso}" para rol ${rolId}: ${error.message}`);
      throw error;
    }
  }

  // Método auxiliar para búsquedas avanzadas
  async search(query: string): Promise<RolConPermisos[]> {
    try {
      const roles = await this.prisma.roles.findMany({
        where: {
          OR: [
            { nombreRol: { contains: query, mode: 'insensitive' } },
            { descripcion: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          RolPermisos: {
            where: { activo: true },
            include: {
              Permisos: true,
            },
          },
          Usuarios: {
            select: {
              idUsuario: true,
              nombre: true,
              correo: true,
              activo: true,
            },
          },
        },
        orderBy: {
          nombreRol: 'asc',
        },
      });

      this.logger.log(`Búsqueda "${query}" encontró ${roles.length} roles`);
      return roles;
    } catch (error) {
      this.logger.error(`Error en búsqueda de roles con query "${query}": ${error.message}`);
      throw error;
    }
  }

}
