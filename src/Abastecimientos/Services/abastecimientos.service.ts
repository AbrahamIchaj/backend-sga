import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Prisma, Abastecimientos } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportesService, ConsumoMensualDetalleResponse } from '../../Reportes/Services/reportes.service';
import { ReporteFiltroQueryDto } from '../../Reportes/dto/reportes-query.dto';
import { obtenerRenglonesPermitidos } from '../../common/utils/renglones.util';
import { ListarAbastecimientosQueryDto } from '../dto/listar-abastecimientos.dto';
import { GuardarAbastecimientosDto } from '../dto/guardar-abastecimientos.dto';

interface InventarioAggregado {
  codigoInsumo: number;
  renglon: number;
  nombreInsumo: string;
  caracteristicas?: string | null;
  presentacion?: string | null;
  unidadMedida?: string | null;
  existenciasBodega: number;
  valorInventario: number;
  precioPromedio: number | null;
  lotes: Array<{
    lote?: string | null;
    cantidad: number;
    fechaVencimiento?: Date | null;
    cartaCompromiso?: boolean | null;
    mesesDevolucion?: number | null;
  }>;
}

interface ConsumoPeriodoResumido {
  etiqueta: string;
  mesesConsiderados: number;
  mesesConDatos: number;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  promedioCantidad: number;
  promedioGeneral: number;
  promedioDespachos: number;
}

interface ConsumoPorInsumo {
  codigoInsumo: number;
  renglon?: number | null;
  nombreInsumo?: string;
  caracteristicas?: string;
  periodos: Record<string, ConsumoPeriodoResumido>;
}

interface SnapshotRecord {
  codigoInsumo: number;
  renglon: number;
  nombreInsumo: string;
  presentacion?: string | null;
  unidadMedida?: string | null;
  caracteristicas?: string | null;
  existenciasBodega: number;
  existenciasCocina: number;
  promedioMensual: number;
  mesesAbastecimiento: number;
  precioUnitario: number | null;
  valorTotal: number | null;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

interface PeriodoInfo {
  anio: number;
  mes: number;
  nombreMes: string;
  fechaInicio: Date;
  fechaFin: Date;
}

@Injectable()
export class AbastecimientosService {
  private readonly logger = new Logger(AbastecimientosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportesService: ReportesService,
  ) {}

  private parseRenglones(input?: number[] | null): number[] {
    if (!input || !Array.isArray(input)) {
      return [];
    }

    const valores = input
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);

    return Array.from(new Set(valores)).sort((a, b) => a - b);
  }

  private async resolveRenglonesFiltro(options: {
    idUsuario?: number;
    renglones?: number[] | null;
  }): Promise<{ renglones: number[]; sinPermisos: boolean }>
  {
    const renglonesFiltrar = this.parseRenglones(options.renglones);
    if (renglonesFiltrar.length > 0) {
      return { renglones: renglonesFiltrar, sinPermisos: false };
    }

    if (options.idUsuario) {
      const permitidos = await obtenerRenglonesPermitidos(
        this.prisma,
        options.idUsuario,
      );

      if (!permitidos.length) {
        return { renglones: [], sinPermisos: true };
      }

      return { renglones: permitidos, sinPermisos: false };
    }

    return { renglones: [], sinPermisos: false };
  }

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

  private calcularPeriodo(anio: number, mes: number): PeriodoInfo {
    const fechaInicio = new Date(anio, mes - 2, 26);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(anio, mes - 1, 25, 23, 59, 59, 999);

    return {
      anio,
      mes,
      nombreMes: this.getNombreMes(mes),
      fechaInicio,
      fechaFin,
    };
  }

