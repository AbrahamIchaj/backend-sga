import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardResumenResponse,
  DashboardMetrics,
  DespachoResumen,
} from '../dto/dashboard-response.dto';

interface AcumuladoMensual {
  [mesClave: string]: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumen(): Promise<DashboardResumenResponse> {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  const inicioProximos = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finProximos = new Date(ahora.getFullYear(), ahora.getMonth() + 6, 0, 23, 59, 59, 999);
    const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

    const [
      insumosDisponibles,
      inventarioAgg,
      proximosAgg,
      vencidosAgg,
      stockBajoAgg,
      totalIngresosAgg,
      comprasMesCount,
      comprasMesAgg,
      despachosRecientesData,
      comprasUltimosMesesData,
      despachosUltimosMesesData,
      comprasProveedorData,
    ] = await Promise.all([
      this.prisma.inventario.findMany({
        where: { cantidadDisponible: { gt: 0 } },
        distinct: ['codigoInsumo'],
        select: { codigoInsumo: true },
      }),
      this.prisma.inventario.aggregate({
        where: { cantidadDisponible: { gt: 0 } },
        _sum: { cantidadDisponible: true, precioTotal: true },
      }),
      this.prisma.inventario.aggregate({
        where: {
          cantidadDisponible: { gt: 0 },
          fechaVencimiento: {
            gte: inicioProximos,
            lte: finProximos,
          },
        },
        _sum: { cantidadDisponible: true },
      }),
      this.prisma.inventario.aggregate({
        where: {
          cantidadDisponible: { gt: 0 },
          fechaVencimiento: { lt: ahora },
        },
        _sum: { cantidadDisponible: true },
      }),
      this.prisma.inventario.aggregate({
        where: {
          cantidadDisponible: { gt: 0, lt: 10 },
        },
        _sum: { cantidadDisponible: true },
      }),
      this.prisma.ingresoComprasDetalle.aggregate({
        _sum: { precioTotalFactura: true },
      }),
      this.prisma.ingresoCompras.count({
        where: {
          fechaIngreso: {
            gte: inicioMes,
            lte: finMes,
          },
        },
      }),
      this.prisma.ingresoComprasDetalle.aggregate({
        where: {
          IngresoCompras: {
            fechaIngreso: {
              gte: inicioMes,
              lte: finMes,
            },
          },
        },
        _sum: {
          cantidadTotal: true,
          precioTotalFactura: true,
        },
      }),
      this.prisma.despacho.findMany({
        orderBy: { fechaDespacho: 'desc' },
        take: 5,
        include: {
          Servicios: { select: { nombre: true } },
          Usuarios: { select: { nombres: true, apellidos: true } },
        },
      }),
      this.prisma.ingresoCompras.findMany({
        where: {
          fechaIngreso: {
            gte: hace6Meses,
          },
        },
        select: {
          fechaIngreso: true,
          IngresoComprasDetalle: {
            select: { cantidadTotal: true },
          },
        },
      }),
      this.prisma.despacho.findMany({
        where: {
          fechaDespacho: {
            gte: hace6Meses,
          },
        },
        select: {
          fechaDespacho: true,
          totalCantidad: true,
        },
      }),
      this.prisma.ingresoCompras.findMany({
        where: {
          fechaIngreso: {
            gte: inicioAnio,
          },
        },
        select: {
          proveedor: true,
          IngresoComprasDetalle: {
            select: { precioTotalFactura: true },
          },
        },
      }),
    ]);

    const totalInsumos = insumosDisponibles.length;
    const totalExistencias = Number(inventarioAgg._sum.cantidadDisponible ?? 0);
    const proximosVencer = Number(proximosAgg._sum.cantidadDisponible ?? 0);
    const vencidos = Number(vencidosAgg._sum.cantidadDisponible ?? 0);
    const stockBajo = Number(stockBajoAgg._sum.cantidadDisponible ?? 0);
    const valorInventario = Number(inventarioAgg._sum.precioTotal ?? 0);
    const totalIngresosCompras = Number(
      totalIngresosAgg._sum.precioTotalFactura ?? 0,
    );
    const insumosIngresadosMes = Number(comprasMesAgg._sum.cantidadTotal ?? 0);
    const montoComprasMes = Number(comprasMesAgg._sum.precioTotalFactura ?? 0);

    const despachosRecientes: DespachoResumen[] = despachosRecientesData.map(
      (item) => ({
        idDespacho: item.idDespacho,
        codigo:
          item.codigoDespacho ??
          `DESP-${item.idDespacho.toString().padStart(6, '0')}`,
        fecha: item.fechaDespacho,
        servicio: item.Servicios?.nombre ?? null,
        usuario: item.Usuarios
          ? `${item.Usuarios.nombres} ${item.Usuarios.apellidos}`.trim()
          : null,
        totalCantidad: item.totalCantidad,
        totalGeneral: Number(item.totalGeneral),
      }),
    );

    const mesesReferencia = this.generarRangoMeses(ahora, 6);
    const ingresosPorMes = this.acumularPorMes(
      comprasUltimosMesesData,
      (compra) =>
        compra.IngresoComprasDetalle.reduce(
          (acc, detalle) => acc + detalle.cantidadTotal,
          0,
        ),
    );
    const despachosPorMes = this.acumularPorMes(
      despachosUltimosMesesData,
      (despacho) => despacho.totalCantidad,
    );

    const labels = mesesReferencia.map((mes) => mes.label);
    const ingresosSerie = mesesReferencia.map(
      (mes) => ingresosPorMes[mes.clave] ?? 0,
    );
    const despachosSerie = mesesReferencia.map(
      (mes) => despachosPorMes[mes.clave] ?? 0,
    );

    const comprasPorProveedorMap = new Map<string, number>();
    comprasProveedorData.forEach((compra) => {
      const proveedor = compra.proveedor?.trim() || 'Sin proveedor';
      const total = compra.IngresoComprasDetalle.reduce(
        (acc, detalle) => acc + Number(detalle.precioTotalFactura ?? 0),
        0,
      );
      comprasPorProveedorMap.set(
        proveedor,
        (comprasPorProveedorMap.get(proveedor) ?? 0) + total,
      );
    });

    const topProveedores = Array.from(comprasPorProveedorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const metrics: DashboardMetrics = {
      totalInsumos,
      totalExistencias,
      insumosProximosVencer: proximosVencer,
      insumosVencidos: vencidos,
      stockBajo,
      valorInventario,
      totalIngresosCompras,
      comprasMesActual: comprasMesCount,
      insumosIngresadosMes,
      montoComprasMes,
      mesActual: this.formatearMes(inicioMes),
      ultimaActualizacion: ahora,
    };

    return {
      metrics,
      charts: {
        ingresosVsDespachos: {
          labels,
          ingresos: ingresosSerie,
          despachos: despachosSerie,
        },
        estadoInventario: {
          labels: [
            'Stock disponible',
            'Próximos a vencer',
            'Vencidos',
            'Stock bajo',
          ],
          data: [
            Math.max(totalExistencias - proximosVencer - vencidos, 0),
            proximosVencer,
            vencidos,
            stockBajo,
          ],
        },
        comprasPorProveedor: {
          labels: topProveedores.map(([proveedor]) => proveedor),
          data: topProveedores.map(([, total]) => total),
        },
      },
      despachosRecientes,
    };
  }

  private generarRangoMeses(base: Date, cantidad: number) {
    const meses: { clave: string; label: string; fecha: Date }[] = [];
    const formatter = new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      year: 'numeric',
    });

    for (let i = cantidad - 1; i >= 0; i--) {
      const fecha = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      meses.push({ clave, label: formatter.format(fecha), fecha });
    }

    return meses;
  }

  private acumularPorMes<
    T extends { fechaIngreso?: Date; fechaDespacho?: Date },
  >(data: T[], extractor: (item: T) => number): AcumuladoMensual {
    return data.reduce<AcumuladoMensual>((acc, item) => {
      const fecha = (item as any).fechaIngreso ?? (item as any).fechaDespacho;
      if (!fecha) {
        return acc;
      }

      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      acc[clave] = (acc[clave] ?? 0) + extractor(item);
      return acc;
    }, {});
  }

  private formatearMes(fecha: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(fecha);
  }
}
