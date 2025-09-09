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

}
