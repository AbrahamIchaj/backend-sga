import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { PermisosService } from '../Services/permisos.service';
import { CreatePermisoDto } from '../dto/create-permiso.dto';
import { UpdatePermisoDto } from '../dto/update-permiso.dto';

@Controller('permisos')
export class PermisosController {
  private readonly logger = new Logger(PermisosController.name);

  constructor(private readonly permisosService: PermisosService) {}

  @Post()
  async create(@Body() createPermisoDto: CreatePermisoDto) {
    try {
      if (!createPermisoDto.permiso?.trim()) {
        throw new HttpException(
          'El nombre del permiso es requerido',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!createPermisoDto.descripcion?.trim()) {
        throw new HttpException(
          'La descripción del permiso es requerida',
          HttpStatus.BAD_REQUEST,
        );
      }

      const permiso = await this.permisosService.create(createPermisoDto);

      return {
        success: true,
        message: 'Permiso creado exitosamente',
        data: permiso,
      };
    } catch (error) {
      this.logger.error(`Error al crear permiso: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.message.includes('ya existe')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }

      throw new HttpException(
        `Error al crear permiso: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      const permisos = await this.permisosService.findAll();

      return {
        success: true,
        message: `Se encontraron ${permisos.length} permisos`,
        data: permisos,
      };
    } catch (error) {
      this.logger.error(`Error al obtener permisos: ${error.message}`);

      throw new HttpException(
        `Error al obtener permisos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const permiso = await this.permisosService.findOne(id);

      if (!permiso) {
        throw new HttpException(
          `Permiso con ID ${id} no encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Permiso encontrado',
        data: permiso,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener permiso con ID ${id}: ${error.message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error al obtener permiso: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermisoDto: UpdatePermisoDto,
  ) {
    try {
      const permiso = await this.permisosService.update(id, updatePermisoDto);

      return {
        success: true,
        message: 'Permiso actualizado exitosamente',
        data: permiso,
      };
    } catch (error) {
      this.logger.error(
        `Error al actualizar permiso con ID ${id}: ${error.message}`,
      );

      if (error.code === 'P2025') {
        throw new HttpException(
          `Permiso con ID ${id} no encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.message.includes('ya existe')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }

      throw new HttpException(
        `Error al actualizar permiso: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.permisosService.remove(id);

      return {
        success: true,
        message: 'Permiso eliminado exitosamente',
      };
    } catch (error) {
      this.logger.error(
        `Error al eliminar permiso con ID ${id}: ${error.message}`,
      );

      if (error.code === 'P2025') {
        throw new HttpException(
          `Permiso con ID ${id} no encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.message.includes('está asignado')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }

      throw new HttpException(
        `Error al eliminar permiso: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
