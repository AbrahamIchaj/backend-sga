import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('catalogo-insumos-api')
export class CatalogoInsumosApiController {
  private readonly logger = new Logger(CatalogoInsumosApiController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/v1/catalogo-insumos-api
   * Obtener todos los insumos del catálogo
   */
  @Get()
  async findAll(@Query() query: Record<string, any>) {
    try {
      this.logger.log('Obteniendo todos los insumos del catálogo');

      const filtros = this.parseRenglonFilters(query);

      const insumos = await this.prisma.catalogoInsumos.findMany({
        where: filtros,
        orderBy: [{ codigoInsumo: 'asc' }, { codigoPresentacion: 'asc' }],
      });

      return {
        success: true,
        message: `Se encontraron ${insumos.length} insumos`,
        data: insumos,
        total: insumos.length,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener catálogo de insumos: ${error.message}`,
      );
      return {
        success: false,
        message: `Error al obtener insumos: ${error.message}`,
        data: [],
        total: 0,
      };
    }
  }

  /**
   * GET /api/v1/catalogo-insumos-api/buscar-por-codigo/:codigo
   * Buscar insumo por código exacto - retorna todas las presentaciones
   */
  @Get('buscar-por-codigo/:codigo')
  async findByCode(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Query() query: Record<string, any>,
  ) {
    try {
      this.logger.log(`Buscando insumos con código: ${codigo}`);

      const filtros = this.parseRenglonFilters(query);

      const insumos = await this.prisma.catalogoInsumos.findMany({
        where: { codigoInsumo: codigo, ...filtros },
        orderBy: { codigoPresentacion: 'asc' },
      });

      if (insumos.length === 0) {
        return {
          success: false,
          message: `No se encontraron insumos con el código ${codigo}`,
          data: [],
          total: 0,
        };
      }

      return {
        success: true,
        message: `Se encontraron ${insumos.length} presentaciones para el código ${codigo}`,
        data: insumos,
        total: insumos.length,
      };
    } catch (error) {
      this.logger.error(
        `Error al buscar insumo por código ${codigo}: ${error.message}`,
      );
      return {
        success: false,
        message: `Error al buscar insumo: ${error.message}`,
        data: [],
        total: 0,
      };
    }
  }

  /**
   * GET /api/v1/catalogo-insumos-api/test
   * Endpoint de prueba
   */
  @Get('test')
  async test() {
    return {
      success: true,
      message: 'Endpoint funcionando correctamente',
      data: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * GET /api/v1/catalogo-insumos-api/search?q=termino
   * Buscar insumos por término en nombre o características
   */
  @Get('search')
  async searchByTerm(
    @Query('q') term: string,
    @Query('limit') limit?: string,
    @Query() queryParams?: Record<string, any>,
  ) {
    try {
      if (!term || term.trim().length === 0) {
        return {
          success: false,
          message: 'Se requiere un término de búsqueda',
          data: [],
          total: 0,
        };
      }

      const limitNum = limit ? parseInt(limit, 10) : 50;
      this.logger.log(
        `Buscando insumos con término: "${term}" (límite: ${limitNum})`,
      );

      const filtros = this.parseRenglonFilters(queryParams);

      const insumos = await this.prisma.catalogoInsumos.findMany({
        where: {
          OR: [
            { nombreInsumo: { contains: term, mode: 'insensitive' } },
            { caracteristicas: { contains: term, mode: 'insensitive' } },
            { nombrePresentacion: { contains: term, mode: 'insensitive' } },
          ],
          ...filtros,
        },
        orderBy: [{ codigoInsumo: 'asc' }, { codigoPresentacion: 'asc' }],
        take: limitNum,
      });

      return {
        success: true,
        message: `Se encontraron ${insumos.length} insumos`,
        data: insumos,
        total: insumos.length,
      };
    } catch (error) {
      this.logger.error(
        `Error en búsqueda por término "${term}": ${error.message}`,
      );
      return {
        success: false,
        message: `Error en la búsqueda: ${error.message}`,
        data: [],
        total: 0,
      };
    }
  }

  /**
   * GET /api/v1/catalogo-insumos-api/presentaciones/:codigoInsumo
   * Obtener todas las presentaciones disponibles para un código de insumo
   */
  @Get('presentaciones/:codigoInsumo')
  async getPresentaciones(
    @Param('codigoInsumo', ParseIntPipe) codigoInsumo: number,
    @Query() query: Record<string, any>,
  ) {
    try {
      this.logger.log(
        `Obteniendo presentaciones para código de insumo: ${codigoInsumo}`,
      );

      const filtros = this.parseRenglonFilters(query);

      const presentaciones = await this.prisma.catalogoInsumos.findMany({
        where: { codigoInsumo },
        select: {
          idCatalogoInsumos: true,
          codigoPresentacion: true,
          nombrePresentacion: true,
          unidadMedida: true,
          renglon: true,
        },
        orderBy: { codigoPresentacion: 'asc' },
      });

      const filtradas = filtros?.renglon?.in
        ? presentaciones.filter((item) =>
            (filtros.renglon?.in as number[]).includes(item.renglon),
          )
        : presentaciones;

      if (filtradas.length === 0) {
        return {
          success: false,
          message: `No se encontraron presentaciones para el código ${codigoInsumo}`,
          data: [],
          total: 0,
        };
      }

      return {
        success: true,
        message: `Se encontraron ${filtradas.length} presentaciones`,
        data: filtradas,
        total: filtradas.length,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener presentaciones para código ${codigoInsumo}: ${error.message}`,
      );
      return {
        success: false,
        message: `Error al obtener presentaciones: ${error.message}`,
        data: [],
        total: 0,
      };
    }
  }

  /**
   * GET /api/v1/catalogo-insumos-api/codigo/:codigo
   * Buscar insumo por código exacto - retorna el primer insumo encontrado
   */
  @Get('codigo/:codigo')
  async findSingleByCode(@Param('codigo') codigo: string) {
    try {
      this.logger.log(
        `[findSingleByCode] Iniciando búsqueda con código: ${codigo}`,
      );

      // Intentamos buscar por código exacto como número
      const codigoNum = parseInt(codigo, 10);
      this.logger.log(
        `[findSingleByCode] Código convertido a número: ${codigoNum}`,
      );

      if (isNaN(codigoNum)) {
        this.logger.warn(`[findSingleByCode] Código inválido: ${codigo}`);
        return {
          success: false,
          message: `Código inválido: ${codigo}`,
          data: null,
        };
      }

      this.logger.log(
        `[findSingleByCode] Buscando en base de datos con codigoInsumo: ${codigoNum}`,
      );
      const insumo = await this.prisma.catalogoInsumos.findFirst({
        where: { codigoInsumo: codigoNum },
        orderBy: { codigoPresentacion: 'asc' },
      });

      this.logger.log(
        `[findSingleByCode] Resultado de búsqueda:`,
        insumo ? 'ENCONTRADO' : 'NO ENCONTRADO',
      );

      if (!insumo) {
        return {
          success: false,
          message: `No se encontró insumo con el código ${codigo}`,
          data: null,
        };
      }

      this.logger.log(
        `[findSingleByCode] Retornando insumo: ${insumo.nombreInsumo}`,
      );
      return {
        success: true,
        message: `Insumo encontrado con código ${codigo}`,
        data: insumo,
      };
    } catch (error) {
      this.logger.error(
        `[findSingleByCode] Error al buscar insumo por código ${codigo}: ${error.message}`,
      );
      return {
        success: false,
        message: `Error al buscar insumo: ${error.message}`,
        data: null,
      };
    }
  }

  private parseRenglonFilters(query?: Record<string, any>) {
    if (!query) {
      return undefined;
    }

    const renglonesRaw = query.renglones ?? query.allowedRenglones;
    let renglones: number[] = [];

    if (typeof renglonesRaw === 'string') {
      renglones = renglonesRaw
        .split(',')
        .map((value: string) => Number(value.trim()))
        .filter((value) => Number.isFinite(value));
    } else if (Array.isArray(renglonesRaw)) {
      renglones = renglonesRaw
        .map((value: any) => Number(String(value).trim()))
        .filter((value) => Number.isFinite(value));
    }

    if (!renglones.length) {
      return undefined;
    }

    return {
      renglon: {
        in: renglones,
      },
    };
  }
}
