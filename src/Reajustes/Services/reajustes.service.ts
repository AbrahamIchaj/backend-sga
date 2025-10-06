import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CatalogoInsumos,
  HistorialInventario,
  Inventario,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  obtenerRenglonesPermitidos,
  validarRenglonPermitido,
} from '../../common/utils/renglones.util';
import {
  CreateReajusteDto,
  CreateReajusteDetalleDto,
} from '../dto/create-reajuste.dto';
import { ListReajustesQueryDto } from '../dto/reajuste-query.dto';

type Tx = PrismaClient | Prisma.TransactionClient;

interface DetalleContext {
  inventario: Inventario | null;
  catalogo: CatalogoInsumos | null;
  renglon: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion?: number | null;
  presentacion?: string | null;
  unidadMedida?: string | null;
  lote?: string | null;
  fechaVencimiento?: Date | null;
  cartaCompromiso: boolean;
  mesesDevolucion?: number | null;
  observacionesDevolucion?: string | null;
  idCatalogoInsumos?: number | null;
  precioUnitario: number;
  noKardex: number | null;
}

@Injectable()
export class ReajustesService {
  private readonly logger = new Logger(ReajustesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReajusteDto, idUsuario: number) {
    if (!idUsuario) {
      throw new BadRequestException('idUsuario es requerido');
    }

    if (!dto?.detalles?.length) {
      throw new BadRequestException(
        'El reajuste debe contener al menos un detalle',
      );
    }

    if (![1, 2].includes(dto.tipoReajuste)) {
      throw new BadRequestException(
        'tipoReajuste inválido. Valores permitidos: 1 (entrada) o 2 (salida)',
      );
    }

    const fechaReajuste = dto.fechaReajuste
      ? new Date(dto.fechaReajuste)
      : new Date();

    const renglonesPermitidos = await obtenerRenglonesPermitidos(
      this.prisma,
      idUsuario,
    );

    if (!renglonesPermitidos.length) {
      throw new BadRequestException(
        'El usuario no tiene renglones autorizados para registrar reajustes',
      );
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const reajuste = await tx.reajustes.create({
        data: {
          fechaReajuste,
          tipoReajuste: dto.tipoReajuste,
          referenciaDocumento: dto.referenciaDocumento.trim(),
          observaciones: dto.observaciones?.trim() || null,
          idUsuario,
        },
      });

      for (let index = 0; index < dto.detalles.length; index++) {
        const detalleDto = dto.detalles[index];

        if (!detalleDto.cantidad || detalleDto.cantidad <= 0) {
          throw new BadRequestException(
            `La cantidad debe ser mayor a 0 en el detalle #${index + 1}`,
          );
        }

        const ctx = await this.resolveDetalleContext(tx, detalleDto);

        if (!validarRenglonPermitido(renglonesPermitidos, ctx.renglon)) {
          throw new BadRequestException(
            `No tienes permisos para operar con insumos del renglón ${
              ctx.renglon ?? 'desconocido'
            } (detalle #${index + 1})`,
          );
        }

        let inventario = ctx.inventario;
        const movimientoEsEntrada = dto.tipoReajuste === 1;
        const movimientoLabel = movimientoEsEntrada
          ? 'REAJUSTE_ENTRADA'
          : 'REAJUSTE_SALIDA';

        if (movimientoEsEntrada) {
          if (inventario) {
            const nuevoPrecioUnitario =
              detalleDto.precioUnitario ?? Number(inventario.precioUnitario);
            const precioUnitarioDecimal = new Prisma.Decimal(
              nuevoPrecioUnitario,
            );
            const nuevaCantidad =
              inventario.cantidadDisponible + detalleDto.cantidad;

            inventario = await tx.inventario.update({
              where: { idInventario: inventario.idInventario },
              data: {
                cantidadDisponible: nuevaCantidad,
                precioUnitario: precioUnitarioDecimal,
                precioTotal: new Prisma.Decimal(
                  nuevaCantidad * nuevoPrecioUnitario,
                ),
                lote: ctx.lote ?? inventario.lote,
                fechaVencimiento:
                  ctx.fechaVencimiento ?? inventario.fechaVencimiento,
                cartaCompromiso:
                  ctx.cartaCompromiso ?? inventario.cartaCompromiso,
                mesesDevolucion:
                  ctx.mesesDevolucion ?? inventario.mesesDevolucion,
                observacionesDevolucion:
                  ctx.observacionesDevolucion ??
                  inventario.observacionesDevolucion,
              },
            });
          } else {
            const nuevoPrecioUnitario = detalleDto.precioUnitario ?? 0;
            const nuevoNoKardex = ctx.noKardex ?? null;
            if (!nuevoNoKardex || Number.isNaN(nuevoNoKardex)) {
              throw new BadRequestException(
                `El campo noKardex es obligatorio para reajustes de entrada que generan nuevo inventario (detalle #${index + 1})`,
              );
            }
            const createData = {
              renglon: ctx.renglon,
              codigoInsumo: ctx.codigoInsumo,
              nombreInsumo: ctx.nombreInsumo,
              caracteristicas: ctx.caracteristicas,
              codigoPresentacion: ctx.codigoPresentacion ?? 0,
              presentacion: ctx.presentacion ?? 'SIN PRESENTACIÓN',
              unidadMedida: ctx.unidadMedida ?? 'UNIDAD',
              lote: ctx.lote ?? 'SIN-LOTE',
              fechaVencimiento: ctx.fechaVencimiento ?? null,
              cartaCompromiso: ctx.cartaCompromiso,
              mesesDevolucion: ctx.mesesDevolucion ?? null,
              observacionesDevolucion: ctx.observacionesDevolucion ?? null,
              cantidadDisponible: detalleDto.cantidad,
              precioUnitario: new Prisma.Decimal(nuevoPrecioUnitario),
              precioTotal: new Prisma.Decimal(
                detalleDto.cantidad * nuevoPrecioUnitario,
              ),
              noKardex: nuevoNoKardex,
            };

            inventario = await tx.inventario.create({
              data: createData as any,
            });
          }
        } else {
          if (!inventario) {
            throw new BadRequestException(
              `No se puede realizar un reajuste de salida sin asociar un inventario (detalle #${index + 1})`,
            );
          }

          if (inventario.cantidadDisponible < detalleDto.cantidad) {
            throw new BadRequestException(
              `Cantidad insuficiente en inventario (disponible ${inventario.cantidadDisponible}) en detalle #${index + 1}`,
            );
          }

          const nuevaCantidad =
            inventario.cantidadDisponible - detalleDto.cantidad;
          const precioUnit = Number(inventario.precioUnitario);

          inventario = await tx.inventario.update({
            where: { idInventario: inventario.idInventario },
            data: {
              cantidadDisponible: nuevaCantidad,
              precioTotal: new Prisma.Decimal(nuevaCantidad * precioUnit),
            },
          });
        }

        const detalleData: any = {
          idReajuste: reajuste.idReajuste,
          idInventario: inventario.idInventario,
          codigoInsumo: ctx.codigoInsumo,
          nombreInsumo: ctx.nombreInsumo,
          caracteristicas: ctx.caracteristicas,
          cantidad: detalleDto.cantidad,
          codigoPresentacion: ctx.codigoPresentacion ?? null,
          presentacion: ctx.presentacion ?? null,
          unidadMedida: ctx.unidadMedida ?? null,
          lote: ctx.lote ?? null,
          fechaVencimiento: ctx.fechaVencimiento ?? null,
          observaciones: detalleDto.observaciones?.trim() ?? null,
        };

        if (ctx.idCatalogoInsumos) {
          detalleData.idCatalogoInsumos = ctx.idCatalogoInsumos;
        }

        await tx.reajusteDetalle.create({ data: detalleData });

        const historialData: any = {
          idInventario: inventario.idInventario,
          idReajuste: reajuste.idReajuste,
          cantidad: detalleDto.cantidad,
          tipoMovimiento: movimientoLabel,
          modulo: 'REAJUSTES',
          idUsuario,
          idCatalogoInsumos: ctx.idCatalogoInsumos ?? null,
          idIngresoCompras: inventario.idIngresoCompras ?? null,
          lote: ctx.lote ?? inventario.lote ?? null,
          fechaVencimiento:
            ctx.fechaVencimiento ?? inventario.fechaVencimiento ?? null,
        };

        await tx.historialInventario.create({ data: historialData });
      }

      this.logger.log(
        `Reajuste ${reajuste.idReajuste} creado con ${dto.detalles.length} detalles`,
      );

      return { idReajuste: reajuste.idReajuste };
    });

