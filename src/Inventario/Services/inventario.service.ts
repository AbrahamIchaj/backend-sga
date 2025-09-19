import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ListInventarioQueryDto, 
  InventarioExistenciasDto, 
  InventarioHistorialQueryDto,
  ReporteInventarioDto 
} from '../dto/inventario-query.dto';
import {
  InventarioResponse,
  ExistenciasResponse,
  HistorialInventarioResponse,
  ResumenInventarioResponse,
  MovimientosRecientesResponse,
  AlertasInventarioResponse
} from '../dto/inventario-response.dto';

@Injectable()
export class InventarioService {
  private readonly logger = new Logger(InventarioService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener lista paginada del inventario con filtros
   */
  async findAll(query: ListInventarioQueryDto) {
    try {
      const { 
        search, 
        codigoInsumo,
        nombreInsumo,
        lote,
        fechaVencimientoDesde,
        fechaVencimientoHasta,
        cantidadMinima,
        codigoPresentacion,
        presentacion,
        proximosVencer,
        stockBajo
      } = query as any;

  // Normalizar filtros que pueden llegar como strings
  const parsedCodigoInsumo = codigoInsumo !== undefined && codigoInsumo !== null ? Number((query as any).codigoInsumo) : undefined;
  const parsedCodigoPresentacion = codigoPresentacion !== undefined && codigoPresentacion !== null ? Number((query as any).codigoPresentacion) : undefined;
  const parsedCantidadMinima = cantidadMinima !== undefined && cantidadMinima !== null ? Number((query as any).cantidadMinima) : undefined;
  const parsedProximosVencer = proximosVencer === 'true' || proximosVencer === true || proximosVencer === '1' || proximosVencer === 1;
      
      // Construir filtros dinámicos
      const where: any = {
        cantidadDisponible: { gt: 0 } // Solo mostrar items con stock disponible
      };

      if (search) {
        where.OR = [
          { nombreInsumo: { contains: search, mode: 'insensitive' } },
          { caracteristicas: { contains: search, mode: 'insensitive' } },
          { lote: { contains: search, mode: 'insensitive' } }
        ];
      }

  if (parsedCodigoInsumo && !Number.isNaN(parsedCodigoInsumo)) where.codigoInsumo = parsedCodigoInsumo;
      if (nombreInsumo) where.nombreInsumo = { contains: nombreInsumo, mode: 'insensitive' };
      if (lote) where.lote = { contains: lote, mode: 'insensitive' };
  if (parsedCantidadMinima !== undefined && !Number.isNaN(parsedCantidadMinima)) where.cantidadDisponible = { gte: parsedCantidadMinima };
  if (parsedCodigoPresentacion && !Number.isNaN(parsedCodigoPresentacion)) where.codigoPresentacion = parsedCodigoPresentacion;
      if (presentacion) where.presentacion = { contains: presentacion, mode: 'insensitive' };

      // Filtro de fechas de vencimiento
      if (fechaVencimientoDesde || fechaVencimientoHasta) {
        where.fechaVencimiento = {};
        if (fechaVencimientoDesde) where.fechaVencimiento.gte = new Date(fechaVencimientoDesde);
        if (fechaVencimientoHasta) where.fechaVencimiento.lte = new Date(fechaVencimientoHasta);
      }

      // Filtro para próximos a vencer (30 días)
      if (parsedProximosVencer) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        where.fechaVencimiento = {
          ...where.fechaVencimiento,
          lte: fechaLimite,
          gte: new Date() // Solo futuros
        };
      }

      // Filtro para stock bajo (menos de 10 unidades)
      if (stockBajo) {
        where.cantidadDisponible = { lt: 10 };
      }

      // Sin paginación: devolver todos los registros que cumplan filtros (con límite razonable si quieres limitar)
      const [inventario, total] = await Promise.all([
        this.prisma.inventario.findMany({
          where,
          include: {
            IngresoCompras: {
              select: {
                idIngresoCompras: true,
                numeroFactura: true,
                serieFactura: true,
                fechaIngreso: true,
                proveedor: true
              }
            }
          },
          orderBy: [
            { fechaVencimiento: 'asc' },
            { codigoInsumo: 'asc' }
          ]
        }),
        this.prisma.inventario.count({ where })
      ]);

      const data: InventarioResponse[] = inventario.map(item => ({
        idInventario: item.idInventario,
        renglon: item.renglon,
        codigoInsumo: item.codigoInsumo,
        nombreInsumo: item.nombreInsumo,
        caracteristicas: item.caracteristicas,
        codigoPresentacion: item.codigoPresentacion,
        presentacion: item.presentacion,
        unidadMedida: item.unidadMedida,
        lote: item.lote,
        cartaCompromiso: item.cartaCompromiso ?? false,
        mesesDevolucion: item.mesesDevolucion ?? null,
        observacionesDevolucion: item.observacionesDevolucion ?? null,
        fechaVencimiento: item.fechaVencimiento,
        cantidadDisponible: item.cantidadDisponible,
        precioUnitario: Number(item.precioUnitario),
        precioTotal: Number(item.precioTotal),
        ingresoCompras: {
          idIngresoCompras: item.IngresoCompras.idIngresoCompras,
          numeroFactura: item.IngresoCompras.numeroFactura,
          serieFactura: item.IngresoCompras.serieFactura,
          fechaIngreso: item.IngresoCompras.fechaIngreso,
          proveedor: item.IngresoCompras.proveedor
        }
      }));

      return {
        data,
        meta: {
          total
        }
      };

    } catch (error) {
      this.logger.error(`Error al obtener inventario: ${error.message}`);
      throw new HttpException(
        `Error al obtener inventario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtener un item específico del inventario
   */
  async findOne(id: number): Promise<InventarioResponse> {
    try {
      const inventario = await this.prisma.inventario.findUnique({
        where: { idInventario: id },
        include: {
          IngresoCompras: {
            select: {
              idIngresoCompras: true,
              numeroFactura: true,
              serieFactura: true,
              fechaIngreso: true,
              proveedor: true
            }
          }
        }
      });

      if (!inventario) {
        throw new HttpException(`Item de inventario con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      return {
        idInventario: inventario.idInventario,
        renglon: inventario.renglon,
        codigoInsumo: inventario.codigoInsumo,
        nombreInsumo: inventario.nombreInsumo,
        caracteristicas: inventario.caracteristicas,
        codigoPresentacion: inventario.codigoPresentacion,
        presentacion: inventario.presentacion,
        unidadMedida: inventario.unidadMedida,
        lote: inventario.lote,
        cartaCompromiso: inventario.cartaCompromiso ?? false,
        mesesDevolucion: inventario.mesesDevolucion ?? null,
        observacionesDevolucion: inventario.observacionesDevolucion ?? null,
        fechaVencimiento: inventario.fechaVencimiento,
        cantidadDisponible: inventario.cantidadDisponible,
        precioUnitario: Number(inventario.precioUnitario),
        precioTotal: Number(inventario.precioTotal),
        ingresoCompras: {
          idIngresoCompras: inventario.IngresoCompras.idIngresoCompras,
          numeroFactura: inventario.IngresoCompras.numeroFactura,
          serieFactura: inventario.IngresoCompras.serieFactura,
          fechaIngreso: inventario.IngresoCompras.fechaIngreso,
          proveedor: inventario.IngresoCompras.proveedor
        }
      };

    } catch (error) {
      this.logger.error(`Error al obtener item de inventario ${id}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al obtener item de inventario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtener existencias agrupadas por producto
   */
  async getExistencias(dto: InventarioExistenciasDto): Promise<ExistenciasResponse[]> {
    try {
      const { codigoInsumo, lote, codigoPresentacion } = dto;

      const where: any = {
        cantidadDisponible: { gt: 0 }
      };

      if (codigoInsumo) where.codigoInsumo = codigoInsumo;
      if (lote) where.lote = { contains: lote, mode: 'insensitive' };
      if (codigoPresentacion) where.codigoPresentacion = codigoPresentacion;

      const inventario = await this.prisma.inventario.findMany({
        where,
        orderBy: [
          { codigoInsumo: 'asc' },
          { fechaVencimiento: 'asc' }
        ]
      });

      // Agrupar por producto
      const productosMap = new Map<number, ExistenciasResponse>();

      inventario.forEach(item => {
        const key = item.codigoInsumo;
        
        if (!productosMap.has(key)) {
          productosMap.set(key, {
            codigoInsumo: item.codigoInsumo,
            nombreInsumo: item.nombreInsumo,
            caracteristicas: item.caracteristicas,
            presentacion: item.presentacion,
            unidadMedida: item.unidadMedida,
            existenciaTotal: 0,
            lotes: []
          });
        }

        const producto = productosMap.get(key)!;
        producto.existenciaTotal += item.cantidadDisponible;

        // Calcular días para vencer
        let diasParaVencer: number | undefined;
        if (item.fechaVencimiento) {
          const hoy = new Date();
          const fechaVenc = new Date(item.fechaVencimiento);
          diasParaVencer = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        }

        producto.lotes.push({
          lote: item.lote,
          cartaCompromiso: item.cartaCompromiso ?? false,
          mesesDevolucion: item.mesesDevolucion ?? null,
          observacionesDevolucion: item.observacionesDevolucion ?? null,
          fechaVencimiento: item.fechaVencimiento,
          cantidad: item.cantidadDisponible,
          precioUnitario: Number(item.precioUnitario),
          diasParaVencer
        });
      });

      return Array.from(productosMap.values());

    } catch (error) {
      this.logger.error(`Error al obtener existencias: ${error.message}`);
      throw new HttpException(
        `Error al obtener existencias: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtener historial de movimientos de inventario
   */
  async getHistorial(query: InventarioHistorialQueryDto) {
    try {
      const {
        page = 1,
        limit = 20,
        idInventario,
        codigoInsumo,
        lote,
        tipoMovimiento,
        modulo,
        fechaDesde,
        fechaHasta,
        idUsuario
      } = query;

      const skip = (page - 1) * limit;

      const where: any = {};

      if (idInventario) where.idInventario = idInventario;
      if (codigoInsumo) where.CatalogoInsumos = { codigoInsumo };
      if (lote) where.lote = { contains: lote, mode: 'insensitive' };
      if (tipoMovimiento) where.tipoMovimiento = tipoMovimiento;
      if (modulo) where.modulo = modulo;
      if (idUsuario) where.idUsuario = idUsuario;

      if (fechaDesde || fechaHasta) {
        where.fechaMovimiento = {};
        if (fechaDesde) where.fechaMovimiento.gte = new Date(fechaDesde);
        if (fechaHasta) where.fechaMovimiento.lte = new Date(fechaHasta);
      }

      const [historial, total] = await Promise.all([
        this.prisma.historialInventario.findMany({
          where,
          skip,
          take: limit,
          include: {
            CatalogoInsumos: {
              select: {
                codigoInsumo: true,
                nombreInsumo: true,
                nombrePresentacion: true
              }
            },
            Usuarios: {
              select: {
                nombres: true,
                apellidos: true
              }
            },
            IngresoCompras: {
              select: {
                numeroFactura: true,
                serieFactura: true,
                proveedor: true
              }
            },
            Despachos: {
              select: {
                Servicios: {
                  select: {
                    nombre: true
                  }
                }
              }
            },
            Reajustes: {
              select: {
                referenciaDocumento: true
              }
            }
          },
          orderBy: { fechaMovimiento: 'desc' }
        }),
        this.prisma.historialInventario.count({ where })
      ]);

      const data: HistorialInventarioResponse[] = historial.map(item => {
        const response: HistorialInventarioResponse = {
          idHistorial: item.idHistorial,
          lote: item.lote,
          fechaVencimiento: item.fechaVencimiento,
          cantidad: item.cantidad,
          tipoMovimiento: item.tipoMovimiento,
          modulo: item.modulo,
          fechaMovimiento: item.fechaMovimiento,
          catalogoInsumos: {
            codigoInsumo: item.CatalogoInsumos.codigoInsumo,
            nombreInsumo: item.CatalogoInsumos.nombreInsumo,
            presentacion: item.CatalogoInsumos.nombrePresentacion
          },
          usuario: {
            nombres: item.Usuarios.nombres,
            apellidos: item.Usuarios.apellidos
          }
        };

        // Agregar información de referencia según el módulo
        if (item.IngresoCompras) {
          response.referencia = {
            numeroFactura: item.IngresoCompras.numeroFactura,
            serieFactura: item.IngresoCompras.serieFactura,
            proveedor: item.IngresoCompras.proveedor
          };
        }

        if (item.Despachos?.Servicios) {
          response.referencia = {
            ...response.referencia,
            servicio: item.Despachos.Servicios.nombre
          };
        }

        if (item.Reajustes) {
          response.referencia = {
            ...response.referencia,
            referenciaDocumento: item.Reajustes.referenciaDocumento
          };
        }

        return response;
      });

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.error(`Error al obtener historial: ${error.message}`);
      throw new HttpException(
        `Error al obtener historial: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtener resumen general del inventario
   */
  async getResumen(): Promise<ResumenInventarioResponse> {
    try {
      const [
        totalItems,
        valorTotal,
        itemsProximosVencer,
        itemsStockBajo,
        totalLotes
      ] = await Promise.all([
        // Total de items en inventario con stock
        this.prisma.inventario.count({
          where: { cantidadDisponible: { gt: 0 } }
        }),
        
        // Valor total del inventario
        this.prisma.inventario.aggregate({
          where: { cantidadDisponible: { gt: 0 } },
          _sum: { precioTotal: true }
        }),
        
        // Items próximos a vencer (30 días)
        this.prisma.inventario.count({
          where: {
            cantidadDisponible: { gt: 0 },
            fechaVencimiento: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              gte: new Date()
            }
          }
        }),
        
        // Items con stock bajo (menos de 10)
        this.prisma.inventario.count({
          where: {
            cantidadDisponible: { lt: 10, gt: 0 }
          }
        }),
        
        // Total de lotes únicos
        this.prisma.inventario.groupBy({
          by: ['lote'],
          where: { cantidadDisponible: { gt: 0 } }
        })
      ]);

      return {
        totalItems,
        valorTotalInventario: Number(valorTotal._sum.precioTotal || 0),
        itemsProximosVencer,
        itemsStockBajo,
        totalLotes: totalLotes.length,
        ultimaActualizacion: new Date()
      };

    } catch (error) {
      this.logger.error(`Error al obtener resumen: ${error.message}`);
      throw new HttpException(
        `Error al obtener resumen: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtener alertas del inventario
   */
  async getAlertas(): Promise<AlertasInventarioResponse> {
    try {
      const hoy = new Date();
      const en30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const [productosVencidos, productosProximosVencer, productosStockBajo] = await Promise.all([
        // Productos vencidos
        this.prisma.inventario.findMany({
          where: {
            cantidadDisponible: { gt: 0 },
            fechaVencimiento: { lt: hoy }
          },
          select: {
            codigoInsumo: true,
            nombreInsumo: true,
            lote: true,
            fechaVencimiento: true,
            cantidadDisponible: true
          },
          orderBy: { fechaVencimiento: 'desc' }
        }),

        // Productos próximos a vencer
        this.prisma.inventario.findMany({
          where: {
            cantidadDisponible: { gt: 0 },
            fechaVencimiento: {
              gte: hoy,
              lte: en30Dias
            }
          },
          select: {
            codigoInsumo: true,
            nombreInsumo: true,
            lote: true,
            fechaVencimiento: true,
            cantidadDisponible: true
          },
          orderBy: { fechaVencimiento: 'asc' }
        }),

        // Productos con stock bajo
        this.prisma.inventario.findMany({
          where: {
            cantidadDisponible: { lt: 10, gt: 0 }
          },
          select: {
            codigoInsumo: true,
            nombreInsumo: true,
            cantidadDisponible: true
          },
          orderBy: { cantidadDisponible: 'asc' }
        })
      ]);

      return {
        productosVencidos: productosVencidos.map(item => ({
          codigoInsumo: item.codigoInsumo,
          nombreInsumo: item.nombreInsumo,
          lote: item.lote,
          fechaVencimiento: item.fechaVencimiento!,
          diasVencido: Math.ceil((hoy.getTime() - item.fechaVencimiento!.getTime()) / (1000 * 60 * 60 * 24)),
          cantidad: item.cantidadDisponible
        })),
        
        productosProximosVencer: productosProximosVencer.map(item => ({
          codigoInsumo: item.codigoInsumo,
          nombreInsumo: item.nombreInsumo,
          lote: item.lote,
          fechaVencimiento: item.fechaVencimiento!,
          diasParaVencer: Math.ceil((item.fechaVencimiento!.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)),
          cantidad: item.cantidadDisponible
        })),
        
        productosStockBajo: productosStockBajo.map(item => ({
          codigoInsumo: item.codigoInsumo,
          nombreInsumo: item.nombreInsumo,
          cantidadDisponible: item.cantidadDisponible,
          stockMinimo: 10 // Valor configurable
        }))
      };

    } catch (error) {
      this.logger.error(`Error al obtener alertas: ${error.message}`);
      throw new HttpException(
        `Error al obtener alertas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtener movimientos recientes
   */
  async getMovimientosRecientes(limit: number = 10): Promise<MovimientosRecientesResponse[]> {
    try {
      const movimientos = await this.prisma.historialInventario.findMany({
        take: limit,
        include: {
          CatalogoInsumos: {
            select: {
              nombreInsumo: true
            }
          },
          Usuarios: {
            select: {
              nombres: true,
              apellidos: true
            }
          }
        },
        orderBy: { fechaMovimiento: 'desc' }
      });

      return movimientos.map(item => ({
        fecha: item.fechaMovimiento,
        tipoMovimiento: item.tipoMovimiento,
        modulo: item.modulo,
        cantidad: item.cantidad,
        producto: item.CatalogoInsumos.nombreInsumo,
        lote: item.lote,
        usuario: `${item.Usuarios.nombres} ${item.Usuarios.apellidos}`
      }));

    } catch (error) {
      this.logger.error(`Error al obtener movimientos recientes: ${error.message}`);
      throw new HttpException(
        `Error al obtener movimientos recientes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}