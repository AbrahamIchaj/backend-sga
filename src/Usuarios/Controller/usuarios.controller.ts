import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger,
  Patch,
} from '@nestjs/common';
import { UsuariosService } from '../Services/usuarios.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { ActualizarRenglonesDto } from '../dto/update-renglones.dto';

@Controller('usuarios')
export class UsuariosController {
  private readonly logger = new Logger(UsuariosController.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    try {
      const usuario = await this.usuariosService.create(createUsuarioDto);

      return {
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuario,
        meta: {
          action: 'CREATE_USER',
          timestamp: new Date().toISOString(),
          userId: usuario.idUsuario,
        },
      };
    } catch (error) {
      this.logger.error(`Error al crear usuario: ${error.message}`);
      throw error;
    }
  }

  @Get()
  async findAll() {
    try {
      const usuarios = await this.usuariosService.findAll();

      return {
        success: true,
        message: `Se encontraron ${usuarios.length} usuarios`,
        data: usuarios,
        meta: {
          total: usuarios.length,
          action: 'LIST_USERS',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Error al obtener usuarios: ${error.message}`);
      throw error;
    }
  }

  @Get('renglones/disponibles')
  async obtenerRenglonesDisponibles() {
    try {
      const renglones = await this.usuariosService.obtenerRenglonesDisponibles();

      return {
        success: true,
        message: 'Renglones disponibles obtenidos correctamente',
        data: renglones,
        meta: {
          action: 'GET_RENGLONES_DISPONIBLES',
          timestamp: new Date().toISOString(),
          total: renglones.length,
        },
      };
    } catch (error) {
      this.logger.error(`Error al obtener renglones disponibles: ${error.message}`);
      throw error;
    }
  }

  @Get(':id/perfil')
  async obtenerPerfil(@Param('id', ParseIntPipe) id: number) {
    try {
      const perfil = await this.usuariosService.obtenerPerfil(id);

      return {
        success: true,
        message: 'Perfil obtenido correctamente',
        data: perfil,
        meta: {
          action: 'GET_PROFILE',
          timestamp: new Date().toISOString(),
          userId: id,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener el perfil del usuario ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const usuario = await this.usuariosService.findOne(id);

      return {
        success: true,
        message: 'Usuario encontrado',
        data: usuario,
        meta: {
          action: 'GET_USER',
          timestamp: new Date().toISOString(),
          userId: id,
        },
      };
    } catch (error) {
      this.logger.error(`Error al obtener usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    try {
      const usuario = await this.usuariosService.update(id, updateUsuarioDto);

      return {
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuario,
        meta: {
          action: 'UPDATE_USER',
          timestamp: new Date().toISOString(),
          userId: id,
          fieldsUpdated: Object.keys(updateUsuarioDto),
        },
      };
    } catch (error) {
      this.logger.error(`Error al actualizar usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/renglones')
  async actualizarRenglones(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarRenglonesDto,
  ) {
    try {
      const usuario = await this.usuariosService.actualizarRenglones(
        id,
        dto.renglones,
      );

      return {
        success: true,
        message: 'Renglones actualizados correctamente',
        data: usuario,
        meta: {
          action: 'UPDATE_RENGLONES_USUARIO',
          timestamp: new Date().toISOString(),
          userId: id,
          totalRenglones: usuario.renglonesPermitidos.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error al actualizar renglones del usuario ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Patch(':id/perfil')
  async actualizarPerfil(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePerfilDto: UpdatePerfilDto,
  ) {
    try {
      const perfil = await this.usuariosService.actualizarPerfil(
        id,
        updatePerfilDto,
      );

      return {
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: perfil,
        meta: {
          action: 'UPDATE_PROFILE',
          timestamp: new Date().toISOString(),
          userId: id,
          fieldsUpdated: Object.keys(updatePerfilDto),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error al actualizar el perfil del usuario ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.usuariosService.remove(id);

      this.logger.log(`Usuario ${id} eliminado/deshabilitado exitosamente`);

      return {
        success: true,
        message: 'Usuario eliminado/deshabilitado exitosamente',
        meta: {
          action: 'DELETE_USER',
          timestamp: new Date().toISOString(),
          userId: id,
        },
      };
    } catch (error) {
      this.logger.error(`Error al eliminar usuario ${id}: ${error.message}`);
      throw error;
    }
  }
}