    return this.findOne(resultado.idReajuste);
  }

  async remove(id: number, idUsuario: number) {
    if (!idUsuario) {
      throw new BadRequestException('idUsuario es requerido');
    }

    return this.prisma.$transaction(async (tx) => {
      const reajuste = await tx.reajustes.findUnique({
        where: { idReajuste: id },
        include: {
          ReajusteDetalle: {
            orderBy: { idReajusteDetalle: 'asc' },
          },
        },
      });

      if (!reajuste) {
        throw new NotFoundException(`Reajuste con ID ${id} no encontrado`);
      }

      const historiales = await tx.historialInventario.findMany({
        where: { idReajuste: id },
        orderBy: { idHistorial: 'asc' },
      });

      const historialesPorInventario = new Map<number, HistorialInventario[]>();
      historiales.forEach((historial) => {
        const lista =
          historialesPorInventario.get(historial.idInventario) ?? [];
        lista.push(historial);
        historialesPorInventario.set(historial.idInventario, lista);
      });

      const esEntrada = reajuste.tipoReajuste === 1;
      const inventariosParaPosibleBaja = new Set<number>();

      for (let index = 0; index < reajuste.ReajusteDetalle.length; index++) {
        const detalle = reajuste.ReajusteDetalle[index];
        if (!detalle.idInventario) {
          throw new BadRequestException(
            `El detalle #${index + 1} no tiene inventario asociado, no se puede revertir el reajuste`,
          );
        }

        const inventario = await tx.inventario.findUnique({
          where: { idInventario: detalle.idInventario },
        });

        if (!inventario) {
          throw new NotFoundException(
            `Inventario asociado al detalle #${index + 1} no encontrado`,
          );
        }

        const historialesDetalle =
          historialesPorInventario.get(detalle.idInventario) ?? [];

        if (historialesDetalle.length === 0) {
          throw new BadRequestException(
            `El inventario del detalle #${index + 1} no tiene historial asociado al reajuste`,
          );
        }

        const idsHistorialDetalle = historialesDetalle.map(
          (historial) => historial.idHistorial,
        );

        const fechaMovimientoLimite = historialesDetalle.reduce(
          (max, item) =>
            item.fechaMovimiento > max ? item.fechaMovimiento : max,
          historialesDetalle[0].fechaMovimiento,
        );

        const movimientosPosteriores = await tx.historialInventario.count({
          where: {
            idInventario: detalle.idInventario,
            idHistorial: { notIn: idsHistorialDetalle },
            fechaMovimiento: { gt: fechaMovimientoLimite },
          },
        });

        if (movimientosPosteriores > 0) {
          throw new BadRequestException(
            `No se puede eliminar el reajuste: el inventario del detalle #${index + 1} tiene movimientos posteriores`,
          );
        }

        const precioUnitarioDecimal = new Prisma.Decimal(
          inventario.precioUnitario,
        );
        let nuevaCantidad = inventario.cantidadDisponible;

        if (esEntrada) {
          nuevaCantidad = inventario.cantidadDisponible - detalle.cantidad;
          if (nuevaCantidad < 0) {
            throw new BadRequestException(
              `No se puede revertir el detalle #${index + 1} porque la cantidad disponible es menor a la registrada`,
            );
          }
          if (
            nuevaCantidad === 0 &&
            !inventario.idIngresoCompras &&
            !inventario.idIngresoComprasLotes
          ) {
            inventariosParaPosibleBaja.add(inventario.idInventario);
          }
        } else {
          nuevaCantidad = inventario.cantidadDisponible + detalle.cantidad;
        }

        const nuevoPrecioTotal = precioUnitarioDecimal.mul(nuevaCantidad);

        await tx.inventario.update({
          where: { idInventario: detalle.idInventario },
          data: {
            cantidadDisponible: nuevaCantidad,
            precioTotal: nuevoPrecioTotal,
          },
        });
      }

      await tx.reajusteDetalle.deleteMany({ where: { idReajuste: id } });
      await tx.historialInventario.deleteMany({ where: { idReajuste: id } });
      await tx.reajustes.delete({ where: { idReajuste: id } });

      for (const idInventario of inventariosParaPosibleBaja) {
        const [historialRestante, detallesRestantes, despachos] =
          await Promise.all([
            tx.historialInventario.count({ where: { idInventario } }),
            tx.reajusteDetalle.count({ where: { idInventario } }),
            tx.despachoDetalle.count({ where: { idInventario } }),
          ]);

        if (
          historialRestante === 0 &&
          detallesRestantes === 0 &&
          despachos === 0
        ) {
          await tx.inventario.delete({ where: { idInventario } });
        }
      }

      this.logger.log(
        `Reajuste ${id} eliminado por usuario ${idUsuario}. Detalles revertidos: ${reajuste.ReajusteDetalle.length}`,
      );

      return {
        message: `Reajuste ${id} eliminado y movimientos revertidos correctamente`,
      };
    });
  }

  async findAll(query: ListReajustesQueryDto) {
    const {
      page = 1,
      limit = 20,
      fechaDesde,
      fechaHasta,
      tipoReajuste,
      referencia,
      idUsuario,
    } = query;

    const where: Prisma.ReajustesWhereInput = {};

    if (tipoReajuste) where.tipoReajuste = Number(tipoReajuste);
    if (referencia)
      where.referenciaDocumento = { contains: referencia, mode: 'insensitive' };
    if (idUsuario) where.idUsuario = Number(idUsuario);
    if (fechaDesde || fechaHasta) {
      where.fechaReajuste = {};
      if (fechaDesde) where.fechaReajuste.gte = new Date(fechaDesde as string);
      if (fechaHasta) where.fechaReajuste.lte = new Date(fechaHasta as string);
    }

    const skip = (page - 1) * limit;

    const [reajustes, total] = await Promise.all([
      this.prisma.reajustes.findMany({
        where,
        skip,
        take: limit,
        include: {
          Usuarios: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          _count: {
            select: {
              ReajusteDetalle: true,
            },
          },
        },
        orderBy: { fechaReajuste: 'desc' },
      }),
      this.prisma.reajustes.count({ where }),
    ]);

    const data = await Promise.all(
      reajustes.map(async (reajuste) => {
        const totalCantidad = await this.prisma.reajusteDetalle.aggregate({
          where: { idReajuste: reajuste.idReajuste },
          _sum: { cantidad: true },
        });

        return {
          ...reajuste,
          usuarioNombre:
            `${reajuste.Usuarios.nombres} ${reajuste.Usuarios.apellidos}`.trim(),
          cantidadDetalles: reajuste._count.ReajusteDetalle,
          totalCantidad: totalCantidad._sum.cantidad || 0,
        };
      }),
    );

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

  async findOne(id: number) {
    const reajuste = await this.prisma.reajustes.findUnique({
      where: { idReajuste: id },
      include: {
        Usuarios: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        ReajusteDetalle: {
          include: {
            Inventario: {
              select: {
                idInventario: true,
                cantidadDisponible: true,
                lote: true,
                fechaVencimiento: true,
                precioUnitario: true,
                precioTotal: true,
                noKardex: true,
              },
            },
            CatalogoInsumos: {
              select: {
                idCatalogoInsumos: true,
                codigoInsumo: true,
                nombreInsumo: true,
                nombrePresentacion: true,
                unidadMedida: true,
              },
            },
          },
          orderBy: { idReajusteDetalle: 'asc' },
        },
      },
    });

    if (!reajuste) {
      throw new NotFoundException(`Reajuste con ID ${id} no encontrado`);
    }

    return {
      ...reajuste,
      usuarioNombre:
        `${reajuste.Usuarios.nombres} ${reajuste.Usuarios.apellidos}`.trim(),
    };
  }

  async buscarCatalogo(
    term: string,
    options?: { idUsuario?: number; renglones?: number[] },
  ) {
    if (!term) {
      return [];
    }

    const parsed = Number(term);
    const renglones = await this.resolverRenglones(options);

    if (Array.isArray(renglones) && renglones.length === 0) {
      return [];
    }

    const where: Prisma.CatalogoInsumosWhereInput = {
      OR: [
        { nombreInsumo: { contains: term, mode: 'insensitive' } },
        { caracteristicas: { contains: term, mode: 'insensitive' } },
        ...(Number.isNaN(parsed)
          ? []
          : [
              { codigoInsumo: parsed },
              { codigoPresentacion: parsed },
              { renglon: parsed },
            ]),
      ],
    };

    if (Array.isArray(renglones) && renglones.length > 0) {
      where.renglon = { in: renglones };
    }

    return this.prisma.catalogoInsumos.findMany({
      where,
      take: 15,
      orderBy: { nombreInsumo: 'asc' },
    });
  }

  private async resolveDetalleContext(
    tx: Tx,
    detalle: CreateReajusteDetalleDto,
  ): Promise<DetalleContext> {
    let catalogo: CatalogoInsumos | null = null;

    if (detalle.idCatalogoInsumos) {
      catalogo = await tx.catalogoInsumos.findUnique({
        where: { idCatalogoInsumos: detalle.idCatalogoInsumos },
      });
      if (!catalogo) {
        throw new NotFoundException(
          `Catálogo de insumos ${detalle.idCatalogoInsumos} no encontrado`,
        );
      }
    } else if (
      detalle.codigoInsumo !== undefined &&
      detalle.codigoInsumo !== null
    ) {
      catalogo = await tx.catalogoInsumos.findFirst({
        where: { codigoInsumo: detalle.codigoInsumo },
      });
    }

    const filtroCodigoPresentacion =
      detalle.codigoPresentacion ?? catalogo?.codigoPresentacion ?? undefined;
    const loteNormalizado = detalle.lote?.trim() || null;
    const codigoInsumo = detalle.codigoInsumo ?? catalogo?.codigoInsumo ?? 0;

    let inventario: Inventario | null = null;
    if (codigoInsumo !== undefined && codigoInsumo !== null) {
      const whereInventario: Prisma.InventarioWhereInput = {
        codigoInsumo,
      };

      if (filtroCodigoPresentacion !== undefined) {
        whereInventario.codigoPresentacion = filtroCodigoPresentacion;
      }

      if (loteNormalizado) {
        whereInventario.lote = loteNormalizado;
      }

      inventario = await tx.inventario.findFirst({
        where: whereInventario,
        orderBy: [{ fechaVencimiento: 'asc' }, { idInventario: 'asc' }],
      });
    }

    const nombreInsumo =
      detalle.nombreInsumo ??
      inventario?.nombreInsumo ??
      catalogo?.nombreInsumo;
    const caracteristicas =
      detalle.caracteristicas ??
      inventario?.caracteristicas ??
      catalogo?.caracteristicas;

    if (!nombreInsumo || !caracteristicas) {
      throw new BadRequestException(
        'Los detalles deben incluir al menos nombreInsumo y caracteristicas del producto',
      );
    }

    const renglon =
      detalle.renglon ?? inventario?.renglon ?? catalogo?.renglon ?? 0;
    const codigoPresentacion =
      detalle.codigoPresentacion ??
      inventario?.codigoPresentacion ??
      catalogo?.codigoPresentacion ??
      null;
    const presentacion =
      detalle.presentacion ??
      inventario?.presentacion ??
      catalogo?.nombrePresentacion ??
      null;
    const unidadMedida =
      detalle.unidadMedida ??
      inventario?.unidadMedida ??
      catalogo?.unidadMedida ??
      'UNIDAD';

    const fechaVencimiento = detalle.fechaVencimiento
      ? new Date(detalle.fechaVencimiento)
      : (inventario?.fechaVencimiento ?? null);

    const cartaCompromiso =
      detalle.cartaCompromiso ?? inventario?.cartaCompromiso ?? false;
    const mesesDevolucion =
      detalle.mesesDevolucion ?? inventario?.mesesDevolucion ?? null;
    const observacionesDevolucion =
      detalle.observacionesDevolucion ??
      inventario?.observacionesDevolucion ??
      null;

    const precioUnitario =
      detalle.precioUnitario ??
      (inventario ? Number(inventario.precioUnitario) : 0);

    const noKardexDetalle =
      detalle.noKardex !== undefined && detalle.noKardex !== null
        ? Number(detalle.noKardex)
        : null;
    const noKardex =
      inventario?.noKardex ??
      (noKardexDetalle !== null && !Number.isNaN(noKardexDetalle)
        ? noKardexDetalle
        : null);

    return {
      inventario,
      catalogo,
      renglon,
      codigoInsumo,
      nombreInsumo,
      caracteristicas,
      codigoPresentacion,
      presentacion,
      unidadMedida,
      lote: loteNormalizado,
      fechaVencimiento,
      cartaCompromiso,
      mesesDevolucion,
      observacionesDevolucion,
      idCatalogoInsumos:
        catalogo?.idCatalogoInsumos ?? detalle.idCatalogoInsumos ?? null,
      precioUnitario,
      noKardex,
    };
  }

  private async resolverRenglones(
    options?: { idUsuario?: number; renglones?: number[] },
  ): Promise<number[] | null> {
    if (!options) {
      return null;
    }

    if (options.renglones && options.renglones.length > 0) {
      return options.renglones;
    }

    if (options.idUsuario) {
      const permitidos = await obtenerRenglonesPermitidos(
        this.prisma,
        options.idUsuario,
      );
      return permitidos.length ? permitidos : [];
    }

    return null;
  }
}