  private agregarInventario(
    items: Array<{
      renglon: number;
      codigoInsumo: number;
      nombreInsumo: string;
      caracteristicas: string;
      presentacion: string;
      unidadMedida: string;
      cantidadDisponible: number;
      precioUnitario: Prisma.Decimal;
      precioTotal: Prisma.Decimal;
      lote: string | null;
      fechaVencimiento: Date | null;
      cartaCompromiso: boolean | null;
      mesesDevolucion: number | null;
    }>,
  ): Map<number, InventarioAggregado> {
    const map = new Map<number, InventarioAggregado>();

    for (const item of items) {
      const codigo = item.codigoInsumo;
      const valorLinea = Number(item.precioTotal ?? 0);
      const cantidad = Number(item.cantidadDisponible ?? 0);
      const precioUnitario = Number(item.precioUnitario ?? 0);

      if (!map.has(codigo)) {
        map.set(codigo, {
          codigoInsumo: codigo,
          renglon: item.renglon,
          nombreInsumo: item.nombreInsumo,
          caracteristicas: item.caracteristicas,
          presentacion: item.presentacion,
          unidadMedida: item.unidadMedida,
          existenciasBodega: 0,
          valorInventario: 0,
          precioPromedio: null,
          lotes: [],
        });
      }

      const agregado = map.get(codigo)!;
      agregado.existenciasBodega += cantidad;
      agregado.valorInventario += valorLinea;
      agregado.lotes.push({
        lote: item.lote,
        cantidad,
        fechaVencimiento: item.fechaVencimiento,
        cartaCompromiso: item.cartaCompromiso,
        mesesDevolucion: item.mesesDevolucion,
      });

      if (agregado.existenciasBodega > 0) {
        agregado.precioPromedio = agregado.valorInventario / agregado.existenciasBodega;
      } else if (precioUnitario > 0) {
        agregado.precioPromedio = precioUnitario;
      }
    }

    return map;
  }

  private construirSnapshots(
    registros: Abastecimientos[],
  ): Map<number, SnapshotRecord> {
    const map = new Map<number, SnapshotRecord>();

    for (const registro of registros) {
      const existenciasBodega = Number(registro.existenciasBodega ?? 0);
      const existenciasCocina = Number(registro.existenciasCocina ?? 0);
      const totalExistencias = existenciasBodega + existenciasCocina;
      const promedioMensual = Number(registro.promedioMensual ?? 0);
      const mesesAbastecimiento = Number(registro.mesesAbastecimiento ?? 0);
      const precioUnitario = registro.precioUnitario
        ? Number(registro.precioUnitario)
        : null;
      const valorTotal = precioUnitario ? precioUnitario * totalExistencias : null;

      map.set(registro.codigoInsumo, {
        codigoInsumo: registro.codigoInsumo,
        renglon: registro.renglon,
        nombreInsumo: registro.nombreInsumo,
        presentacion: registro.presentacion,
        unidadMedida: registro.unidadMedida,
        caracteristicas: registro.caracteristicas,
        existenciasBodega,
        existenciasCocina,
        promedioMensual,
        mesesAbastecimiento,
        precioUnitario,
        valorTotal,
        activo: registro.activo,
        creadoEn: registro.creadoEn,
        actualizadoEn: registro.actualizadoEn,
      });
    }

    return map;
  }

  private async obtenerConsumoPorInsumo(options: {
    anio: number;
    mes: number;
    idUsuario?: number;
    renglones: number[];
  }): Promise<{
    consumoMap: Map<number, ConsumoPorInsumo>;
    detalle?: ConsumoMensualDetalleResponse;
  }> {
    try {
      const query = new ReporteFiltroQueryDto();
      query.anio = options.anio;
      query.mes = options.mes;
      if (options.idUsuario) {
        query.idUsuario = options.idUsuario;
      }
      if (options.renglones.length) {
        query.renglones = options.renglones.join(',');
      }

      const detalle = await this.reportesService.obtenerConsumoMensualDetalle(query);
      const consumoMap = new Map<number, ConsumoPorInsumo>();

      for (const periodo of detalle.periodos ?? []) {
        const etiqueta = periodo.etiqueta;
        if (!periodo.insumos) continue;

        for (const insumo of periodo.insumos) {
          const codigo = insumo.codigoInsumo;
          if (!consumoMap.has(codigo)) {
            consumoMap.set(codigo, {
              codigoInsumo: codigo,
              renglon: insumo.renglon ?? null,
              nombreInsumo: insumo.nombreInsumo,
              caracteristicas: insumo.caracteristicas,
              periodos: {},
            });
          }

          const resumen: ConsumoPeriodoResumido = {
            etiqueta,
            mesesConsiderados: periodo.mesesConsiderados,
            mesesConDatos: periodo.mesesConDatos,
            totalCantidad: insumo.totalCantidad,
            totalGeneral: insumo.totalGeneral,
            totalDespachos: insumo.totalDespachos,
            promedioCantidad: insumo.promedioCantidad,
            promedioGeneral: insumo.promedioGeneral,
            promedioDespachos: insumo.promedioDespachos,
          };

          consumoMap.get(codigo)!.periodos[etiqueta] = resumen;
        }
      }

      return { consumoMap, detalle };
    } catch (error) {
      this.logger.warn(
        `No fue posible obtener el consumo mensual detalle: ${error instanceof Error ? error.message : error}`,
      );
      return { consumoMap: new Map<number, ConsumoPorInsumo>(), detalle: undefined };
    }
  }

