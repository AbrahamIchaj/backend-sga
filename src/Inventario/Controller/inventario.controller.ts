import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InventarioService } from '../Services/inventario.service';
import {
  ListInventarioQueryDto,
  InventarioExistenciasDto,
  InventarioHistorialQueryDto,
} from '../dto/inventario-query.dto';

@Controller('inventario')
export class InventarioController {
  private readonly logger = new Logger(InventarioController.name);

  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * GET /inventario
   * Obtener lista paginada del inventario con filtros opcionales
   */
  @Get()
  async findAll(@Query() query: ListInventarioQueryDto) {
    try {
      this.logger.log(
        `Consultando inventario con filtros: ${JSON.stringify(query)}`,
      );
      const result = await this.inventarioService.findAll(query);
      return {
        success: true,
        message: 'Inventario obtenido exitosamente',
        ...result,
      };
    } catch (error) {
      this.logger.error(`Error al consultar inventario: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar inventario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/:id
   * Obtener un item específico del inventario por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Consultando item de inventario con ID: ${id}`);
      const data = await this.inventarioService.findOne(id);
      return {
        success: true,
        message: 'Item de inventario obtenido exitosamente',
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error al consultar item de inventario ${id}: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar item de inventario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/existencias/consultar
   * Obtener existencias agrupadas por producto con filtros opcionales
   */
  @Get('existencias/consultar')
  async getExistencias(@Query() query: InventarioExistenciasDto) {
    try {
      this.logger.log(
        `Consultando existencias con filtros: ${JSON.stringify(query)}`,
      );
      const data = await this.inventarioService.getExistencias(query);
      return {
        success: true,
        message: 'Existencias obtenidas exitosamente',
        data,
        total: data.length,
      };
    } catch (error) {
      this.logger.error(`Error al consultar existencias: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar existencias: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/historial/movimientos
   * Obtener historial de movimientos de inventario
   */
  @Get('historial/movimientos')
  async getHistorial(@Query() query: InventarioHistorialQueryDto) {
    try {
      this.logger.log(
        `Consultando historial de inventario con filtros: ${JSON.stringify(query)}`,
      );
      const result = await this.inventarioService.getHistorial(query);
      return {
        success: true,
        message: 'Historial de inventario obtenido exitosamente',
        ...result,
      };
    } catch (error) {
      this.logger.error(`Error al consultar historial: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar historial: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/resumen/general
   * Obtener resumen general del inventario
   */
  @Get('resumen/general')
  async getResumen() {
    try {
      this.logger.log('Consultando resumen general del inventario');
      const data = await this.inventarioService.getResumen();
      return {
        success: true,
        message: 'Resumen del inventario obtenido exitosamente',
        data,
      };
    } catch (error) {
      this.logger.error(`Error al consultar resumen: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar resumen: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/alertas/dashboard
   * Obtener alertas del inventario (vencidos, próximos a vencer, stock bajo)
   */
  @Get('alertas/dashboard')
  async getAlertas() {
    try {
      this.logger.log('Consultando alertas del inventario');
      const data = await this.inventarioService.getAlertas();
      return {
        success: true,
        message: 'Alertas del inventario obtenidas exitosamente',
        data,
      };
    } catch (error) {
      this.logger.error(`Error al consultar alertas: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar alertas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/movimientos/recientes
   * Obtener movimientos recientes del inventario
   */
  @Get('movimientos/recientes')
  async getMovimientosRecientes(
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    try {
      this.logger.log(`Consultando ${limit} movimientos recientes`);
      const data = await this.inventarioService.getMovimientosRecientes(limit);
      return {
        success: true,
        message: 'Movimientos recientes obtenidos exitosamente',
        data,
        total: data.length,
      };
    } catch (error) {
      this.logger.error(
        `Error al consultar movimientos recientes: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar movimientos recientes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/productos/:codigoInsumo/existencias
   * Obtener existencias específicas de un producto por código
   */
  @Get('productos/:codigoInsumo/existencias')
  async getExistenciasProducto(
    @Param('codigoInsumo', ParseIntPipe) codigoInsumo: number,
  ) {
    try {
      this.logger.log(`Consultando existencias del producto ${codigoInsumo}`);
      const data = await this.inventarioService.getExistencias({
        codigoInsumo,
      });

      if (data.length === 0) {
        throw new HttpException(
          `No se encontraron existencias para el producto ${codigoInsumo}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Existencias del producto obtenidas exitosamente',
        data: data[0], // Solo devolvemos el primer elemento ya que es un producto específico
      };
    } catch (error) {
      this.logger.error(
        `Error al consultar existencias del producto ${codigoInsumo}: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar existencias del producto: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/lotes/:lote/detalles
   * Obtener detalles específicos de un lote
   */
  @Get('lotes/:lote/detalles')
  async getDetallesLote(@Param('lote') lote: string) {
    try {
      this.logger.log(`Consultando detalles del lote: ${lote}`);
      const result = await this.inventarioService.findAll({
        lote: lote,
        limit: 100, // Ajustar según necesidades
      });

      if (result.data.length === 0) {
        throw new HttpException(
          `No se encontraron productos para el lote ${lote}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Detalles del lote obtenidos exitosamente',
        data: result.data,
        total: result.data.length,
      };
    } catch (error) {
      this.logger.error(
        `Error al consultar detalles del lote ${lote}: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar detalles del lote: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/vencimientos/proximos
   * Obtener productos próximos a vencer
   */
  @Get('vencimientos/proximos')
  async getProximosVencer(@Query('dias', ParseIntPipe) dias: number = 30) {
    try {
      this.logger.log(
        `Consultando productos próximos a vencer en ${dias} días`,
      );

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      const result = await this.inventarioService.findAll({
        fechaVencimientoDesde: new Date().toISOString(),
        fechaVencimientoHasta: fechaLimite.toISOString(),
        limit: 100,
      });

      return {
        success: true,
        message: `Productos próximos a vencer en ${dias} días obtenidos exitosamente`,
        data: result.data,
        total: result.data.length,
        diasConsultados: dias,
      };
    } catch (error) {
      this.logger.error(
        `Error al consultar productos próximos a vencer: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar productos próximos a vencer: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /inventario/stock/bajo
   * Obtener productos con stock bajo
   */
  @Get('stock/bajo')
  async getStockBajo(@Query('minimo', ParseIntPipe) minimo: number = 10) {
    try {
      this.logger.log(`Consultando productos con stock menor a ${minimo}`);

      const result = await this.inventarioService.findAll({
        cantidadMinima: 1,
        stockBajo: true,
        limit: 100,
      });

      return {
        success: true,
        message: `Productos con stock bajo (menor a ${minimo}) obtenidos exitosamente`,
        data: result.data,
        total: result.data.length,
        stockMinimo: minimo,
      };
    } catch (error) {
      this.logger.error(
        `Error al consultar productos con stock bajo: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar productos con stock bajo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
