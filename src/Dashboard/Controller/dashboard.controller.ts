import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DashboardService } from '../Services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  async obtenerResumen() {
    try {
      const data = await this.dashboardService.obtenerResumen();
      return {
        success: true,
        message: 'Resumen del dashboard obtenido correctamente',
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener resumen del dashboard: ${error.message}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al obtener el resumen del dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