  private obtenerPromedioPreferido(consumo?: ConsumoPorInsumo): number {
    if (!consumo) return 0;

    const priorizados = ['promedio3', 'promedio7', 'promedio12', 'mensual'];
    for (const clave of priorizados) {
      const periodo = consumo.periodos[clave];
      if (!periodo) continue;

      if (periodo.promedioCantidad > 0) {
        return periodo.promedioCantidad;
      }
      if (periodo.totalCantidad > 0) {
        return periodo.totalCantidad;
      }
    }
    return 0;
  }

  private calcularMesesAbastecimiento(
    existencias: number,
    promedio: number,
  ): number {
    if (!promedio || promedio <= 0) {
      return 0;
    }
    const resultado = existencias / promedio;
    return Number.isFinite(resultado) ? Number(resultado.toFixed(2)) : 0;
  }

  async listar(query: ListarAbastecimientosQueryDto) {
    try {
      const { anio, mes, idUsuario } = query;
      const { renglones, sinPermisos } = await this.resolveRenglonesFiltro({
        idUsuario,
        renglones: query.renglones,
      });

      if (sinPermisos) {
        return {
          periodo: this.calcularPeriodo(anio, mes),
          resumen: {
            totalInsumos: 0,
            activos: 0,
            inactivos: 0,
            existenciasBodegaActual: 0,
            existenciasCocinaRegistrada: 0,
            valorInventarioEstimado: 0,
            promedioMesesCobertura: 0,
          },
          insumos: [],
          consumo: {
            periodos: [],
          },
        };
      }

      const periodo = this.calcularPeriodo(anio, mes);

      const [snapshots, inventarioRaw, consumoDetalle] = await Promise.all([
        this.prisma.abastecimientos.findMany({
          where: {
            anio,
            mes,
            ...(renglones.length ? { renglon: { in: renglones } } : {}),
          },
        }),
        this.prisma.inventario.findMany({
          where: {
            cantidadDisponible: { gt: 0 },
            ...(renglones.length ? { renglon: { in: renglones } } : {}),
          },
          select: {
            renglon: true,
            codigoInsumo: true,
            nombreInsumo: true,
            caracteristicas: true,
            presentacion: true,
            unidadMedida: true,
            cantidadDisponible: true,
            precioUnitario: true,
            precioTotal: true,
            lote: true,
            fechaVencimiento: true,
            cartaCompromiso: true,
            mesesDevolucion: true,
          },
        }),
        this.obtenerConsumoPorInsumo({
          anio,
          mes,
          idUsuario,
          renglones,
        }),
      ]);

      const inventarioMap = this.agregarInventario(inventarioRaw);
      const snapshotMap = this.construirSnapshots(snapshots);
      const consumoMap = consumoDetalle.consumoMap;

      const codigos = new Set<number>([
        ...Array.from(inventarioMap.keys()),
        ...Array.from(snapshotMap.keys()),
        ...Array.from(consumoMap.keys()),
      ]);

      const insumos = Array.from(codigos.values()).map((codigo) => {
        const inventario = inventarioMap.get(codigo);
        const snapshot = snapshotMap.get(codigo);
        const consumo = consumoMap.get(codigo);

        const renglon = snapshot?.renglon ?? inventario?.renglon ?? consumo?.renglon ?? 0;
        const nombreInsumo = snapshot?.nombreInsumo ?? inventario?.nombreInsumo ?? consumo?.nombreInsumo ?? 'SIN NOMBRE';
        const caracteristicas = snapshot?.caracteristicas ?? inventario?.caracteristicas ?? consumo?.caracteristicas ?? null;
        const presentacion = snapshot?.presentacion ?? inventario?.presentacion ?? null;
        const unidadMedida = snapshot?.unidadMedida ?? inventario?.unidadMedida ?? null;

        const existenciasBodegaActual = inventario?.existenciasBodega ?? 0;
        const existenciasCocinaRegistrada = snapshot?.existenciasCocina ?? 0;
        const existenciasTotalesActual = existenciasBodegaActual + existenciasCocinaRegistrada;

        const promedioSugerido = this.obtenerPromedioPreferido(consumo);
        const mesesSugeridos = this.calcularMesesAbastecimiento(
          existenciasTotalesActual,
          promedioSugerido,
        );

        const precioPreferido = snapshot?.precioUnitario ?? inventario?.precioPromedio ?? null;
        const valorInventario = precioPreferido
          ? Number((existenciasTotalesActual * precioPreferido).toFixed(2))
          : null;

        const snapshotDatos = snapshot
          ? {
              existenciasBodega: snapshot.existenciasBodega,
              existenciasCocina: snapshot.existenciasCocina,
              existenciasTotales: snapshot.existenciasBodega + snapshot.existenciasCocina,
              promedioMensual: snapshot.promedioMensual,
              mesesAbastecimiento: snapshot.mesesAbastecimiento,
              precioUnitario: snapshot.precioUnitario,
              valorTotal: snapshot.valorTotal,
              activo: snapshot.activo,
              creadoEn: snapshot.creadoEn,
              actualizadoEn: snapshot.actualizadoEn,
            }
          : null;

        return {
          codigoInsumo: codigo,
          renglon,
          nombreInsumo,
          caracteristicas,
          presentacion,
          unidadMedida,
          snapshot: snapshotDatos,
          calculado: {
            existenciasBodega: existenciasBodegaActual,
            existenciasCocinaSugerida: existenciasCocinaRegistrada,
            existenciasTotales: existenciasTotalesActual,
            promedioMensualSugerido: Number(promedioSugerido.toFixed(2)),
            mesesAbastecimiento: mesesSugeridos,
            precioUnitario: precioPreferido,
            valorInventario,
          },
          consumo: consumo?.periodos ?? {},
          lotes: inventario?.lotes ?? [],
        };
      });

      const resumen = insumos.reduce(
        (acc, item) => {
          acc.totalInsumos += 1;
          const activo = item.snapshot ? item.snapshot.activo : true;
          if (activo) acc.activos += 1;
          else acc.inactivos += 1;

          acc.existenciasBodegaActual += item.calculado.existenciasBodega;
          acc.existenciasCocinaRegistrada += item.snapshot?.existenciasCocina ?? 0;
          acc.valorInventarioEstimado += item.calculado.valorInventario ?? 0;
          acc.promedioMesesCobertura += item.calculado.mesesAbastecimiento;
          return acc;
        },
        {
          totalInsumos: 0,
          activos: 0,
          inactivos: 0,
          existenciasBodegaActual: 0,
          existenciasCocinaRegistrada: 0,
          valorInventarioEstimado: 0,
          promedioMesesCobertura: 0,
        },
      );

      resumen.promedioMesesCobertura = insumos.length
        ? Number((resumen.promedioMesesCobertura / insumos.length).toFixed(2))
        : 0;

      const consumoGlobal = {
        periodos: consumoDetalle.detalle?.periodos?.map((periodo) => ({
          etiqueta: periodo.etiqueta,
          mesesConsiderados: periodo.mesesConsiderados,
          mesesConDatos: periodo.mesesConDatos,
          totalCantidad: periodo.totalCantidad,
          totalGeneral: periodo.totalGeneral,
          totalDespachos: periodo.totalDespachos,
          promedioCantidad: periodo.promedioCantidad,
          promedioGeneral: periodo.promedioGeneral,
          promedioDespachos: periodo.promedioDespachos,
        })) ?? [],
      };

      return {
        periodo: {
          anio: periodo.anio,
          mes: periodo.mes,
          nombreMes: periodo.nombreMes,
          fechaInicio: periodo.fechaInicio.toISOString(),
          fechaFin: periodo.fechaFin.toISOString(),
        },
        resumen: {
          ...resumen,
          existenciasBodegaActual: Math.round(resumen.existenciasBodegaActual),
          existenciasCocinaRegistrada: Math.round(resumen.existenciasCocinaRegistrada),
          valorInventarioEstimado: Number(resumen.valorInventarioEstimado.toFixed(2)),
        },
        insumos,
        consumo: consumoGlobal,
      };
    } catch (error) {
      this.logger.error(`Error al listar abastecimientos: ${error instanceof Error ? error.message : error}`);
      throw new HttpException(
        'Ocurrió un error al consultar los abastecimientos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async guardar(dto: GuardarAbastecimientosDto) {
    if (!dto.insumos || !dto.insumos.length) {
      throw new HttpException('Debe proporcionar al menos un insumo para guardar', HttpStatus.BAD_REQUEST);
    }

    const { renglones, sinPermisos } = await this.resolveRenglonesFiltro({
      idUsuario: dto.idUsuario,
      renglones: dto.renglones,
    });

    if (sinPermisos) {
      throw new HttpException(
        'El usuario no tiene renglones asignados para registrar abastecimientos',
        HttpStatus.FORBIDDEN,
      );
    }

    const codigosProcesados = new Set<number>();

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const insumo of dto.insumos) {
          const codigo = Number(insumo.codigoInsumo);
          const renglon = Number(insumo.renglon);

          if (!Number.isFinite(codigo) || codigo <= 0) {
            throw new HttpException(
              `Código de insumo inválido en el payload: ${insumo.codigoInsumo}`,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (!Number.isFinite(renglon) || renglon <= 0) {
            throw new HttpException(
              `Renglón inválido para el insumo ${codigo}`,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (codigosProcesados.has(codigo)) {
            continue;
          }

          if (renglones.length && !renglones.includes(renglon)) {
            throw new HttpException(
              `El renglón ${renglon} del insumo ${codigo} no está autorizado para este usuario`,
              HttpStatus.FORBIDDEN,
            );
          }

          const existenciasBodega = Number.isFinite(insumo.existenciasBodega)
            ? Math.max(0, Math.trunc(Number(insumo.existenciasBodega)))
            : 0;
          const existenciasCocina = Math.max(0, Math.trunc(Number(insumo.existenciasCocina ?? 0)));
          const existenciasTotales = existenciasBodega + existenciasCocina;
          const promedioMensual = Number.isFinite(insumo.promedioMensual)
            ? Math.max(0, Number(insumo.promedioMensual))
            : 0;
          const precioUnitario = Number.isFinite(insumo.precioUnitario)
            ? Number(insumo.precioUnitario)
            : null;
          const mesesAbastecimiento = this.calcularMesesAbastecimiento(
            existenciasTotales,
            promedioMensual,
          );

          await tx.abastecimientos.upsert({
            where: {
              anio_mes_codigoInsumo: {
                anio: dto.anio,
                mes: dto.mes,
                codigoInsumo: codigo,
              },
            },
            update: {
              renglon,
              nombreInsumo: insumo.nombreInsumo ?? '',
              presentacion: insumo.presentacion ?? '',
              unidadMedida: insumo.unidadMedida ?? null,
              caracteristicas: insumo.caracteristicas ?? null,
              existenciasBodega,
              existenciasCocina,
              promedioMensual: new Prisma.Decimal(
                promedioMensual.toFixed(4),
              ),
              mesesAbastecimiento: new Prisma.Decimal(
                mesesAbastecimiento.toFixed(4),
              ),
              precioUnitario: precioUnitario !== null
                ? new Prisma.Decimal(precioUnitario.toFixed(4))
                : null,
              activo: Boolean(insumo.activo),
            },
            create: {
              anio: dto.anio,
              mes: dto.mes,
              renglon,
              codigoInsumo: codigo,
              nombreInsumo: insumo.nombreInsumo ?? '',
              presentacion: insumo.presentacion ?? '',
              unidadMedida: insumo.unidadMedida ?? null,
              caracteristicas: insumo.caracteristicas ?? null,
              existenciasBodega,
              existenciasCocina,
              promedioMensual: new Prisma.Decimal(
                promedioMensual.toFixed(4),
              ),
              mesesAbastecimiento: new Prisma.Decimal(
                mesesAbastecimiento.toFixed(4),
              ),
              precioUnitario: precioUnitario !== null
                ? new Prisma.Decimal(precioUnitario.toFixed(4))
                : null,
              activo: Boolean(insumo.activo),
            },
          });

          codigosProcesados.add(codigo);
        }
      });

      const registros = await this.prisma.abastecimientos.findMany({
        where: {
          anio: dto.anio,
          mes: dto.mes,
          codigoInsumo: { in: Array.from(codigosProcesados.values()) },
        },
      });

      return {
        anio: dto.anio,
        mes: dto.mes,
        registros: registros.map((registro) => ({
          codigoInsumo: registro.codigoInsumo,
          renglon: registro.renglon,
          nombreInsumo: registro.nombreInsumo,
          presentacion: registro.presentacion,
          unidadMedida: registro.unidadMedida,
          caracteristicas: registro.caracteristicas,
          existenciasBodega: registro.existenciasBodega,
          existenciasCocina: registro.existenciasCocina,
          promedioMensual: Number(registro.promedioMensual ?? 0),
          mesesAbastecimiento: Number(registro.mesesAbastecimiento ?? 0),
          precioUnitario: registro.precioUnitario ? Number(registro.precioUnitario) : null,
          activo: registro.activo,
          actualizadoEn: registro.actualizadoEn,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error al guardar abastecimientos: ${error instanceof Error ? error.message : error}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'No fue posible guardar los abastecimientos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
