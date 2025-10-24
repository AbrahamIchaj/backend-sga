import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { AbastecimientosService } from '../Services/abastecimientos.service';
import { ListarAbastecimientosQueryDto } from '../dto/listar-abastecimientos.dto';
import { GuardarAbastecimientosGeneralDto } from '../dto/guardar-abastecimientos-general.dto';

@Controller('abastecimientos-general')
export class AbastecimientosGeneralController {
  private readonly logger = new Logger(AbastecimientosGeneralController.name);

  constructor(private readonly abastecimientosService: AbastecimientosService) {}

  @Get()
  async listar(@Query() query: ListarAbastecimientosQueryDto): Promise<any> {
    try {
      const ahora = new Date();
      const anio = query.anio ?? ahora.getFullYear();
      const mes = query.mes ?? ahora.getMonth() + 1;

      this.logger.log(
        `Consultando abastecimientos general para ${anio}-${mes} con filtros ${JSON.stringify(query)}`,
      );

      const data = await this.abastecimientosService.listarGeneral({
        ...query,
        anio,
        mes,
      });

      return {
        success: true,
        message: 'Abastecimientos general obtenidos correctamente',
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error al listar abastecimientos general: ${error instanceof Error ? error.message : error}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Ocurrió un error al consultar los abastecimientos general',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async guardar(@Body() body: GuardarAbastecimientosGeneralDto): Promise<any> {
    try {
      this.logger.log(
        `Guardando abastecimientos general para ${body.anio}-${body.mes} (insumos: ${body.insumos?.length ?? 0})`,
      );
      const data = await this.abastecimientosService.guardarGeneral(body);
      return {
        success: true,
        message: 'Abastecimientos general guardados correctamente',
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error al guardar abastecimientos general: ${error instanceof Error ? error.message : error}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'No fue posible guardar los abastecimientos general',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
