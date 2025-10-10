import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardResumenResponse,
  DashboardMetrics,
  DespachoResumen,
} from '../dto/dashboard-response.dto';

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
    const finProximos = new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 6,
      0,
      23,
      59,
      59,
      999,
    );
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

    const [
      insumosDisponibles,
      inventarioAgg,
      proximosAgg,
      proximosDistinct,
      vencidosAgg,
      stockBajoAgg,
      totalIngresosAgg,
      comprasMesCount,
      comprasMesAgg,
  despachosRecientesData,
  despachosMesListadoData,
      comprasMesListadoData,
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
      this.prisma.inventario.findMany({
        where: {
          cantidadDisponible: { gt: 0 },
          fechaVencimiento: {
            gte: inicioProximos,
            lte: finProximos,
          },
        },
        distinct: ['codigoInsumo'],
        select: { codigoInsumo: true },
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
      this.prisma.despacho.findMany({
        where: {
          fechaDespacho: {
            gte: inicioMes,
            lte: finMes,
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
            gte: inicioMes,
            lte: finMes,
          },
        },
        select: {
          fechaIngreso: true,
          IngresoComprasDetalle: {
            select: { cantidadTotal: true },
          },
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
        },
      }),
    ]);

    const totalInsumos = insumosDisponibles.length;
    const totalExistencias = Number(inventarioAgg._sum.cantidadDisponible ?? 0);
    const proximosVencerCantidad = Number(
      proximosAgg._sum.cantidadDisponible ?? 0,
    );
    const proximosVencerUnicos = proximosDistinct.length;
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

    const finDiasReferencia =
      inicioMes.getFullYear() === ahora.getFullYear() &&
      inicioMes.getMonth() === ahora.getMonth()
        ? ahora
        : finMes;

    const diasMesReferencia = this.generarRangoDiasDelMes(
      inicioMes,
      finDiasReferencia,
    );
    const despachosPorDia = this.acumularPorDia(
      despachosMesListadoData,
      (despacho) => despacho.fechaDespacho,
      (despacho) => despacho.totalCantidad,
    );
    const ingresosPorDia = this.acumularPorDia(
      comprasMesListadoData,
      (compra) => compra.fechaIngreso,
      (compra) =>
        compra.IngresoComprasDetalle.reduce(
          (acc, detalle) => acc + detalle.cantidadTotal,
          0,
        ),
    );

    const labelsDespachos = diasMesReferencia.map((dia) => dia.label);
    const serieDespachos = diasMesReferencia.map(
      (dia) => despachosPorDia[dia.clave] ?? 0,
    );
    const labelsIngresos = diasMesReferencia.map((dia) => dia.label);
    const serieIngresos = diasMesReferencia.map(
      (dia) => ingresosPorDia[dia.clave] ?? 0,
    );

    const comprasPorProveedorMap = new Map<string, number>();
    comprasProveedorData.forEach((compra) => {
      const proveedor = compra.proveedor?.trim() || 'Sin proveedor';
      comprasPorProveedorMap.set(
        proveedor,
        (comprasPorProveedorMap.get(proveedor) ?? 0) + 1,
      );
    });

    const proveedoresOrdenados = Array.from(comprasPorProveedorMap.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1];
        }
        return a[0].localeCompare(b[0]);
      });

    const metrics: DashboardMetrics = {
      totalInsumos,
      totalExistencias,
      insumosProximosVencer: proximosVencerCantidad,
      insumosProximosVencerUnicos: proximosVencerUnicos,
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
        despachosDiariosMes: {
          labels: labelsDespachos,
          data: serieDespachos,
        },
        ingresosDiariosMes: {
          labels: labelsIngresos,
          data: serieIngresos,
        },
        estadoInventario: {
          labels: [
            'Stock disponible',
            'Próximos a vencer',
            'Vencidos',
            'Stock bajo',
          ],
          data: [
            Math.max(
              totalExistencias - proximosVencerCantidad - vencidos,
              0,
            ),
            proximosVencerCantidad,
            vencidos,
            stockBajo,
          ],
        },
        comprasPorProveedor: {
          labels: proveedoresOrdenados.map(([proveedor]) => proveedor),
          data: proveedoresOrdenados.map(([, total]) => total),
        },
      },
      despachosRecientes,
    };
  }

  private generarRangoDiasDelMes(inicio: Date, fin: Date) {
    const dias: { clave: string; label: string; fecha: Date }[] = [];
    const formatterDia = new Intl.DateTimeFormat('es-ES', { day: '2-digit' });
    const formatterMes = new Intl.DateTimeFormat('es-ES', { month: 'short' });

    const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    const limite = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

    while (cursor <= limite) {
      const clave = this.obtenerClaveDia(cursor);
      dias.push({
        clave,
        label: `${formatterDia.format(cursor)} ${formatterMes.format(cursor)}`,
        fecha: new Date(cursor),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return dias;
  }

  private acumularPorDia<T>(
    data: T[],
    obtenerFecha: (item: T) => Date | string | null | undefined,
    extractor: (item: T) => number,
  ): Record<string, number> {
    return data.reduce<Record<string, number>>((acc, item) => {
      const fechaRaw = obtenerFecha(item);
      if (!fechaRaw) {
        return acc;
      }

      const fecha = new Date(fechaRaw);
      if (Number.isNaN(fecha.getTime())) {
        return acc;
      }

      const clave = this.obtenerClaveDia(fecha);
      acc[clave] = (acc[clave] ?? 0) + extractor(item);
      return acc;
    }, {});
  }

  private obtenerClaveDia(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatearMes(fecha: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(fecha);
  }
}
