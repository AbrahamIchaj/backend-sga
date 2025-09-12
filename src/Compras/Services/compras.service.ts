import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCompraDto, CreateCompraDetalleDto, CreateCompraLoteDto } from '../dto/create-compra.dto';
import { UpdateCompraDto } from '../dto/update-compra.dto';

@Injectable()
export class ComprasService {
  private readonly logger = new Logger(ComprasService.name);

  constructor(private prisma: PrismaService) {}

  // Crear compra completa con detalles y lotes, impactando inventario e historial
  async create(dto: CreateCompraDto, idUsuario: number) {
    // Validaciones mínimas
    if (!dto.detalles?.length) {
      throw new BadRequestException('La compra debe incluir al menos un detalle');
    }

    // Validar lotes y cantidades
    dto.detalles.forEach((d, idx) => {
      const totalLotes = d.lotes?.reduce((acc, l) => acc + (l.cantidad || 0), 0) || 0;
      if (totalLotes !== d.cantidadTotal) {
        throw new BadRequestException(`La suma de lotes (${totalLotes}) no coincide con cantidadTotal (${d.cantidadTotal}) en detalle #${idx + 1}`);
      }
    });

    // Transacción
    return await this.prisma.$transaction(async (tx) => {
      // 1) Crear cabecera de IngresoCompras
      const ingreso = await tx.ingresoCompras.create({
        data: {
          numeroFactura: dto.numeroFactura,
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

      // 2) Por cada detalle, crear IngresoComprasDetalle y sus lotes
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
            cartaCompromiso: det.cartaCompromiso ?? false,
            observaciones: det.observaciones ?? null,
          },
        });

        // 3) Crear lotes e impactar Inventario + HistorialInventario por lote
        for (const lote of det.lotes) {
          const loteCreado = await tx.ingresoComprasLotes.create({
            data: {
              idIngresoComprasDetalle: detalle.idIngresoComprasDetalle,
              tipoIngreso: lote.tipoIngreso?.trim() || dto.tipoCompra,
              cantidad: lote.cantidad,
              lote: lote.lote?.trim() || null,
              fechaVencimiento: lote.fechaVencimiento ? new Date(lote.fechaVencimiento) : null,
            },
          });

          // En Inventario, lote y presentacion son NOT NULL según schema, validar
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
              unidadMedida: (await this.getUnidadMedida(tx, det.idCatalogoInsumos)) || 'UNIDAD',
              lote: loteCreado.lote || 'SIN-LOTE',
              fechaVencimiento: loteCreado.fechaVencimiento,
              cantidadDisponible: loteCreado.cantidad,
              precioUnitario: new Prisma.Decimal(det.precioUnitario),
              precioTotal: new Prisma.Decimal(Number(det.precioUnitario) * loteCreado.cantidad),
            },
          });
          // Nota: No se registra HistorialInventario aquí debido a restricciones de FK (idDespacho/idReajuste NOT NULL).
          // Se recomienda ajustar el esquema para permitir null en esos campos o crear un flujo de auditoría dedicado.
        }
      }

      return { idIngresoCompras: ingreso.idIngresoCompras, totalFactura };
    });
  }

  async getUnidadMedida(tx: Prisma.TransactionClient, idCatalogoInsumos: number): Promise<string> {
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

  async findAll(params: { proveedor?: string; desde?: string; hasta?: string; page?: number; limit?: number }) {
    const { proveedor, desde, hasta, page = 1, limit = 20 } = params;
    const where: Prisma.IngresoComprasWhereInput = {};
    if (proveedor) where.proveedor = { contains: proveedor, mode: 'insensitive' };
    if (desde || hasta) {
      where.fechaIngreso = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      } as any;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.ingresoCompras.findMany({
        where,
        orderBy: { fechaIngreso: 'desc' },
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
      totalItems: c.IngresoComprasDetalle.length,
      totalCantidad: c.IngresoComprasDetalle.reduce((acc, d) => acc + d.cantidadTotal, 0),
      totalFactura: c.IngresoComprasDetalle.reduce((acc, d) => acc + Number(d.precioTotalFactura), 0),
    }));

    return { data: resumen, total, page, limit };
  }

  async update(id: number, dto: UpdateCompraDto) {
    const compra = await this.prisma.ingresoCompras.update({
      where: { idIngresoCompras: id },
      data: {
        ...(dto.numeroFactura !== undefined && { numeroFactura: dto.numeroFactura }),
        ...(dto.serieFactura !== undefined && { serieFactura: dto.serieFactura }),
        ...(dto.tipoCompra !== undefined && { tipoCompra: dto.tipoCompra }),
        ...(dto.fechaIngreso !== undefined && { fechaIngreso: new Date(dto.fechaIngreso) }),
        ...(dto.proveedor !== undefined && { proveedor: dto.proveedor }),
        ...(dto.ordenCompra !== undefined && { ordenCompra: dto.ordenCompra }),
        ...(dto.programa !== undefined && { programa: dto.programa }),
        ...(dto.numero1h !== undefined && { numero1h: dto.numero1h }),
        ...(dto.noKardex !== undefined && { noKardex: dto.noKardex }),
      },
    });
    return compra;
  }

  // Anular compra: pone a 0 inventario generado por la compra (sin historial por restricciones actuales)
  async anular(id: number, idUsuario: number, motivo: string) {
    return await this.prisma.$transaction(async (tx) => {
      const compra = await tx.ingresoCompras.findUnique({
        where: { idIngresoCompras: id },
        include: {
          Inventario: true,
        },
      });
      if (!compra) throw new NotFoundException(`Compra ${id} no encontrada`);

      // Verificar que inventarios de esta compra no tengan despachos
      const idsInventario = compra.Inventario.map((i) => i.idInventario);
      const countDespachos = await tx.despachos.count({ where: { idInventario: { in: idsInventario } } });
      if (countDespachos > 0) {
        throw new BadRequestException('No se puede anular: existen despachos asociados a su inventario');
      }

      // Poner cantidades a 0 en inventario
      for (const inv of compra.Inventario) {
        if (inv.cantidadDisponible > 0) {
          await tx.inventario.update({
            where: { idInventario: inv.idInventario },
            data: { cantidadDisponible: 0 },
          });
        }
      }

      // Opcional: borrar registros detalle/lotes o mantenerlos como históricos. Aquí mantenemos.
      return { message: `Compra ${id} anulada. Motivo: ${motivo}` };
    });
  }

  private async getIdCatalogoFromInventario(tx: Prisma.TransactionClient, idInventario: number): Promise<number> {
    const det = await tx.ingresoComprasDetalle.findFirst({
      where: {
        IngresoCompras: { Inventario: { some: { idInventario } } },
      },
      select: { idCatalogoInsumos: true },
    });
    return det?.idCatalogoInsumos || 0;
  }
}
