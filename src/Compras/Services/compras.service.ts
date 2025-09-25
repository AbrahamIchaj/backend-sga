import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCompraDto,
  CreateCompraDetalleDto,
  CreateCompraLoteDto,
} from '../dto/create-compra.dto';
import { UpdateCompraDto } from '../dto/update-compra.dto';

@Injectable()
export class ComprasService {
  private readonly logger = new Logger(ComprasService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompraDto, idUsuario: number) {
    if (!dto.detalles?.length) {
      throw new BadRequestException(
        'La compra debe incluir al menos un detalle',
      );
    }

    dto.detalles.forEach((d, idx) => {
      const totalLotes =
        d.lotes?.reduce((acc, l) => acc + (l.cantidad || 0), 0) || 0;
      if (totalLotes !== d.cantidadTotal) {
        throw new BadRequestException(
          `La suma de lotes (${totalLotes}) no coincide con cantidadTotal (${d.cantidadTotal}) en detalle #${idx + 1}`,
        );
      }
    });

    // Transacción
    return await this.prisma.$transaction(async (tx) => {
      // 1) Crear cabecera de IngresoCompras
      const ingreso = await tx.ingresoCompras.create({
        data: {
          numeroFactura: String(dto.numeroFactura),
          serieFactura: dto.serieFactura.trim(),
          tipoCompra: dto.tipoCompra.trim(),
          fechaIngreso: new Date(dto.fechaIngreso),
          proveedor: dto.proveedor.trim(),
          ordenCompra: dto.ordenCompra,
          programa: dto.programa,
          numero1h: dto.numero1h,
          noKardex: dto.noKardex,
        },
      });

      let totalFactura = 0;

      // Debug: log detalles recibidos
      this.logger.debug(
        `Detalles recibidos (count=${dto.detalles.length}): ${JSON.stringify(dto.detalles.map((d) => ({ idCatalogoInsumos: d.idCatalogoInsumos })))}`,
      );

      for (const det of dto.detalles) {
        totalFactura += Number(det.precioTotalFactura || 0);

        const detalle = await tx.ingresoComprasDetalle.create({
          data: {
            idIngresoCompras: ingreso.idIngresoCompras,
            idCatalogoInsumos: det.idCatalogoInsumos,
            renglon: det.renglon,
            codigoInsumo: det.codigoInsumo,
            nombreInsumo: det.nombreInsumo,
            caracteristicas: det.caracteristicas,
            codigoPresentacion: det.codigoPresentacion,
            presentacion: det.presentacion,
            cantidadTotal: det.cantidadTotal,
            precioUnitario: new Prisma.Decimal(det.precioUnitario),
            precioTotalFactura: new Prisma.Decimal(det.precioTotalFactura),
            // nota: campo cartaCompromiso eliminado de IngresoComprasDetalle (persistido sólo en lotes)
            observaciones: det.observaciones ?? null,
          },
        });

        for (const lote of det.lotes) {
          const dataForLote: any = {
            idIngresoComprasDetalle: detalle.idIngresoComprasDetalle,
            cantidad: lote.cantidad,
            lote: lote.lote?.trim() || null,
            fechaVencimiento: lote.fechaVencimiento
              ? new Date(lote.fechaVencimiento)
              : null,
            mesesDevolucion: lote.mesesDevolucion || null,
            observacionesDevolucion:
              lote.observacionesDevolucion?.trim() || null,
            // Normalizar cartaCompromiso por lote (acepta 1/0, '1', true, false)
            cartaCompromiso: (() => {
              const v: any = lote.cartaCompromiso;
              if (v === null || v === undefined) return false;
              if (typeof v === 'boolean') return v;
              if (typeof v === 'number') return v === 1;
              if (typeof v === 'string')
                return v === '1' || v.toLowerCase() === 'true';
              return Boolean(v);
            })(),
          };

          const loteCreado = await tx.ingresoComprasLotes.create({
            data: dataForLote,
          });

          const inv = await tx.inventario.create({
            data: {
              idIngresoCompras: ingreso.idIngresoCompras,
              idIngresoComprasLotes: loteCreado.idIngresoComprasLotes,
              renglon: detalle.renglon,
              codigoInsumo: detalle.codigoInsumo,
              nombreInsumo: detalle.nombreInsumo,
              caracteristicas: detalle.caracteristicas,
              codigoPresentacion: detalle.codigoPresentacion,
              presentacion: detalle.presentacion,
              unidadMedida:
                (await this.getUnidadMedida(tx, det.idCatalogoInsumos)) ||
                'UNIDAD',
              lote: loteCreado.lote || 'SIN-LOTE',
              fechaVencimiento: loteCreado.fechaVencimiento,
              cartaCompromiso: loteCreado.cartaCompromiso,
              mesesDevolucion: loteCreado.mesesDevolucion,
              observacionesDevolucion: loteCreado.observacionesDevolucion,
              cantidadDisponible: loteCreado.cantidad,
              precioUnitario: new Prisma.Decimal(det.precioUnitario),
              precioTotal: new Prisma.Decimal(
                Number(det.precioUnitario) * loteCreado.cantidad,
              ),
            },
          });
        }
      }

      return { idIngresoCompras: ingreso.idIngresoCompras, totalFactura };
    });
  }

