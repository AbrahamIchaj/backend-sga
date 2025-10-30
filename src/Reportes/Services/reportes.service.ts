import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReporteFiltroQueryDto } from '../dto/reportes-query.dto';
import { obtenerRenglonesPermitidos } from '../../common/utils/renglones.util';
import { Prisma } from '@prisma/client';

interface ConsumoInsumoResumen {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
}

interface ConsumoRenglonResumen {
  renglon: number;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  insumos: ConsumoInsumoResumen[];
}

interface ConsumoMensualResumen {
  mes: number;
  nombreMes: string;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  renglones: ConsumoRenglonResumen[];
}

export interface ConsumoMensualResponse {
  anio: number;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  meses: ConsumoMensualResumen[];
  insumos: ConsumoInsumoAnualResumen[];
}

interface ConsumoInsumoMesDetalle {
  mes: number;
  nombreMes: string;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
}

interface ConsumoInsumoAnualResumen {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  renglon?: number | null;
  meses: ConsumoInsumoMesDetalle[];
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
}

interface DiaCalendarioConsumo {
  fecha: string;
  anio: number;
  mes: number;
  dia: number;
  etiqueta: string;
  nombreMes: string;
}

interface ConsumoInsumoDetallePeriodo {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  renglon?: number | null;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  promedioCantidad: number;
  promedioGeneral: number;
  promedioDespachos: number;
  dias?: Array<{
    fecha: string;
    anio: number;
    mes: number;
    dia: number;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
}

interface ConsumoPeriodoDetalle {
  etiqueta: 'mensual' | 'promedio3' | 'promedio7' | 'promedio12' | string;
  mesesConsiderados: number;
  mesesEsperados: number;
  mesesConDatos: number;
  fechaInicio: string;
  fechaFin: string;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  promedioCantidad: number;
  promedioGeneral: number;
  promedioDespachos: number;
  dias?: DiaCalendarioConsumo[];
  resumenPorDia?: Array<{
    fecha: string;
    anio: number;
    mes: number;
    dia: number;
    etiqueta: string;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
  mesesResumen?: Array<{
    anio: number;
    mes: number;
    nombreMes: string;
    fechaInicio: string;
    fechaFin: string;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
  insumos: ConsumoInsumoDetallePeriodo[];
}

export interface ConsumoMensualDetalleResponse {
  anio: number;
  mes: number;
  nombreMes: string;
  fechaInicio: string;
  fechaFin: string;
  periodos: ConsumoPeriodoDetalle[];
}

interface ReporteAnualMesResumen {
  mes: number;
  nombreMes: string;
  totalRegistros: number;
  totalCantidad: number;
  totalGeneral: number;
}

export interface ReporteAnualResponse {
  tipo: 'compras' | 'despachos' | 'reajustes';
  anios: Array<{
    anio: number;
    totalRegistros: number;
    totalCantidad: number;
    totalGeneral: number;
    meses: ReporteAnualMesResumen[];
  }>;
  detalle?: ReajusteAnualDetalle[];
}

interface ReajusteAnualDetalle {
  idReajuste: number;
  fecha: string;
  tipoReajuste: number;
  referenciaDocumento: string;
  observaciones?: string | null;
  usuario?: {
    idUsuario: number;
    nombres: string;
    apellidos: string;
  } | null;
  totalCantidad: number;
  insumos: Array<{
    codigoInsumo: number | null;
    nombreInsumo: string;
    caracteristicas: string;
    cantidad: number;
    renglon?: number | null;
  }>;
}

export interface ReporteResumenResponse {
  anio: number;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  promedioMensualCantidad: number;
  promedioMensualGeneral: number;
  meses: Array<{
    mes: number;
    nombreMes: string;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
  topRenglones: Array<{
    renglon: number;
    totalCantidad: number;
    totalGeneral: number;
  }>;
}

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getNombreMes(mes: number): string {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return meses[mes - 1] ?? `Mes ${mes}`;
  }

  private async resolverRenglonesFiltro(query: ReporteFiltroQueryDto) {
    let renglonesFiltrar: number[] = [];
    let renglonesEspecificados = false;

    if (typeof query.renglones === 'string' && query.renglones.trim()) {
      renglonesEspecificados = true;
      renglonesFiltrar = query.renglones
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((valor) => Number.isFinite(valor) && valor > 0);
    }

    if (!renglonesFiltrar.length && query.idUsuario) {
      renglonesFiltrar = await obtenerRenglonesPermitidos(this.prisma, query.idUsuario);
    }

    const renglonesUnicos = Array.from(new Set(renglonesFiltrar));
    const sinPermisos =
      !!query.idUsuario && !renglonesEspecificados && renglonesUnicos.length === 0;

    return {
      renglones: renglonesUnicos,
      sinPermisos,
      renglonesEspecificados,
    };
  }

  private obtenerMesAnterior(anio: number, mes: number) {
    if (mes === 1) {
      return { anio: anio - 1, mes: 12 };
    }
    return { anio, mes: mes - 1 };
  }

  private obtenerMesOperativo(fecha: Date) {
    const anio = fecha.getFullYear();
    let mes = fecha.getMonth() + 1;
    let anioOperativo = anio;

    if (fecha.getDate() >= 26) {
      mes += 1;
      if (mes === 13) {
        mes = 1;
        anioOperativo += 1;
      }
    }

    return { anio: anioOperativo, mes };
  }

  private formatearFechaISO(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }

  private obtenerRangoCorteMensual(
    anio: number,
    mes: number,
  ): {
    anio: number;
    mes: number;
    nombreMes: string;
    fechaInicio: Date;
    fechaFin: Date;
    dias: DiaCalendarioConsumo[];
  } {
    const { anio: anioInicio, mes: mesInicio } = this.obtenerMesAnterior(anio, mes);
    const fechaInicio = new Date(anioInicio, mesInicio - 1, 26);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(anio, mes - 1, 25, 23, 59, 59, 999);

    const dias: DiaCalendarioConsumo[] = [];
    const cursor = new Date(fechaInicio);

    while (cursor <= fechaFin) {
      dias.push({
        fecha: this.formatearFechaISO(cursor),
        anio: cursor.getFullYear(),
        mes: cursor.getMonth() + 1,
        dia: cursor.getDate(),
        etiqueta: cursor.getDate().toString(),
        nombreMes: this.getNombreMes(cursor.getMonth() + 1),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      anio,
      mes,
      nombreMes: this.getNombreMes(mes),
      fechaInicio,
      fechaFin,
      dias,
    };
  }

  private obtenerRangosParaPromedio(
    anio: number,
    mes: number,
    mesesConsiderados: number,
  ) {
    const rangos: Array<{
      anio: number;
      mes: number;
      nombreMes: string;
      fechaInicio: Date;
      fechaFin: Date;
      dias: DiaCalendarioConsumo[];
    }> = [];

    let anioCursor = anio;
    let mesCursor = mes;

    for (let i = 0; i < mesesConsiderados; i++) {
      const rango = this.obtenerRangoCorteMensual(anioCursor, mesCursor);
      rangos.unshift(rango);
      const anterior = this.obtenerMesAnterior(anioCursor, mesCursor);
      anioCursor = anterior.anio;
      mesCursor = anterior.mes;
    }

    return rangos;
  }

  private obtenerRangoAnios(query: ReporteFiltroQueryDto) {
    const anioActual = new Date().getFullYear();
    let anioInicio = query.anioInicio ?? query.anio ?? anioActual;
    let anioFin = query.anioFin ?? query.anio ?? anioInicio;

    if (anioInicio > anioFin) {
      [anioInicio, anioFin] = [anioFin, anioInicio];
    }

    return { anioInicio, anioFin };
  }

  private async obtenerDetallesDespachos(
    query: ReporteFiltroQueryDto,
    fechaInicio: Date,
    fechaFin: Date,
  ) {
    const { renglones, sinPermisos } = await this.resolverRenglonesFiltro(query);

    if (sinPermisos) {
      return [];
    }

    const where: Prisma.DespachoDetalleWhereInput = {
      Despacho: {
        fechaDespacho: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        ...(query.idServicio ? { idServicio: query.idServicio } : {}),
      },
    };

    if (query.codigoInsumo) {
      where.codigoInsumo = query.codigoInsumo;
    }

    if (renglones.length) {
      where.OR = [
        {
          Inventario: {
            renglon: {
              in: renglones,
            },
          },
        },
        {
          CatalogoInsumos: {
            renglon: {
              in: renglones,
            },
          },
        },
      ];
    }

    return this.prisma.despachoDetalle.findMany({
      where,
      include: {
        Despacho: {
          select: {
            idDespacho: true,
            fechaDespacho: true,
            idServicio: true,
            Servicios: {
              select: {
                nombre: true,
              },
            },
          },
        },
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
      orderBy: {
        Despacho: {
          fechaDespacho: 'asc',
        },
      },
    });
  }

  private async obtenerInsumosInventarioBase(query: ReporteFiltroQueryDto) {
    const { renglones, sinPermisos } = await this.resolverRenglonesFiltro(query);

    if (sinPermisos) {
      return [] as Array<{
        codigoInsumo: number;
        nombreInsumo: string;
        caracteristicas: string;
        renglon: number | null;
      }>;
    }

    const where: Prisma.InventarioWhereInput = {};

    if (query.codigoInsumo) {
      where.codigoInsumo = query.codigoInsumo;
    }

    if (renglones.length) {
      where.renglon = {
        in: renglones,
      };
    }

    const inventario = await this.prisma.inventario.findMany({
      where,
      select: {
        codigoInsumo: true,
        nombreInsumo: true,
        caracteristicas: true,
        renglon: true,
      },
    });

    const mapa = new Map<number, {
      codigoInsumo: number;
      nombreInsumo: string;
      caracteristicas: string;
      renglon: number | null;
    }>();

    for (const item of inventario) {
      if (!mapa.has(item.codigoInsumo)) {
        mapa.set(item.codigoInsumo, {
          codigoInsumo: item.codigoInsumo,
          nombreInsumo: item.nombreInsumo,
          caracteristicas: item.caracteristicas,
          renglon: item.renglon,
        });
      }
    }

    return Array.from(mapa.values());
  }

  private async construirConsumoPeriodo(
    etiqueta: 'mensual' | 'promedio3' | 'promedio7' | 'promedio12' | string,
    mesesConsiderados: number,
    anio: number,
    mes: number,
    query: ReporteFiltroQueryDto,
    incluirDias = false,
  ): Promise<ConsumoPeriodoDetalle> {
    const rangos = this.obtenerRangosParaPromedio(anio, mes, mesesConsiderados);
    const fechaInicio = rangos[0].fechaInicio;
    const fechaFin = rangos[rangos.length - 1].fechaFin;
    const rangoBase = rangos[rangos.length - 1];

    const detalles = await this.obtenerDetallesDespachos(query, fechaInicio, fechaFin);
    const inventarioBase = await this.obtenerInsumosInventarioBase(query);

    const totalDespachosSet = new Set<number>();
    let totalCantidad = 0;
    let totalGeneral = 0;

    const mesesResumenMap = new Map<
      string,
      {
        anio: number;
        mes: number;
        nombreMes: string;
        fechaInicio: Date;
        fechaFin: Date;
        totalCantidad: number;
        totalGeneral: number;
        despachoIds: Set<number>;
      }
    >();

    const diasResumenMap = incluirDias
      ? new Map<
          string,
          {
            fecha: string;
            anio: number;
            mes: number;
            dia: number;
            etiqueta: string;
            totalCantidad: number;
            totalGeneral: number;
            despachoIds: Set<number>;
          }
        >()
      : null;

    const insumosMap = new Map<
      number,
      {
        codigoInsumo: number;
        nombreInsumo: string;
        caracteristicas: string;
        renglon?: number | null;
        totalCantidad: number;
        totalGeneral: number;
        despachoIds: Set<number>;
        dias?: Map<
          string,
          {
            fecha: string;
            anio: number;
            mes: number;
            dia: number;
            etiqueta: string;
            totalCantidad: number;
            totalGeneral: number;
            despachoIds: Set<number>;
          }
        >;
      }
    >();

    for (const detalle of detalles) {
      const despacho = detalle.Despacho;
      const fechaDespacho = despacho?.fechaDespacho ? new Date(despacho.fechaDespacho) : null;
      if (!fechaDespacho || fechaDespacho < fechaInicio || fechaDespacho > fechaFin) {
        continue;
      }

      const precioTotal = Number(detalle.precioTotal ?? 0);
      totalCantidad += detalle.cantidad;
      totalGeneral += precioTotal;

      if (despacho?.idDespacho) {
        totalDespachosSet.add(despacho.idDespacho);
      }

      const rangoDelDia = rangos.find(
        (rango) => fechaDespacho >= rango.fechaInicio && fechaDespacho <= rango.fechaFin,
      );

      if (rangoDelDia) {
        const claveMes = `${rangoDelDia.anio}-${rangoDelDia.mes}`;
        let mesResumen = mesesResumenMap.get(claveMes);
        if (!mesResumen) {
          mesResumen = {
            anio: rangoDelDia.anio,
            mes: rangoDelDia.mes,
            nombreMes: rangoDelDia.nombreMes,
            fechaInicio: rangoDelDia.fechaInicio,
            fechaFin: rangoDelDia.fechaFin,
            totalCantidad: 0,
            totalGeneral: 0,
            despachoIds: new Set<number>(),
          };
          mesesResumenMap.set(claveMes, mesResumen);
        }

        mesResumen.totalCantidad += detalle.cantidad;
        mesResumen.totalGeneral += precioTotal;
        if (despacho?.idDespacho) {
          mesResumen.despachoIds.add(despacho.idDespacho);
        }
      }

      const renglon = detalle.Inventario?.renglon ?? detalle.CatalogoInsumos?.renglon ?? null;
      const codigoInsumo = detalle.codigoInsumo;

      let insumoData = insumosMap.get(codigoInsumo);
      if (!insumoData) {
        insumoData = {
          codigoInsumo,
          nombreInsumo: detalle.nombreInsumo,
          caracteristicas: detalle.caracteristicas,
          renglon,
          totalCantidad: 0,
          totalGeneral: 0,
          despachoIds: new Set<number>(),
          dias: incluirDias
            ? new Map<
                string,
                {
                  fecha: string;
                  anio: number;
                  mes: number;
                  dia: number;
                  etiqueta: string;
                  totalCantidad: number;
                  totalGeneral: number;
                  despachoIds: Set<number>;
                }
              >()
            : undefined,
        };
        insumosMap.set(codigoInsumo, insumoData);
      }

      insumoData.totalCantidad += detalle.cantidad;
      insumoData.totalGeneral += precioTotal;
      if (despacho?.idDespacho) {
        insumoData.despachoIds.add(despacho.idDespacho);
      }

      if (incluirDias && diasResumenMap && insumoData.dias && rangoBase) {
        if (fechaDespacho >= rangoBase.fechaInicio && fechaDespacho <= rangoBase.fechaFin) {
          const fechaClave = this.formatearFechaISO(fechaDespacho);
          let diaGlobal = diasResumenMap.get(fechaClave);
          if (!diaGlobal) {
            diaGlobal = {
              fecha: fechaClave,
              anio: fechaDespacho.getFullYear(),
              mes: fechaDespacho.getMonth() + 1,
              dia: fechaDespacho.getDate(),
              etiqueta: fechaDespacho.getDate().toString(),
              totalCantidad: 0,
              totalGeneral: 0,
              despachoIds: new Set<number>(),
            };
            diasResumenMap.set(fechaClave, diaGlobal);
          }

          diaGlobal.totalCantidad += detalle.cantidad;
          diaGlobal.totalGeneral += precioTotal;
          if (despacho?.idDespacho) {
            diaGlobal.despachoIds.add(despacho.idDespacho);
          }

          let diaInsumo = insumoData.dias.get(fechaClave);
          if (!diaInsumo) {
            diaInsumo = {
              fecha: fechaClave,
              anio: fechaDespacho.getFullYear(),
              mes: fechaDespacho.getMonth() + 1,
              dia: fechaDespacho.getDate(),
              etiqueta: fechaDespacho.getDate().toString(),
              totalCantidad: 0,
              totalGeneral: 0,
              despachoIds: new Set<number>(),
            };
            insumoData.dias.set(fechaClave, diaInsumo);
          }

          diaInsumo.totalCantidad += detalle.cantidad;
          diaInsumo.totalGeneral += precioTotal;
          if (despacho?.idDespacho) {
            diaInsumo.despachoIds.add(despacho.idDespacho);
          }
        }
      }
    }

    for (const base of inventarioBase) {
      let insumoData = insumosMap.get(base.codigoInsumo);
      if (!insumoData) {
        insumoData = {
          codigoInsumo: base.codigoInsumo,
          nombreInsumo: base.nombreInsumo,
          caracteristicas: base.caracteristicas,
          renglon: base.renglon,
          totalCantidad: 0,
          totalGeneral: 0,
          despachoIds: new Set<number>(),
          dias: incluirDias
            ? new Map<
                string,
                {
                  fecha: string;
                  anio: number;
                  mes: number;
                  dia: number;
                  etiqueta: string;
                  totalCantidad: number;
                  totalGeneral: number;
                  despachoIds: Set<number>;
                }
              >()
            : undefined,
        };
        insumosMap.set(base.codigoInsumo, insumoData);
      } else {
        if ((insumoData.renglon === undefined || insumoData.renglon === null) && base.renglon !== null) {
          insumoData.renglon = base.renglon;
        }
        if (!insumoData.nombreInsumo) {
          insumoData.nombreInsumo = base.nombreInsumo;
        }
        if (!insumoData.caracteristicas) {
          insumoData.caracteristicas = base.caracteristicas;
        }
        if (incluirDias && !insumoData.dias) {
          insumoData.dias = new Map();
        }
      }
    }

    const mesesResumen = Array.from(mesesResumenMap.values())
      .sort((a, b) => (a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio))
      .map((mesItem) => ({
        anio: mesItem.anio,
        mes: mesItem.mes,
        nombreMes: mesItem.nombreMes,
        fechaInicio: this.formatearFechaISO(mesItem.fechaInicio),
        fechaFin: this.formatearFechaISO(mesItem.fechaFin),
        totalCantidad: mesItem.totalCantidad,
        totalGeneral: mesItem.totalGeneral,
        totalDespachos: mesItem.despachoIds.size,
      }));

    const diasOrdenados = incluirDias && rangoBase ? rangoBase.dias : undefined;

    const resumenPorDia = diasOrdenados && diasResumenMap
      ? diasOrdenados.map((dia) => {
          const info = diasResumenMap.get(dia.fecha);
          return {
            fecha: dia.fecha,
            anio: dia.anio,
            mes: dia.mes,
            dia: dia.dia,
            etiqueta: dia.etiqueta,
            totalCantidad: info?.totalCantidad ?? 0,
            totalGeneral: info?.totalGeneral ?? 0,
            totalDespachos: info ? info.despachoIds.size : 0,
          };
        })
      : undefined;

    const insumos = Array.from(insumosMap.values())
      .map((insumo) => {
        const promedioCantidad = mesesConsiderados > 0 ? insumo.totalCantidad / mesesConsiderados : 0;
        const promedioGeneral = mesesConsiderados > 0 ? insumo.totalGeneral / mesesConsiderados : 0;
        const promedioDespachos = mesesConsiderados > 0 ? insumo.despachoIds.size / mesesConsiderados : 0;

        const dias = diasOrdenados && insumo.dias
          ? diasOrdenados.map((dia) => {
              const info = insumo.dias?.get(dia.fecha);
              return {
                fecha: dia.fecha,
                anio: dia.anio,
                mes: dia.mes,
                dia: dia.dia,
                totalCantidad: info?.totalCantidad ?? 0,
                totalGeneral: info?.totalGeneral ?? 0,
                totalDespachos: info ? info.despachoIds.size : 0,
              };
            })
          : undefined;

        return {
          codigoInsumo: insumo.codigoInsumo,
          nombreInsumo: insumo.nombreInsumo,
          caracteristicas: insumo.caracteristicas,
          renglon: insumo.renglon,
          totalCantidad: insumo.totalCantidad,
          totalGeneral: insumo.totalGeneral,
          totalDespachos: insumo.despachoIds.size,
          promedioCantidad,
          promedioGeneral,
          promedioDespachos,
          dias,
        } as ConsumoInsumoDetallePeriodo;
      })
      .sort((a, b) => {
        const diferencia = b.totalGeneral - a.totalGeneral;
        if (diferencia !== 0) {
          return diferencia;
        }
        return a.nombreInsumo.localeCompare(b.nombreInsumo, 'es', { sensitivity: 'base' });
      });

    const mesesEsperados = mesesConsiderados;
    const mesesConDatos = mesesResumen.length;

    const promedioCantidad = mesesEsperados > 0 ? totalCantidad / mesesEsperados : 0;
    const promedioGeneral = mesesEsperados > 0 ? totalGeneral / mesesEsperados : 0;
    const promedioDespachos = mesesEsperados > 0 ? totalDespachosSet.size / mesesEsperados : 0;

    return {
      etiqueta,
      mesesConsiderados,
      mesesEsperados,
      mesesConDatos,
      fechaInicio: this.formatearFechaISO(fechaInicio),
      fechaFin: this.formatearFechaISO(fechaFin),
      totalCantidad,
      totalGeneral,
      totalDespachos: totalDespachosSet.size,
      promedioCantidad,
      promedioGeneral,
      promedioDespachos,
      dias: diasOrdenados,
      resumenPorDia,
      mesesResumen,
      insumos,
    };
  }

  async obtenerComprasAnuales(query: ReporteFiltroQueryDto): Promise<ReporteAnualResponse> {
    const { renglones, sinPermisos } = await this.resolverRenglonesFiltro(query);
    if (sinPermisos) {
      return { tipo: 'compras', anios: [] };
    }

    const { anioInicio, anioFin } = this.obtenerRangoAnios(query);
    const anios: ReporteAnualResponse['anios'] = [];

    for (let anio = anioInicio; anio <= anioFin; anio++) {
      const fechaInicio = new Date(anio, 0, 1, 0, 0, 0, 0);
      const fechaFin = new Date(anio, 11, 31, 23, 59, 59, 999);

      const where: Prisma.IngresoComprasDetalleWhereInput = {
        IngresoCompras: {
          fechaIngreso: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      };

      if (query.codigoInsumo) {
        where.codigoInsumo = query.codigoInsumo;
      }

      if (renglones.length) {
        where.renglon = { in: renglones };
      }

      const detalles = await this.prisma.ingresoComprasDetalle.findMany({
        where,
        select: {
          idIngresoCompras: true,
          cantidadTotal: true,
          precioTotalFactura: true,
          IngresoCompras: {
            select: {
              fechaIngreso: true,
            },
          },
        },
        orderBy: {
          IngresoCompras: {
            fechaIngreso: 'asc',
          },
        },
      });

      const mesesMap = new Map<
        number,
        {
          mes: number;
          totalCantidad: number;
          totalGeneral: number;
          compraIds: Set<number>;
        }
      >();

      const compraIds = new Set<number>();
      let totalCantidad = 0;
      let totalGeneral = 0;

      for (const detalle of detalles) {
        const fechaIngreso = detalle.IngresoCompras?.fechaIngreso
          ? new Date(detalle.IngresoCompras.fechaIngreso)
          : null;
        if (!fechaIngreso) continue;

        const mes = fechaIngreso.getMonth() + 1;
        let mesData = mesesMap.get(mes);
        if (!mesData) {
          mesData = {
            mes,
            totalCantidad: 0,
            totalGeneral: 0,
            compraIds: new Set<number>(),
          };
          mesesMap.set(mes, mesData);
        }

        const precioTotal = Number(detalle.precioTotalFactura ?? 0);
        mesData.totalCantidad += detalle.cantidadTotal;
        mesData.totalGeneral += precioTotal;
        mesData.compraIds.add(detalle.idIngresoCompras);

        totalCantidad += detalle.cantidadTotal;
        totalGeneral += precioTotal;
        compraIds.add(detalle.idIngresoCompras);
      }

      anios.push({
        anio,
        totalRegistros: compraIds.size,
        totalCantidad,
        totalGeneral,
        meses: Array.from(mesesMap.values())
          .sort((a, b) => a.mes - b.mes)
          .map((mesItem) => ({
            mes: mesItem.mes,
            nombreMes: this.getNombreMes(mesItem.mes),
            totalRegistros: mesItem.compraIds.size,
            totalCantidad: mesItem.totalCantidad,
            totalGeneral: mesItem.totalGeneral,
          })),
      });
    }

    return {
      tipo: 'compras',
      anios,
    };
  }

  async obtenerDespachosAnuales(query: ReporteFiltroQueryDto): Promise<ReporteAnualResponse> {
    const { anioInicio, anioFin } = this.obtenerRangoAnios(query);
    const anios: ReporteAnualResponse['anios'] = [];

    for (let anio = anioInicio; anio <= anioFin; anio++) {
      const consumo = await this.calcularConsumoMensual({ ...query, anio });
      anios.push({
        anio,
        totalRegistros: consumo.totalDespachos,
        totalCantidad: consumo.totalCantidad,
        totalGeneral: consumo.totalGeneral,
        meses: consumo.meses.map((mesItem) => ({
          mes: mesItem.mes,
          nombreMes: mesItem.nombreMes,
          totalRegistros: mesItem.totalDespachos,
          totalCantidad: mesItem.totalCantidad,
          totalGeneral: mesItem.totalGeneral,
        })),
      });
    }

    return {
      tipo: 'despachos',
      anios,
    };
  }

  async obtenerReajustesAnuales(query: ReporteFiltroQueryDto): Promise<ReporteAnualResponse> {
    const { renglones, sinPermisos } = await this.resolverRenglonesFiltro(query);
    if (sinPermisos) {
      return { tipo: 'reajustes', anios: [], detalle: [] };
    }

    const { anioInicio, anioFin } = this.obtenerRangoAnios(query);
    const anios: ReporteAnualResponse['anios'] = [];
    const detalle: ReajusteAnualDetalle[] = [];

    for (let anio = anioInicio; anio <= anioFin; anio++) {
      const fechaInicio = new Date(anio, 0, 1, 0, 0, 0, 0);
      const fechaFin = new Date(anio, 11, 31, 23, 59, 59, 999);

      const where: Prisma.ReajusteDetalleWhereInput = {
        Reajustes: {
          fechaReajuste: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      };

      if (query.codigoInsumo) {
        where.codigoInsumo = query.codigoInsumo;
      }

      if (renglones.length) {
        where.OR = [
          {
            Inventario: {
              renglon: {
                in: renglones,
              },
            },
          },
          {
            CatalogoInsumos: {
              renglon: {
                in: renglones,
              },
            },
          },
        ];
      }

      const reajustesDetalle = await this.prisma.reajusteDetalle.findMany({
        where,
        include: {
          Reajustes: {
            select: {
              idReajuste: true,
              fechaReajuste: true,
              tipoReajuste: true,
              referenciaDocumento: true,
              observaciones: true,
              Usuarios: {
                select: {
                  idUsuario: true,
                  nombres: true,
                  apellidos: true,
                },
              },
            },
          },
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
        orderBy: {
          Reajustes: {
            fechaReajuste: 'asc',
          },
        },
      });

      const mesesMap = new Map<
        number,
        {
          mes: number;
          totalCantidad: number;
          reajusteIds: Set<number>;
        }
      >();

      const reajusteMap = new Map<
        number,
        {
          idReajuste: number;
          fecha: string;
          tipoReajuste: number;
          referenciaDocumento: string;
          observaciones?: string | null;
          usuario?: {
            idUsuario: number;
            nombres: string;
            apellidos: string;
          } | null;
          totalCantidad: number;
          insumos: Array<{
            codigoInsumo: number | null;
            nombreInsumo: string;
            caracteristicas: string;
            cantidad: number;
            renglon?: number | null;
          }>;
        }
      >();

      const reajusteIds = new Set<number>();
      let totalCantidad = 0;

      for (const detalleItem of reajustesDetalle) {
        const reajuste = detalleItem.Reajustes;
        const fechaReajuste = reajuste?.fechaReajuste
          ? new Date(reajuste.fechaReajuste)
          : null;
        if (!fechaReajuste) continue;

        const mes = fechaReajuste.getMonth() + 1;
        let mesData = mesesMap.get(mes);
        if (!mesData) {
          mesData = {
            mes,
            totalCantidad: 0,
            reajusteIds: new Set<number>(),
          };
          mesesMap.set(mes, mesData);
        }

        const renglon = detalleItem.Inventario?.renglon ?? detalleItem.CatalogoInsumos?.renglon ?? null;
        const idReajuste = reajuste?.idReajuste ?? 0;

        mesData.totalCantidad += detalleItem.cantidad;
        if (idReajuste) {
          mesData.reajusteIds.add(idReajuste);
          reajusteIds.add(idReajuste);
        }

        totalCantidad += detalleItem.cantidad;

        if (idReajuste) {
          let info = reajusteMap.get(idReajuste);
          if (!info) {
            info = {
              idReajuste,
              fecha: this.formatearFechaISO(fechaReajuste),
              tipoReajuste: reajuste.tipoReajuste,
              referenciaDocumento: reajuste.referenciaDocumento,
              observaciones: reajuste.observaciones,
              usuario: reajuste.Usuarios
                ? {
                    idUsuario: reajuste.Usuarios.idUsuario,
                    nombres: reajuste.Usuarios.nombres,
                    apellidos: reajuste.Usuarios.apellidos,
                  }
                : null,
              totalCantidad: 0,
              insumos: [],
            };
            reajusteMap.set(idReajuste, info);
          }

          info.totalCantidad += detalleItem.cantidad;
          info.insumos.push({
            codigoInsumo: detalleItem.codigoInsumo ?? null,
            nombreInsumo: detalleItem.nombreInsumo,
            caracteristicas: detalleItem.caracteristicas,
            cantidad: detalleItem.cantidad,
            renglon,
          });
        }
      }

      anios.push({
        anio,
        totalRegistros: reajusteIds.size,
        totalCantidad,
        totalGeneral: 0,
        meses: Array.from(mesesMap.values())
          .sort((a, b) => a.mes - b.mes)
          .map((mesItem) => ({
            mes: mesItem.mes,
            nombreMes: this.getNombreMes(mesItem.mes),
            totalRegistros: mesItem.reajusteIds.size,
            totalCantidad: mesItem.totalCantidad,
            totalGeneral: 0,
          })),
      });

      detalle.push(
        ...Array.from(reajusteMap.values()).sort((a, b) => a.idReajuste - b.idReajuste),
      );
    }

    return {
      tipo: 'reajustes',
      anios,
      detalle,
    };
  }

  private async calcularConsumoMensual(
    query: ReporteFiltroQueryDto,
  ): Promise<ConsumoMensualResponse> {
    try {
      const {
        anio,
        codigoInsumo,
        idServicio,
        idUsuario,
        renglones,
      } = query;

      const anioObjetivo =
        typeof anio === 'number' && Number.isFinite(anio)
          ? anio
          : new Date().getFullYear();

  const fechaInicio = new Date(anioObjetivo - 1, 11, 26, 0, 0, 0, 0);
  const fechaFin = new Date(anioObjetivo, 11, 25, 23, 59, 59, 999);

      let renglonesFiltrar: number[] = [];
      if (typeof renglones === 'string' && renglones.trim()) {
        renglonesFiltrar = renglones
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((valor) => Number.isFinite(valor) && valor > 0);
      }

      if (!renglonesFiltrar.length && idUsuario) {
        renglonesFiltrar = await obtenerRenglonesPermitidos(
          this.prisma,
          idUsuario,
        );
      }

      if (idUsuario && renglonesFiltrar.length === 0) {
        return {
          anio: anioObjetivo,
          totalCantidad: 0,
          totalGeneral: 0,
          totalDespachos: 0,
          meses: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            nombreMes: this.getNombreMes(index + 1),
            totalCantidad: 0,
            totalGeneral: 0,
            totalDespachos: 0,
            renglones: [],
          })),
          insumos: [],
        };
      }

      const where: Prisma.DespachoDetalleWhereInput = {
        Despacho: {
          fechaDespacho: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          ...(idServicio ? { idServicio } : {}),
        },
      };

      if (codigoInsumo) {
        where.codigoInsumo = codigoInsumo;
      }

      if (renglonesFiltrar.length) {
        where.OR = [
          {
            Inventario: {
              renglon: { in: renglonesFiltrar },
            },
          },
          {
            CatalogoInsumos: {
              renglon: { in: renglonesFiltrar },
            },
          },
        ];
      }

      const detalles = await this.prisma.despachoDetalle.findMany({
        where,
        include: {
          Despacho: {
            select: {
              idDespacho: true,
              fechaDespacho: true,
              idServicio: true,
              Servicios: {
                select: {
                  nombre: true,
                },
              },
            },
          },
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
        orderBy: {
          Despacho: {
            fechaDespacho: 'asc',
          },
        },
      });

      const inventarioBase = await this.obtenerInsumosInventarioBase(query);

      const mesesMap = new Map<
        number,
        {
          totalCantidad: number;
          totalGeneral: number;
          despachoIds: Set<number>;
          renglones: Map<
            number,
            {
              totalCantidad: number;
              totalGeneral: number;
              despachoIds: Set<number>;
              insumos: Map<
                number,
                {
                  nombreInsumo: string;
                  caracteristicas: string;
                  totalCantidad: number;
                  totalGeneral: number;
                  despachoIds: Set<number>;
                }
              >;
            }
          >;
        }
      >();

      const insumosGlobalMap = new Map<
        number,
        {
          codigoInsumo: number;
          nombreInsumo: string;
          caracteristicas: string;
          renglon: number | null;
          meses: Map<
            number,
            {
              totalCantidad: number;
              totalGeneral: number;
              despachoIds: Set<number>;
            }
          >;
          totalCantidad: number;
          totalGeneral: number;
          despachoIds: Set<number>;
        }
      >();

      const despachoIdsGlobal = new Set<number>();
      let totalCantidad = 0;
      let totalGeneral = 0;

      for (const detalle of detalles) {
        const fechaDespacho = detalle.Despacho?.fechaDespacho;
        if (!fechaDespacho) continue;

        if (fechaDespacho < fechaInicio || fechaDespacho > fechaFin) {
          continue;
        }

        const { anio: anioOperativo, mes: mesOperativo } = this.obtenerMesOperativo(fechaDespacho);
        if (anioOperativo !== anioObjetivo) {
          continue;
        }

        const mesData = mesesMap.get(mesOperativo);
        const precioTotal = Number(detalle.precioTotal ?? 0);

        let mesResumen = mesData;
        if (!mesResumen) {
          mesResumen = {
            totalCantidad: 0,
            totalGeneral: 0,
            despachoIds: new Set<number>(),
            renglones: new Map(),
          };
          mesesMap.set(mesOperativo, mesResumen);
        }

        mesResumen.totalCantidad += detalle.cantidad;
        mesResumen.totalGeneral += precioTotal;
        mesResumen.despachoIds.add(detalle.idDespacho);

        totalCantidad += detalle.cantidad;
        totalGeneral += precioTotal;
        despachoIdsGlobal.add(detalle.idDespacho);

        const renglonDetalle =
          detalle.Inventario?.renglon ?? detalle.CatalogoInsumos?.renglon;
        if (typeof renglonDetalle !== 'number' || !Number.isFinite(renglonDetalle)) {
          continue;
        }

        let renglonResumen = mesResumen.renglones.get(renglonDetalle);
        if (!renglonResumen) {
          renglonResumen = {
            totalCantidad: 0,
            totalGeneral: 0,
            despachoIds: new Set<number>(),
            insumos: new Map(),
          };
          mesResumen.renglones.set(renglonDetalle, renglonResumen);
        }

        renglonResumen.totalCantidad += detalle.cantidad;
        renglonResumen.totalGeneral += precioTotal;
        renglonResumen.despachoIds.add(detalle.idDespacho);

        const insumoCodigo = detalle.codigoInsumo;
        let insumoResumen = renglonResumen.insumos.get(insumoCodigo);
        if (!insumoResumen) {
          insumoResumen = {
            nombreInsumo: detalle.nombreInsumo,
            caracteristicas: detalle.caracteristicas,
            totalCantidad: 0,
            totalGeneral: 0,
            despachoIds: new Set<number>(),
          };
          renglonResumen.insumos.set(insumoCodigo, insumoResumen);
        }

        insumoResumen.totalCantidad += detalle.cantidad;
        insumoResumen.totalGeneral += precioTotal;
        insumoResumen.despachoIds.add(detalle.idDespacho);

        let insumoGlobal = insumosGlobalMap.get(insumoCodigo);
        if (!insumoGlobal) {
          insumoGlobal = {
            codigoInsumo: insumoCodigo,
            nombreInsumo: detalle.nombreInsumo,
            caracteristicas: detalle.caracteristicas,
            renglon: renglonDetalle ?? null,
            meses: new Map(),
            totalCantidad: 0,
            totalGeneral: 0,
            despachoIds: new Set<number>(),
          };
          insumosGlobalMap.set(insumoCodigo, insumoGlobal);
        } else {
          if (!insumoGlobal.nombreInsumo) {
            insumoGlobal.nombreInsumo = detalle.nombreInsumo;
          }
          if (!insumoGlobal.caracteristicas) {
            insumoGlobal.caracteristicas = detalle.caracteristicas;
          }
          if (insumoGlobal.renglon === null || insumoGlobal.renglon === undefined) {
            insumoGlobal.renglon = renglonDetalle ?? null;
          }
        }

        const mesGlobal = insumoGlobal.meses.get(mesOperativo) ?? {
          totalCantidad: 0,
          totalGeneral: 0,
          despachoIds: new Set<number>(),
        };
        mesGlobal.totalCantidad += detalle.cantidad;
        mesGlobal.totalGeneral += precioTotal;
        if (detalle.idDespacho) {
          mesGlobal.despachoIds.add(detalle.idDespacho);
        }
        insumoGlobal.meses.set(mesOperativo, mesGlobal);
        insumoGlobal.totalCantidad += detalle.cantidad;
        insumoGlobal.totalGeneral += precioTotal;
        if (detalle.idDespacho) {
          insumoGlobal.despachoIds.add(detalle.idDespacho);
        }
      }

      for (const base of inventarioBase) {
        let insumoGlobal = insumosGlobalMap.get(base.codigoInsumo);
        if (!insumoGlobal) {
          insumoGlobal = {
            codigoInsumo: base.codigoInsumo,
            nombreInsumo: base.nombreInsumo,
            caracteristicas: base.caracteristicas,
            renglon: base.renglon ?? null,
            meses: new Map(),
            totalCantidad: 0,
            totalGeneral: 0,
            despachoIds: new Set<number>(),
          };
          insumosGlobalMap.set(base.codigoInsumo, insumoGlobal);
        } else {
          if (!insumoGlobal.nombreInsumo) {
            insumoGlobal.nombreInsumo = base.nombreInsumo;
          }
          if (!insumoGlobal.caracteristicas) {
            insumoGlobal.caracteristicas = base.caracteristicas;
          }
          if (insumoGlobal.renglon === null || insumoGlobal.renglon === undefined) {
            insumoGlobal.renglon = base.renglon ?? null;
          }
        }
      }

      for (let mes = 1; mes <= 12; mes++) {
        if (!mesesMap.has(mes)) {
          mesesMap.set(mes, {
            totalCantidad: 0,
            totalGeneral: 0,
            despachoIds: new Set<number>(),
            renglones: new Map(),
          });
        }
      }

      const meses: ConsumoMensualResumen[] = Array.from(mesesMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([mes, data]) => {
          const renglones = Array.from(data.renglones.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([renglon, info]) => ({
              renglon,
              totalCantidad: info.totalCantidad,
              totalGeneral: Number(info.totalGeneral),
              totalDespachos: info.despachoIds.size,
              insumos: Array.from(info.insumos.entries())
                .map(([codigo, insumo]) => ({
                  codigoInsumo: codigo,
                  nombreInsumo: insumo.nombreInsumo,
                  caracteristicas: insumo.caracteristicas,
                  totalCantidad: insumo.totalCantidad,
                  totalGeneral: Number(insumo.totalGeneral),
                  totalDespachos: insumo.despachoIds.size,
                }))
                .sort((a, b) => b.totalGeneral - a.totalGeneral),
            }));

          return {
            mes,
            nombreMes: this.getNombreMes(mes),
            totalCantidad: data.totalCantidad,
            totalGeneral: Number(data.totalGeneral),
            totalDespachos: data.despachoIds.size,
            renglones,
          };
        });

      const insumos = Array.from(insumosGlobalMap.values())
        .map((insumo) => {
          const mesesDetalle: ConsumoInsumoMesDetalle[] = [];
          for (let mes = 1; mes <= 12; mes++) {
            const info = insumo.meses.get(mes);
            mesesDetalle.push({
              mes,
              nombreMes: this.getNombreMes(mes),
              totalCantidad: info ? info.totalCantidad : 0,
              totalGeneral: info ? Number(info.totalGeneral) : 0,
              totalDespachos: info ? info.despachoIds.size : 0,
            });
          }

          return {
            codigoInsumo: insumo.codigoInsumo,
            nombreInsumo: insumo.nombreInsumo,
            caracteristicas: insumo.caracteristicas,
            renglon: insumo.renglon ?? null,
            meses: mesesDetalle,
            totalCantidad: insumo.totalCantidad,
            totalGeneral: Number(insumo.totalGeneral),
            totalDespachos: insumo.despachoIds.size,
          } as ConsumoInsumoAnualResumen;
        })
        .sort((a, b) => {
          const diff = b.totalCantidad - a.totalCantidad;
          if (diff !== 0) {
            return diff;
          }
          return a.nombreInsumo.localeCompare(b.nombreInsumo, 'es', {
            sensitivity: 'base',
          });
        });

      return {
        anio: anioObjetivo,
        totalCantidad,
        totalGeneral: Number(totalGeneral),
        totalDespachos: despachoIdsGlobal.size,
        meses,
        insumos,
      };
    } catch (error) {
      this.logger.error(
        `Error al calcular consumo mensual de reportes: ${error instanceof Error ? error.message : error}`,
      );
      throw new HttpException(
        'Error al calcular el consumo mensual',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async obtenerConsumoMensual(
    query: ReporteFiltroQueryDto,
  ): Promise<ConsumoMensualResponse> {
    return this.calcularConsumoMensual(query);
  }

  async obtenerConsumoMensualDetalle(
    query: ReporteFiltroQueryDto,
  ): Promise<ConsumoMensualDetalleResponse> {
    const anioActual = new Date().getFullYear();
    const mesActual = new Date().getMonth() + 1;

    const anio = query.anio ?? anioActual;
    const mes = query.mes ?? mesActual;

    const rangoBase = this.obtenerRangoCorteMensual(anio, mes);

    const periodos: ConsumoPeriodoDetalle[] = [];

    periodos.push(
      await this.construirConsumoPeriodo('mensual', 1, anio, mes, query, true),
    );

    const objetivosPromedio = query.mesesPromedio
      ? Array.from(new Set([query.mesesPromedio])).filter((valor) => valor > 1)
      : [3, 7, 12];

    for (const mesesConsiderados of objetivosPromedio) {
      if (mesesConsiderados < 1) continue;
      periodos.push(
        await this.construirConsumoPeriodo(
          `promedio${mesesConsiderados}`,
          mesesConsiderados,
          anio,
          mes,
          query,
          false,
        ),
      );
    }

    return {
      anio,
      mes,
      nombreMes: this.getNombreMes(rangoBase.mes),
      fechaInicio: this.formatearFechaISO(rangoBase.fechaInicio),
      fechaFin: this.formatearFechaISO(rangoBase.fechaFin),
      periodos,
    };
  }

  async obtenerResumen(
    query: ReporteFiltroQueryDto,
  ): Promise<ReporteResumenResponse> {
    const consumo = await this.calcularConsumoMensual(query);
    const mesesConDatos = consumo.meses.length;

    const meses = consumo.meses.map((mes) => ({
      mes: mes.mes,
      nombreMes: mes.nombreMes,
      totalCantidad: mes.totalCantidad,
      totalGeneral: mes.totalGeneral,
      totalDespachos: mes.totalDespachos,
    }));

    const topRenglonesMap = new Map<
      number,
      { totalCantidad: number; totalGeneral: number }
    >();

    for (const mes of consumo.meses) {
      for (const renglon of mes.renglones) {
        const entry = topRenglonesMap.get(renglon.renglon) ?? {
          totalCantidad: 0,
          totalGeneral: 0,
        };
        entry.totalCantidad += renglon.totalCantidad;
        entry.totalGeneral += renglon.totalGeneral;
        topRenglonesMap.set(renglon.renglon, entry);
      }
    }

    const topRenglones = Array.from(topRenglonesMap.entries())
      .map(([renglon, valores]) => ({
        renglon,
        totalCantidad: valores.totalCantidad,
        totalGeneral: valores.totalGeneral,
      }))
      .sort((a, b) => b.totalGeneral - a.totalGeneral)
      .slice(0, 10);

    const promedioMensualCantidad =
      mesesConDatos > 0 ? consumo.totalCantidad / mesesConDatos : 0;
    const promedioMensualGeneral =
      mesesConDatos > 0 ? consumo.totalGeneral / mesesConDatos : 0;

    return {
      anio: consumo.anio,
      totalCantidad: consumo.totalCantidad,
      totalGeneral: consumo.totalGeneral,
      totalDespachos: consumo.totalDespachos,
      promedioMensualCantidad,
      promedioMensualGeneral,
      meses,
      topRenglones,
    };
  }
}
