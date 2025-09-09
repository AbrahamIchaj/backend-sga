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
  Query,
  Put,
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


  // ENDPOINTS PARA GESTIÓN DE PERMISOS

  @Get('search')
  async search(@Query('query') query: string) {
    try {
      if (!query || query.trim() === '') {
        throw new HttpException('El parámetro query es requerido', HttpStatus.BAD_REQUEST);
      }

      const roles = await this.rolesService.search(query.trim());
      
      return {
        success: true,
        message: `Búsqueda "${query}" encontró ${roles.length} resultado(s)`,
        data: roles,
      };
    } catch (error) {
      this.logger.error(`Error en búsqueda de roles: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Error en búsqueda: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/permisos')
  async asignarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() asignarPermisosDto: AsignarPermisosDto,
  ) {
    try {
      if (!asignarPermisosDto.permisos || asignarPermisosDto.permisos.length === 0) {
        throw new HttpException('Se debe especificar al menos un permiso', HttpStatus.BAD_REQUEST);
      }

      const rol = await this.rolesService.asignarPermisos(id, asignarPermisosDto);
      
      return {
        success: true,
        message: `Se asignaron ${asignarPermisosDto.permisos.length} permiso(s) al rol`,
        data: rol,
      };
    } catch (error) {
      this.logger.error(`Error al asignar permisos al rol ${id}: ${error.message}`);
      
      if (error.message.includes('no encontrado')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      if (error.message.includes('no existen')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException(
        `Error al asignar permisos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/permisos')
  async revocarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() revocarPermisosDto: RevocarPermisosDto,
  ) {
    try {
      if (!revocarPermisosDto.permisos || revocarPermisosDto.permisos.length === 0) {
        throw new HttpException('Se debe especificar al menos un permiso', HttpStatus.BAD_REQUEST);
      }

      const rol = await this.rolesService.revocarPermisos(id, revocarPermisosDto);
      
      return {
        success: true,
        message: `Se revocaron ${revocarPermisosDto.permisos.length} permiso(s) del rol`,
        data: rol,
      };
    } catch (error) {
      this.logger.error(`Error al revocar permisos del rol ${id}: ${error.message}`);
      
      if (error.message.includes('no encontrado')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        `Error al revocar permisos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/permisos')
  async sincronizarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() sincronizarPermisosDto: SincronizarPermisosDto,
  ) {
    try {
      const rol = await this.rolesService.sincronizarPermisos(id, sincronizarPermisosDto);
      
      return {
        success: true,
        message: `Permisos sincronizados. El rol ahora tiene ${sincronizarPermisosDto.permisos.length} permiso(s)`,
        data: rol,
      };
    } catch (error) {
      this.logger.error(`Error al sincronizar permisos del rol ${id}: ${error.message}`);
      
      if (error.message.includes('no encontrado')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      if (error.message.includes('no existen')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException(
        `Error al sincronizar permisos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/permisos')
  async obtenerPermisosDeRol(@Param('id', ParseIntPipe) id: number) {
    try {
      const permisos = await this.rolesService.obtenerPermisosDeRol(id);
      
      return {
        success: true,
        message: `El rol tiene ${permisos.length} permiso(s) activo(s)`,
        data: permisos,
      };
    } catch (error) {
      this.logger.error(`Error al obtener permisos del rol ${id}: ${error.message}`);
      
      throw new HttpException(
        `Error al obtener permisos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