  async getUnidadMedida(
    tx: Prisma.TransactionClient,
    idCatalogoInsumos: number,
  ): Promise<string> {
    const insumo = await tx.catalogoInsumos.findUnique({
      where: { idCatalogoInsumos },
      select: { unidadMedida: true },
    });
    return insumo?.unidadMedida || '';
  }

  async findOne(id: number) {
    const compra = await this.prisma.ingresoCompras.findUnique({
      where: { idIngresoCompras: id },
      include: {
        IngresoComprasDetalle: {
          include: { IngresoComprasLotes: true },
        },
      },
    });
    if (!compra) throw new NotFoundException(`Compra ${id} no encontrada`);
    return compra;
  }

  // Obtener compra por ID con todos los detalles y lotes completos
  async findOneWithDetails(id: number) {
    const compra = await this.prisma.ingresoCompras.findUnique({
      where: { idIngresoCompras: id },
      include: {
        IngresoComprasDetalle: {
          include: {
            IngresoComprasLotes: true,
            CatalogoInsumos: {
              select: {
                idCatalogoInsumos: true,
                nombreInsumo: true,
                caracteristicas: true,
                nombrePresentacion: true,
                unidadMedida: true,
                codigoInsumo: true,
                codigoPresentacion: true,
                renglon: true,
              },
            },
          },
          orderBy: { renglon: 'asc' },
        },
      },
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    // Calcular totales
    const totalItems = compra.IngresoComprasDetalle.length;
    const totalCantidad = compra.IngresoComprasDetalle.reduce(
      (sum, detalle) => sum + detalle.cantidadTotal,
      0,
    );
    const totalFactura = compra.IngresoComprasDetalle.reduce(
      (sum, detalle) => sum + Number(detalle.precioTotalFactura),
      0,
    );

    return {
      ...compra,
      totalItems,
      totalCantidad,
      totalFactura,
      // Agregar información de productos sin lote vs con lote
      resumenLotes: compra.IngresoComprasDetalle.map((detalle) => ({
        idDetalle: detalle.idIngresoComprasDetalle,
        nombreInsumo: detalle.nombreInsumo,
        cantidadTotal: detalle.cantidadTotal,
        lotes: detalle.IngresoComprasLotes.map((lote) => ({
          ...lote,
          tieneVencimiento: !!lote.fechaVencimiento,
          tieneDevolucion: !!lote.mesesDevolucion,
          fechaNotificacion:
            lote.fechaVencimiento && lote.mesesDevolucion
              ? new Date(
                  new Date(lote.fechaVencimiento).setMonth(
                    new Date(lote.fechaVencimiento).getMonth() -
                      lote.mesesDevolucion,
                  ),
                )
              : null,
        })),
      })),
    };
  }

  async findAll(params: {
    proveedor?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const { proveedor, desde, hasta, page = 1, limit = 20 } = params;
    const where: Prisma.IngresoComprasWhereInput = {};
    if (proveedor)
      where.proveedor = { contains: proveedor, mode: 'insensitive' };
    if (desde || hasta) {
      where.fechaIngreso = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      } as any;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.ingresoCompras.findMany({
        where,
        // Cambiado para ordenar desde la primera compra (más antigua) hasta la última (más reciente)
        orderBy: { fechaIngreso: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { IngresoComprasDetalle: true },
      }),
      this.prisma.ingresoCompras.count({ where }),
    ]);

    const resumen = data.map((c) => ({
      idIngresoCompras: c.idIngresoCompras,
      fechaIngreso: c.fechaIngreso,
      proveedor: c.proveedor,
      numeroFactura: c.numeroFactura,
      serieFactura: c.serieFactura,
      tipoCompra: c.tipoCompra,
      ordenCompra: c.ordenCompra,
      programa: c.programa,
      numero1h: c.numero1h,
      noKardex: c.noKardex,
      totalItems: c.IngresoComprasDetalle.length,
      totalCantidad: c.IngresoComprasDetalle.reduce(
        (acc, d) => acc + d.cantidadTotal,
        0,
      ),
      totalFactura: c.IngresoComprasDetalle.reduce(
        (acc, d) => acc + Number(d.precioTotalFactura),
        0,
      ),
    }));

    return { data: resumen, total, page, limit };
  }

  async update(id: number, dto: UpdateCompraDto) {
    const compra = await this.prisma.ingresoCompras.update({
      where: { idIngresoCompras: id },
      data: {
        ...(dto.numeroFactura !== undefined && {
          numeroFactura: String(dto.numeroFactura),
        }),
        ...(dto.serieFactura !== undefined && {
          serieFactura: dto.serieFactura,
        }),
        ...(dto.tipoCompra !== undefined && { tipoCompra: dto.tipoCompra }),
        ...(dto.fechaIngreso !== undefined && {
          fechaIngreso: new Date(dto.fechaIngreso),
        }),
        ...(dto.proveedor !== undefined && { proveedor: dto.proveedor }),
        ...(dto.ordenCompra !== undefined && { ordenCompra: dto.ordenCompra }),
        ...(dto.programa !== undefined && { programa: dto.programa }),
        ...(dto.numero1h !== undefined && { numero1h: dto.numero1h }),
        ...(dto.noKardex !== undefined && { noKardex: dto.noKardex }),
      },
    });
    return compra;
  }

  // Anular compra
  async anular(id: number, idUsuario: number, motivo: string) {
    return await this.prisma.$transaction(async (tx) => {
      const compra = await tx.ingresoCompras.findUnique({
        where: { idIngresoCompras: id },
        include: {
          IngresoComprasDetalle: { include: { IngresoComprasLotes: true } },
          Inventario: true,
        },
      });
      if (!compra) throw new NotFoundException(`Compra ${id} no encontrada`);

      const idsInventario = compra.Inventario.map((i) => i.idInventario);

      // No permitir anular si existen despachos asociados
      const countDespachos =
        idsInventario.length > 0
          ? await tx.despachos.count({
              where: { idInventario: { in: idsInventario } },
            })
          : 0;
      if (countDespachos > 0) {
        throw new BadRequestException(
          'No se puede anular: existen despachos asociados a su inventario',
        );
      }

      // No permitir anular si existen reajustes que referencien inventario
      const countReajustes =
        idsInventario.length > 0
          ? await tx.reajusteDetalle.count({
              where: { idInventario: { in: idsInventario } },
            })
          : 0;
      if (countReajustes > 0) {
        throw new BadRequestException(
          'No se puede anular: existen reajustes que referencian el inventario de esta compra',
        );
      }

      // Borrar historial de inventario asociado a esta compra (opcional según política)
      await tx.historialInventario.deleteMany({
        where: { idIngresoCompras: id },
      });

      // Borrar registros de inventario relacionados a esta compra
      if (idsInventario.length > 0) {
        await tx.inventario.deleteMany({
          where: { idInventario: { in: idsInventario } },
        });
      }

      // Borrar lotes y detalles
      const detalleIds = compra.IngresoComprasDetalle.map(
        (d) => d.idIngresoComprasDetalle,
      );
      if (detalleIds.length > 0) {
        // Borrar lotes
        await tx.ingresoComprasLotes.deleteMany({
          where: { idIngresoComprasDetalle: { in: detalleIds } },
        });
        // Borrar detalles
        await tx.ingresoComprasDetalle.deleteMany({
          where: { idIngresoCompras: id },
        });
      }

      // Finalmente borrar la cabecera de la compra
      await tx.ingresoCompras.delete({ where: { idIngresoCompras: id } });

      return {
        message: `Compra ${id} eliminada y registros relacionados removidos. Motivo: ${motivo}`,
      };
    });
  }

  private async getIdCatalogoFromInventario(
    tx: Prisma.TransactionClient,
    idInventario: number,
  ): Promise<number> {
    const det = await tx.ingresoComprasDetalle.findFirst({
      where: {
        IngresoCompras: { Inventario: { some: { idInventario } } },
      },
      select: { idCatalogoInsumos: true },
    });
    return det?.idCatalogoInsumos || 0;
  }
}
