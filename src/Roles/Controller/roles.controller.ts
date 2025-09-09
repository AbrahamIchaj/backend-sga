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
import { RolesService } from '../Services/roles.service';
import { CreateRolDto } from '../dto/create-rol.dto';
import { UpdateRolDto } from '../dto/update-rol.dto';
import { AsignarPermisosDto, RevocarPermisosDto, SincronizarPermisosDto } from '../dto/permisos-rol.dto';

@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRolDto: CreateRolDto) {
    try {
      if (!createRolDto.nombreRol?.trim()) {
        throw new HttpException('El nombre del rol es requerido', HttpStatus.BAD_REQUEST);
      }

      if (!createRolDto.descripcion?.trim()) {
        throw new HttpException('La descripción del rol es requerida', HttpStatus.BAD_REQUEST);
      }

      const rol = await this.rolesService.create(createRolDto);
      
      return {
        success: true,
        message: 'Rol creado exitosamente',
        data: rol,
      };
    } catch (error) {
      this.logger.error(`Error al crear rol: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.message.includes('ya existe')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      
      throw new HttpException(
        `Error al crear rol: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      const roles = await this.rolesService.findAll();
      
      return {
        success: true,
        message: `Se encontraron ${roles.length} roles`,
        data: roles,
      };
    } catch (error) {
      this.logger.error(`Error al obtener roles: ${error.message}`);
      
      throw new HttpException(
        `Error al obtener roles: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const rol = await this.rolesService.findOne(id);
      
      if (!rol) {
        throw new HttpException(`Rol con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: 'Rol encontrado',
        data: rol,
      };
    } catch (error) {
      this.logger.error(`Error al obtener rol con ID ${id}: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Error al obtener rol: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolDto: UpdateRolDto,
  ) {
    try {
      const rol = await this.rolesService.update(id, updateRolDto);
      
      return {
        success: true,
        message: 'Rol actualizado exitosamente',
        data: rol,
      };
    } catch (error) {
      this.logger.error(`Error al actualizar rol con ID ${id}: ${error.message}`);
      
      if (error.code === 'P2025') {
        throw new HttpException(`Rol con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      if (error.message.includes('ya existe')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      
      throw new HttpException(
        `Error al actualizar rol: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.rolesService.remove(id);
      
      return {
        success: true,
        message: 'Rol eliminado exitosamente',
      };
    } catch (error) {
      this.logger.error(`Error al eliminar rol con ID ${id}: ${error.message}`);
      
      if (error.code === 'P2025') {
        throw new HttpException(`Rol con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      if (error.message.includes('está asignado')) {
        throw new HttpException(
          error.message,
          HttpStatus.CONFLICT,
        );
      }
      
      throw new HttpException(
        `Error al eliminar rol: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
