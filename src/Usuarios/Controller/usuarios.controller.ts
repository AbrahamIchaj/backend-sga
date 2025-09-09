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
} from '@nestjs/common';
import { UsuariosService } from '../Services/usuarios.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';

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
