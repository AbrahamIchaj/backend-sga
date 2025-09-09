import { 
  Controller, 
  Put, 
  Param, 
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { UsuariosService } from '../Services/usuarios.service';

@Controller('usuarios/manage')
export class ActivarDesactivarUsuariosController {
  private readonly logger = new Logger(ActivarDesactivarUsuariosController.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  @Put(':id/activate')
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    try {
      const usuario = await this.usuariosService.update(id, { activo: true });
      
      return {
        success: true,
        message: 'Usuario activado exitosamente',
        data: usuario,
        meta: {
          action: 'ACTIVATE_USER',
          timestamp: new Date().toISOString(),
          userId: id,
        },
      };
    } catch (error) {
      this.logger.error(`Error al activar usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/deactivate')
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    try {
      const usuario = await this.usuariosService.update(id, { activo: false });
      
      return {
        success: true,
        message: 'Usuario desactivado exitosamente',
        data: usuario,
        meta: {
          action: 'DEACTIVATE_USER',
          timestamp: new Date().toISOString(),
          userId: id,
        },
      };
    } catch (error) {
      this.logger.error(`Error al desactivar usuario ${id}: ${error.message}`);
      throw error;
    }
  }
}