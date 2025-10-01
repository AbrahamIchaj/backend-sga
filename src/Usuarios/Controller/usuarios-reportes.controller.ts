import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { UsuariosService } from '../Services/usuarios.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';

@Controller('usuarios/reportes')
export class UsuariosReportesController {
  private readonly logger = new Logger(UsuariosReportesController.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  // BÚSQUEDA AVANZADA
  @Get('busqueda/avanzada')
  async searchAdvanced(
    @Query()
    query: {
      nombres?: string;
      apellidos?: string;
      correo?: string;
      rol?: string;
      activo?: string;
      fechaCreacionInicio?: string;
      fechaCreacionFin?: string;
    },
  ) {
    try {
      // Validar parámetros de búsqueda
      const searchTerms = [
        query.nombres,
        query.apellidos,
        query.correo,
        query.rol,
      ]
        .filter((term) => term && term.trim())
        .join(' ');

      let usuarios;

      if (!searchTerms) {
        usuarios = await this.usuariosService.findAll();
      } else {
        usuarios = await this.usuariosService.search(searchTerms);
      }

      // Aplicar filtros adicionales
      let usuariosFiltrados = usuarios;

      // Filtrar por estado activo
      if (query.activo !== undefined) {
        const isActive = query.activo.toLowerCase() === 'true';
        usuariosFiltrados = usuariosFiltrados.filter(
          (user) => user.activo === isActive,
        );
      }

      // Filtrar por rango de fechas
      if (query.fechaCreacionInicio) {
        const fechaInicio = new Date(query.fechaCreacionInicio);
        usuariosFiltrados = usuariosFiltrados.filter(
          (user) => new Date(user.fechaCreacion) >= fechaInicio,
        );
      }

      if (query.fechaCreacionFin) {
        const fechaFin = new Date(query.fechaCreacionFin);
        usuariosFiltrados = usuariosFiltrados.filter(
          (user) => new Date(user.fechaCreacion) <= fechaFin,
        );
      }

      return {
        success: true,
        message: `Búsqueda completada. ${usuariosFiltrados.length} usuarios encontrados`,
        data: usuariosFiltrados,
        search: {
          query: searchTerms || 'todos',
          filters: {
            activo: query.activo,
            fechaCreacionInicio: query.fechaCreacionInicio,
            fechaCreacionFin: query.fechaCreacionFin,
          },
          totalResultados: usuariosFiltrados.length,
        },
      };
    } catch (error) {
      this.logger.error(`Error en búsqueda avanzada: ${error.message}`);
      throw error;
    }
  }

  @Get('busqueda/rol')
  async searchByRole(@Query('rol') rol: string) {
    try {
      if (!rol || !rol.trim()) {
        throw new BadRequestException('El parámetro rol es requerido');
      }

      const usuarios = await this.usuariosService.search(rol.trim());

      return {
        success: true,
        message: `Se encontraron ${usuarios.length} usuarios con rol: ${rol}`,
        data: usuarios,
        filters: {
          rol,
          totalEncontrados: usuarios.length,
        },
      };
    } catch (error) {
      this.logger.error(`Error al buscar por rol: ${error.message}`);
      throw error;
    }
  }

  @Get('busqueda/inactivos')
  async getInactiveUsers() {
    try {
      const todosUsuarios = await this.usuariosService.findAll();
      const usuariosInactivos = todosUsuarios.filter((user) => !user.activo);

      return {
        success: true,
        message: `Se encontraron ${usuariosInactivos.length} usuarios inactivos`,
        data: usuariosInactivos,
        stats: {
          totalUsuarios: todosUsuarios.length,
          usuariosInactivos: usuariosInactivos.length,
          porcentajeInactivos: (
            (usuariosInactivos.length / todosUsuarios.length) *
            100
          ).toFixed(2),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener usuarios inactivos: ${error.message}`,
      );
      throw error;
    }
  }

  // ================================
  // ESTADÍSTICAS Y REPORTES
  // ================================

  @Get('reportes/overview')
  async getEstadisticas() {
    try {
      const estadisticas = await this.usuariosService.getEstadisticas();

      return {
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: estadisticas,
        generatedAt: new Date().toISOString(),
        metadata: {
          reportType: 'GENERAL_OVERVIEW',
          version: '1.0',
        },
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`);
      throw error;
    }
  }

  @Get('reportes/exportarUsuarios')
  async exportUsersReport(
    @Query()
    options: {
      formato?: 'json' | 'csv';
      incluirInactivos?: string;
      camposPersonalizados?: string;
    },
  ) {
    try {
      const incluirInactivos = options.incluirInactivos === 'true';
      const usuarios = await this.usuariosService.findAll();

      const usuariosFiltrados = incluirInactivos
        ? usuarios
        : usuarios.filter((u) => u.activo);

      const reportData = usuariosFiltrados.map((usuario) => ({
        id: usuario.idUsuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        telefono: usuario.telefono,
        rol: usuario.Roles ? usuario.Roles.nombreRol : null,
        activo: usuario.activo,
        fechaCreacion: usuario.fechaCreacion,
        ultimoAcceso: usuario.ultimoAcceso,
        esTemporal: usuario.esTemporal,
      }));

      return {
        success: true,
        message: `Reporte generado con ${reportData.length} usuarios`,
        data: reportData,
        export: {
          formato: options.formato || 'json',
          totalRegistros: reportData.length,
          filtros: {
            incluirInactivos,
            soloActivos: !incluirInactivos,
          },
          generatedAt: new Date().toISOString(),
          filename: `usuarios_reporte_${new Date().toISOString().split('T')[0]}.${options.formato || 'json'}`,
        },
      };
    } catch (error) {
      this.logger.error(`Error al generar reporte: ${error.message}`);
      throw error;
    }
  }
}
