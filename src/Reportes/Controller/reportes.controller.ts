import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { ReportesService } from '../Services/reportes.service';
import { ReporteFiltroQueryDto } from '../dto/reportes-query.dto';

@Controller('reportes')
export class ReportesController {
  private readonly logger = new Logger(ReportesController.name);

  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  async obtenerResumen(@Query() query: ReporteFiltroQueryDto) {
    try {
      const data = await this.reportesService.obtenerResumen(query);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener resumen de reportes: ${error.message ?? error}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al obtener el resumen de reportes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('consumos-mensuales')
  async obtenerConsumosMensuales(@Query() query: ReporteFiltroQueryDto) {
    try {
      const data = await this.reportesService.obtenerConsumoMensual(query);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener consumos mensuales: ${error.message ?? error}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al obtener los consumos mensuales',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('consumos-mensuales/detalle')
  async obtenerConsumosMensualesDetalle(@Query() query: ReporteFiltroQueryDto) {
    try {
      const data = await this.reportesService.obtenerConsumoMensualDetalle(query);
      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `Error al obtener detalle de consumos mensuales: ${error instanceof Error ? error.message : error}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al obtener el detalle de consumos mensuales',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('compras-anuales')
  async obtenerComprasAnuales(@Query() query: ReporteFiltroQueryDto) {
    try {
      const data = await this.reportesService.obtenerComprasAnuales(query);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener compras anuales: ${error.message ?? error}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al obtener el reporte de compras anuales',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('despachos-anuales')
  async obtenerDespachosAnuales(@Query() query: ReporteFiltroQueryDto) {
    try {
      const data = await this.reportesService.obtenerDespachosAnuales(query);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener despachos anuales: ${error.message ?? error}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al obtener el reporte de despachos anuales',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reajustes-anuales')
  async obtenerReajustesAnuales(@Query() query: ReporteFiltroQueryDto) {
    try {
      const data = await this.reportesService.obtenerReajustesAnuales(query);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener reajustes anuales: ${error.message ?? error}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al obtener el reporte de reajustes anuales',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
