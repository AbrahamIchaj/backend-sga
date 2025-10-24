import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AbastecimientosService } from '../Services/abastecimientos.service';
import { ListarAbastecimientosQueryDto } from '../dto/listar-abastecimientos.dto';
import { GuardarAbastecimientosDto } from '../dto/guardar-abastecimientos.dto';
import { ListarHistorialAbastecimientosQueryDto } from '../dto/listar-historial-abastecimientos.dto';
import { ActualizarEstadoAbastecimientoDto } from '../dto/actualizar-estado-abastecimiento.dto';

@Controller('abastecimientos')
export class AbastecimientosController {
  private readonly logger = new Logger(AbastecimientosController.name);

  constructor(private readonly abastecimientosService: AbastecimientosService) {}

  @Get('historial')
  async listarHistorial(
    @Query() query: ListarHistorialAbastecimientosQueryDto,
  ): Promise<any> {
    try {
      this.logger.log(`Consultando historial de abastecimientos con filtros ${JSON.stringify(query)}`);
      const data = await this.abastecimientosService.listarHistorial(query);
      return {
        success: true,
        message: 'Historial obtenido correctamente',
        data,
      };
    } catch (error) {
      this.logger.error(`Error al consultar historial de abastecimientos: ${error instanceof Error ? error.message : error}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Ocurrió un error al consultar el historial de abastecimientos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async listar(@Query() query: ListarAbastecimientosQueryDto): Promise<any> {
    try {
      const ahora = new Date();
      const anio = query.anio ?? ahora.getFullYear();
      const mes = query.mes ?? ahora.getMonth() + 1;

      this.logger.log(
        `Consultando abastecimientos para ${anio}-${mes} con filtros ${JSON.stringify(query)}`,
      );

      const resultado = await this.abastecimientosService.listar({
        ...query,
        anio,
        mes,
      });

      return {
        success: true,
        message: 'Abastecimientos obtenidos correctamente',
        data: resultado,
      };
    } catch (error) {
      this.logger.error(`Error al listar abastecimientos: ${error instanceof Error ? error.message : error}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Ocurrió un error al consultar los abastecimientos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async guardar(@Body() body: GuardarAbastecimientosDto): Promise<any> {
    try {
      this.logger.log(
        `Guardando abastecimientos para ${body.anio}-${body.mes} (insumos: ${body.insumos?.length ?? 0})`,
      );
      const data = await this.abastecimientosService.guardar(body);
      return {
        success: true,
        message: 'Abastecimientos guardados correctamente',
        data,
      };
    } catch (error) {
      this.logger.error(`Error al guardar abastecimientos: ${error instanceof Error ? error.message : error}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'No fue posible guardar los abastecimientos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('estado')
  async actualizarEstado(
    @Body() body: ActualizarEstadoAbastecimientoDto,
  ): Promise<any> {
    try {
      this.logger.log(
        `Actualizando estado activo para insumo ${body.codigoInsumo} en ${body.anio}-${body.mes} a ${body.activo}`,
      );
      const data = await this.abastecimientosService.actualizarEstadoAbastecimiento(body);
      return {
        success: true,
        message: 'Estado del insumo actualizado correctamente',
        data,
      };
    } catch (error) {
      this.logger.error(`Error al actualizar estado de abastecimiento: ${error instanceof Error ? error.message : error}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'No fue posible actualizar el estado del insumo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
