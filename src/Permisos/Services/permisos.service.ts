import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Permisos } from '@prisma/client';
import { CreatePermisoDto } from '../dto/create-permiso.dto';
import { UpdatePermisoDto } from '../dto/update-permiso.dto';

@Injectable()
export class PermisosService {
  private readonly logger = new Logger(PermisosService.name);

  constructor(private prisma: PrismaService) {}

  async create(createPermisoDto: CreatePermisoDto): Promise<Permisos> {
    try {
      const permiso = await this.prisma.permisos.create({
        data: {
          permiso: createPermisoDto.permiso.trim(),
          descripcion: createPermisoDto.descripcion.trim(),
        },
      });

      this.logger.log(`Permiso creado con ID: ${permiso.idPermisos}`);
      return permiso;
    } catch (error) {
      this.logger.error(`Error al crear permiso: ${error.message}`);
      
      // Manejar error de duplicado (unique constraint)
      if (error.code === 'P2002') {
        throw new Error(`El permiso "${createPermisoDto.permiso}" ya existe`);
      }
      
      throw error;
    }
  }

  async findAll(): Promise<Permisos[]> {
    try {
      const permisos = await this.prisma.permisos.findMany({
        orderBy: {
          permiso: 'asc',
        },
        include: {
          RolPermisos: {
            include: {
              Roles: true,
            },
          },
        },
      });

      this.logger.log(`Se encontraron ${permisos.length} permisos`);
      return permisos;
    } catch (error) {
      this.logger.error(`Error al obtener permisos: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number): Promise<Permisos | null> {
    try {
      const permiso = await this.prisma.permisos.findUnique({
        where: { idPermisos: id },
        include: {
          RolPermisos: {
            include: {
              Roles: true,
            },
          },
        },
      });

      if (permiso) {
        this.logger.log(`Permiso encontrado con ID: ${id}`);
      } else {
        this.logger.warn(`Permiso no encontrado con ID: ${id}`);
      }

      return permiso;
    } catch (error) {
      this.logger.error(`Error al obtener permiso con ID ${id}: ${error.message}`);
      throw error;
    }
  }


  async update(id: number, updatePermisoDto: UpdatePermisoDto): Promise<Permisos> {
    try {
      const permiso = await this.prisma.permisos.update({
        where: { idPermisos: id },
        data: {
          ...(updatePermisoDto.permiso && { permiso: updatePermisoDto.permiso.trim() }),
          ...(updatePermisoDto.descripcion && { descripcion: updatePermisoDto.descripcion.trim() }),
        },
        include: {
          RolPermisos: {
            include: {
              Roles: true,
            },
          },
        },
      });

      this.logger.log(`Permiso actualizado con ID: ${id}`);
      return permiso;
    } catch (error) {
      this.logger.error(`Error al actualizar permiso con ID ${id}: ${error.message}`);
      
      // Manejar error de duplicado (unique constraint)
      if (error.code === 'P2002') {
        throw new Error(`El permiso "${updatePermisoDto.permiso}" ya existe`);
      }
      
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Verificar si el permiso está siendo usado por algún rol
      const permisoEnUso = await this.prisma.rolPermisos.findFirst({
        where: { idPermisos: id },
      });

      if (permisoEnUso) {
        throw new Error('No se puede eliminar el permiso porque está asignado a uno o más roles');
      }

      await this.prisma.permisos.delete({
        where: { idPermisos: id },
      });

      this.logger.log(`Permiso eliminado con ID: ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar permiso con ID ${id}: ${error.message}`);
      throw error;
    }
  }
 
}
