import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Servicios } from '@prisma/client';
import { CreateServicioDto } from '../dto/create-servicio.dto';
import { UpdateServicioDto } from '../dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  private readonly logger = new Logger(ServiciosService.name);

  constructor(private prisma: PrismaService) {}

  async create(createServicioDto: CreateServicioDto): Promise<Servicios> {
    try {
      const servicio = await this.prisma.servicios.create({
        data: {
          nombre: createServicioDto.nombre.trim(),
          observaciones: createServicioDto.observaciones?.trim() || null,
        },
      });

      this.logger.log(`Servicio creado con ID: ${servicio.idServicio}`);
      return servicio;
    } catch (error) {
      this.logger.error(`Error al crear servicio: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<Servicios[]> {
    try {
      const servicios = await this.prisma.servicios.findMany({
        orderBy: {
          nombre: 'asc',
        },
      });

      this.logger.log(`Se encontraron ${servicios.length} servicios`);
      return servicios;
    } catch (error) {
      this.logger.error(`Error al obtener servicios: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number): Promise<Servicios | null> {
    try {
      const servicio = await this.prisma.servicios.findUnique({
        where: { idServicio: id },
        include: {
          Despachos: true,
        },
      });

      if (servicio) {
        this.logger.log(`Servicio encontrado con ID: ${id}`);
      } else {
        this.logger.warn(`Servicio no encontrado con ID: ${id}`);
      }

      return servicio;
    } catch (error) {
      this.logger.error(
        `Error al obtener servicio con ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateServicioDto: UpdateServicioDto,
  ): Promise<Servicios> {
    try {
      const servicio = await this.prisma.servicios.update({
        where: { idServicio: id },
        data: {
          ...(updateServicioDto.nombre && {
            nombre: updateServicioDto.nombre.trim(),
          }),
          ...(updateServicioDto.observaciones !== undefined && {
            observaciones: updateServicioDto.observaciones?.trim() || null,
          }),
        },
      });

      this.logger.log(`Servicio actualizado con ID: ${id}`);
      return servicio;
    } catch (error) {
      this.logger.error(
        `Error al actualizar servicio con ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.servicios.delete({
        where: { idServicio: id },
      });

      this.logger.log(`Servicio eliminado con ID: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error al eliminar servicio con ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async search(query: string): Promise<Servicios[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const servicios = await this.prisma.servicios.findMany({
        where: {
          OR: [
            {
              nombre: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
            {
              observaciones: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: {
          nombre: 'asc',
        },
        take: 50,
      });

      this.logger.log(
        `Búsqueda "${query}" encontró ${servicios.length} resultados`,
      );
      return servicios;
    } catch (error) {
      this.logger.error(`Error en búsqueda "${query}": ${error.message}`);
      throw error;
    }
  }
}
