import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDespachoDto } from '../dto/create-despacho.dto';
import {
  DetalleDespachoQueryDto,
  DisponibilidadDespachoQueryDto,
  ListDespachosQueryDto,
} from '../dto/despacho-query.dto';
import {
  DespachoListItem,
  DespachoResponse,
  DisponibilidadProductoResponse,
} from '../dto/despacho-response.dto';
import { obtenerRenglonesPermitidos } from '../../common/utils/renglones.util';

type DespachoWithRelations = Prisma.DespachoGetPayload<{
  include: {
    Servicios: true;
    Usuarios: {
      select: {
        idUsuario: true;
        nombres: true;
        apellidos: true;
      };
    };
    Detalles: {
      include: {
        Inventario: {
          select: {
            renglon: true;
          };
        };
        CatalogoInsumos: {
          select: {
            renglon: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class DespachosService {
  private readonly logger = new Logger(DespachosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDisponibilidad(
    query: DisponibilidadDespachoQueryDto,
  ): Promise<DisponibilidadProductoResponse[]> {
    try {
      const {
        codigoInsumo,
        lote,
        codigoPresentacion,
        idUsuario,
        renglones,
      } = query;
      const where: Prisma.InventarioWhereInput = {
        cantidadDisponible: { gt: 0 },
      };

      if (codigoInsumo) where.codigoInsumo = codigoInsumo;
      if (lote)
        where.lote = {
          contains: lote,
          mode: 'insensitive',
        };
      if (codigoPresentacion) where.codigoPresentacion = codigoPresentacion;

      let renglonesFiltrar: number[] = [];
      if (typeof renglones === 'string' && renglones.trim()) {
        renglonesFiltrar = renglones
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value) && value > 0);
      }

      if (!renglonesFiltrar.length && idUsuario) {
        renglonesFiltrar = await obtenerRenglonesPermitidos(
          this.prisma,
          idUsuario,
        );
      }

      if (idUsuario && renglonesFiltrar.length === 0) {
        return [];
      }

      if (renglonesFiltrar.length) {
        where.renglon = { in: renglonesFiltrar };
      }

      const inventario = await this.prisma.inventario.findMany({
        where,
        orderBy: [
          { codigoInsumo: 'asc' },
          { fechaVencimiento: 'asc' },
          { idInventario: 'asc' },
        ],
      });

      const map = new Map<number, DisponibilidadProductoResponse>();

      for (const item of inventario) {
        if (!map.has(item.codigoInsumo)) {
          map.set(item.codigoInsumo, {
            codigoInsumo: item.codigoInsumo,
            nombreInsumo: item.nombreInsumo,
            caracteristicas: item.caracteristicas,
            presentacion: item.presentacion,
            unidadMedida: item.unidadMedida,
            existenciaTotal: 0,
            lotes: [],
          });
        }

        const producto = map.get(item.codigoInsumo)!;
        producto.existenciaTotal += item.cantidadDisponible;
        producto.lotes.push({
          idInventario: item.idInventario,
          lote: item.lote,
          fechaVencimiento: item.fechaVencimiento,
          cantidad: item.cantidadDisponible,
          precioUnitario: Number(item.precioUnitario),
          cartaCompromiso: item.cartaCompromiso ?? false,
        });
      }

      return Array.from(map.values());
    } catch (error) {
      this.logger.error(
        `Error al consultar existencias para despachos: ${error.message}`,
      );
      throw new HttpException(
        `Error al consultar existencias: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(
    dto: CreateDespachoDto,
    idUsuario: number,
  ): Promise<DespachoResponse> {
    if (!dto.detalles?.length) {
      throw new BadRequestException(
        'Debe proporcionar al menos un detalle para crear el despacho',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const despacho = await tx.despacho.create({
        data: {
          idServicio: dto.idServicio ?? null,
          idUsuario,
          observaciones: dto.observaciones?.trim() ?? null,
          totalCantidad: 0,
          totalGeneral: new Prisma.Decimal(0),
        },
        include: {
          Servicios: true,
          Usuarios: true,
          Detalles: true,
        },
      });

      let totalCantidad = 0;
      let totalGeneral = new Prisma.Decimal(0);

      for (let index = 0; index < dto.detalles.length; index++) {
        const detalle = dto.detalles[index];

        const filtrosInventario: Prisma.InventarioWhereInput = {
          codigoInsumo: detalle.codigoInsumo,
          cantidadDisponible: { gt: 0 },
        };
        if (detalle.codigoPresentacion) {
          filtrosInventario.codigoPresentacion = detalle.codigoPresentacion;
        }

        const inventarios = await tx.inventario.findMany({
          where: filtrosInventario,
          include: {
            IngresoCompras: true,
            IngresoComprasLotes: {
              include: { IngresoComprasDetalle: true },
            },
          },
          orderBy: [{ fechaVencimiento: 'asc' }, { idInventario: 'asc' }],
        });

        if (!inventarios.length) {
          throw new BadRequestException(
            `No existen lotes disponibles para el producto ${detalle.codigoInsumo}`,
          );
        }

        let pendiente = detalle.cantidad;

        for (const lote of inventarios) {
          if (pendiente <= 0) break;

          if (lote.cantidadDisponible <= 0) continue;

          const cantidadDespachar = Math.min(
            lote.cantidadDisponible,
            pendiente,
          );

          pendiente -= cantidadDespachar;

          const nuevaCantidad = lote.cantidadDisponible - cantidadDespachar;
          const precioUnitario = new Prisma.Decimal(lote.precioUnitario);
          const subtotal = precioUnitario.mul(cantidadDespachar);

          await tx.inventario.update({
            where: { idInventario: lote.idInventario },
            data: {
              cantidadDisponible: nuevaCantidad,
              precioTotal: precioUnitario.mul(nuevaCantidad),
            },
          });

          const idCatalogoInsumos =
            detalle.idCatalogoInsumos ??
            lote.IngresoComprasLotes?.IngresoComprasDetalle
              ?.idCatalogoInsumos ??
            null;

          await tx.despachoDetalle.create({
            data: {
              idDespacho: despacho.idDespacho,
              idInventario: lote.idInventario,
              idCatalogoInsumos,
              idIngresoCompras: lote.idIngresoCompras ?? null,
              codigoInsumo: lote.codigoInsumo,
              nombreInsumo: lote.nombreInsumo,
              caracteristicas: lote.caracteristicas,
              codigoPresentacion: lote.codigoPresentacion,
              presentacion: lote.presentacion,
              unidadMedida: lote.unidadMedida,
              lote: lote.lote,
              fechaVencimiento: lote.fechaVencimiento ?? null,
              cantidad: cantidadDespachar,
              precioUnitario,
              precioTotal: subtotal,
            },
          });

          await tx.historialInventario.create({
            data: {
              idCatalogoInsumos,
              idInventario: lote.idInventario,
              idIngresoCompras: lote.idIngresoCompras ?? null,
              idDespacho: despacho.idDespacho,
              cantidad: cantidadDespachar,
              tipoMovimiento: 'SALIDA',
              modulo: 'DESPACHOS',
              idUsuario,
              lote: lote.lote,
              fechaVencimiento: lote.fechaVencimiento ?? null,
            },
          });

          totalCantidad += cantidadDespachar;
          totalGeneral = totalGeneral.add(subtotal);
        }

        if (pendiente > 0) {
          throw new BadRequestException(
            `Inventario insuficiente para el producto ${detalle.codigoInsumo}. Faltan ${pendiente} unidades para completar el despacho (detalle #${index + 1}).`,
          );
        }
      }

      if (totalCantidad === 0) {
        throw new BadRequestException(
          'No se pudo registrar el despacho porque todas las cantidades fueron 0',
        );
      }

      const codigoDespacho = `DESP-${despacho.idDespacho
        .toString()
        .padStart(6, '0')}`;

      const despachoActualizado = await tx.despacho.update({
        where: { idDespacho: despacho.idDespacho },
        data: {
          totalCantidad,
          totalGeneral,
          codigoDespacho,
        },
        include: {
          Servicios: true,
          Usuarios: {
            select: {
              idUsuario: true,
              nombres: true,
              apellidos: true,
            },
          },
          Detalles: {
            orderBy: { idDespachoDetalle: 'asc' },
            include: {
              Inventario: {
                select: {
                  renglon: true,
                },
              },
              CatalogoInsumos: {
                select: {
                  renglon: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `Despacho ${codigoDespacho} creado con ${dto.detalles.length} líneas solicitadas y ${despachoActualizado.Detalles.length} lotes consumidos`,
      );

      return this.mapDespacho(despachoActualizado as DespachoWithRelations);
    });
  }

  async findAll(query: ListDespachosQueryDto): Promise<{
    data: DespachoListItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      codigo,
      fechaDesde,
      fechaHasta,
      idServicio,
      idUsuario,
      idUsuarioCreador,
      anio,
      renglones,
      buscar,
    } = query;

    const where: Prisma.DespachoWhereInput = {};

    if (codigo) {
      where.codigoDespacho = { contains: codigo, mode: 'insensitive' };
    }

  if (idServicio) where.idServicio = idServicio;
  if (idUsuarioCreador) where.idUsuario = idUsuarioCreador;

    const anioObjetivo =
      typeof anio === 'number' && Number.isFinite(anio)
        ? anio
        : new Date().getFullYear();
    const fechaInicioAnio = new Date(anioObjetivo, 0, 1);
    const fechaFinAnio = new Date(anioObjetivo, 11, 31, 23, 59, 59, 999);

    const fechaInicio = fechaDesde ? new Date(fechaDesde) : fechaInicioAnio;
    const fechaFin = fechaHasta ? new Date(fechaHasta) : fechaFinAnio;
    where.fechaDespacho = { gte: fechaInicio, lte: fechaFin };

    let renglonesFiltrar: number[] = [];
    if (typeof renglones === 'string' && renglones.trim()) {
      renglonesFiltrar = renglones
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
    }

    if (!renglonesFiltrar.length && idUsuario) {
      renglonesFiltrar = await obtenerRenglonesPermitidos(
        this.prisma,
        idUsuario,
      );
    }

    if (idUsuario && renglonesFiltrar.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    if (renglonesFiltrar.length) {
      where.Detalles = {
        some: {
          Inventario: {
            renglon: { in: renglonesFiltrar },
          },
        },
      };
    }

    if (buscar) {
      where.OR = [
        { codigoDespacho: { contains: buscar, mode: 'insensitive' } },
        {
          Servicios: {
            nombre: { contains: buscar, mode: 'insensitive' },
          },
        },
        {
          Usuarios: {
            OR: [
              { nombres: { contains: buscar, mode: 'insensitive' } },
              { apellidos: { contains: buscar, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [despachos, total] = await Promise.all([
      this.prisma.despacho.findMany({
        where,
        skip,
        take: limit,
        include: {
          Servicios: { select: { nombre: true } },
          Usuarios: { select: { nombres: true, apellidos: true } },
          Detalles: {
            select: {
              Inventario: {
                select: {
                  renglon: true,
                },
              },
              CatalogoInsumos: {
                select: {
                  renglon: true,
                },
              },
            },
          },
          _count: { select: { Detalles: true } },
        },
        orderBy: { fechaDespacho: 'desc' },
      }),
      this.prisma.despacho.count({ where }),
    ]);

    const data: DespachoListItem[] = despachos.map((item) => {
      const renglonesSet = new Set<number>();
      for (const detalle of item.Detalles) {
        const renglonDetalle =
          detalle.Inventario?.renglon ?? detalle.CatalogoInsumos?.renglon;
        if (typeof renglonDetalle === 'number' && Number.isFinite(renglonDetalle)) {
          renglonesSet.add(renglonDetalle);
        }
      }

      const renglones = Array.from(renglonesSet).sort((a, b) => a - b);

      return {
        idDespacho: item.idDespacho,
        codigoDespacho:
          item.codigoDespacho ??
          `DESP-${item.idDespacho.toString().padStart(6, '0')}`,
        fechaDespacho: item.fechaDespacho,
        servicio: item.Servicios?.nombre ?? null,
        usuario: `${item.Usuarios.nombres} ${item.Usuarios.apellidos}`.trim(),
        totalCantidad: item.totalCantidad,
        totalGeneral: Number(item.totalGeneral),
        totalItems: item._count.Detalles,
        renglones,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    idDespacho: number,
    query?: DetalleDespachoQueryDto,
  ): Promise<DespachoResponse> {
    const despacho = await this.prisma.despacho.findUnique({
      where: { idDespacho },
      include: {
        Servicios: true,
        Usuarios: {
          select: {
            idUsuario: true,
            nombres: true,
            apellidos: true,
          },
        },
        Detalles: {
          orderBy: { idDespachoDetalle: 'asc' },
          include: {
            Inventario: {
              select: {
                renglon: true,
              },
            },
            CatalogoInsumos: {
              select: {
                renglon: true,
              },
            },
          },
        },
      },
    });

    if (!despacho) {
      throw new NotFoundException(
        `Despacho con ID ${idDespacho} no encontrado`,
      );
    }

    if (query?.idUsuario || query?.renglones) {
      const { idUsuario, renglones } = query;

      let renglonesFiltrar: number[] = [];
      if (typeof renglones === 'string' && renglones.trim()) {
        renglonesFiltrar = renglones
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value) && value > 0);
      }

      if (!renglonesFiltrar.length && idUsuario) {
        renglonesFiltrar = await obtenerRenglonesPermitidos(
          this.prisma,
          idUsuario,
        );
      }

      if (idUsuario && renglonesFiltrar.length === 0) {
        throw new NotFoundException(
          `Despacho con ID ${idDespacho} no encontrado`,
        );
      }

      if (renglonesFiltrar.length) {
        const renglonesDespacho = new Set<number>();

        for (const detalle of despacho.Detalles) {
          const renglonDetalle =
            detalle.Inventario?.renglon ?? detalle.CatalogoInsumos?.renglon;
          if (typeof renglonDetalle === 'number' && renglonDetalle > 0) {
            renglonesDespacho.add(renglonDetalle);
          }
        }

        if (
          renglonesDespacho.size > 0 &&
          !Array.from(renglonesDespacho).every((renglon) =>
            renglonesFiltrar.includes(renglon),
          )
        ) {
          throw new NotFoundException(
            `Despacho con ID ${idDespacho} no encontrado`,
          );
        }
      }
    }

    return this.mapDespacho(despacho as DespachoWithRelations);
  }

  private mapDespacho(despacho: DespachoWithRelations): DespachoResponse {
    const renglonesSet = new Set<number>();

    for (const detalle of despacho.Detalles) {
      const renglonDetalle =
        detalle.Inventario?.renglon ?? detalle.CatalogoInsumos?.renglon;
      if (typeof renglonDetalle === 'number' && Number.isFinite(renglonDetalle)) {
        renglonesSet.add(renglonDetalle);
      }
    }

    const renglones = Array.from(renglonesSet).sort((a, b) => a - b);

    return {
      idDespacho: despacho.idDespacho,
      codigoDespacho:
        despacho.codigoDespacho ??
        `DESP-${despacho.idDespacho.toString().padStart(6, '0')}`,
      fechaDespacho: despacho.fechaDespacho,
      observaciones: despacho.observaciones,
      totalCantidad: despacho.totalCantidad,
      totalGeneral: Number(despacho.totalGeneral),
      renglones,
      servicio: despacho.Servicios
        ? {
            idServicio: despacho.Servicios.idServicio,
            nombre: despacho.Servicios.nombre,
          }
        : null,
      usuario: {
        idUsuario: despacho.Usuarios.idUsuario,
        nombres: despacho.Usuarios.nombres,
        apellidos: despacho.Usuarios.apellidos,
      },
      detalles: despacho.Detalles.map((detalle) => ({
        idDespachoDetalle: detalle.idDespachoDetalle,
        idInventario: detalle.idInventario,
        codigoInsumo: detalle.codigoInsumo,
        nombreInsumo: detalle.nombreInsumo,
        caracteristicas: detalle.caracteristicas,
        codigoPresentacion: detalle.codigoPresentacion ?? null,
        presentacion: detalle.presentacion ?? null,
        unidadMedida: detalle.unidadMedida ?? null,
        lote: detalle.lote ?? null,
        fechaVencimiento: detalle.fechaVencimiento ?? null,
        cantidad: detalle.cantidad,
        precioUnitario: Number(detalle.precioUnitario),
        precioTotal: Number(detalle.precioTotal),
      })),
    };
  }
}
