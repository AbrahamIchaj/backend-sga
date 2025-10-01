export interface DashboardMetrics {
  totalInsumos: number;
  totalExistencias: number;
  insumosProximosVencer: number;
  insumosVencidos: number;
  stockBajo: number;
  valorInventario: number;
  totalIngresosCompras: number;
  comprasMesActual: number;
  insumosIngresadosMes: number;
  montoComprasMes: number;
  mesActual: string;
  ultimaActualizacion: Date;
}

export interface SerieTemporal {
  labels: string[];
  ingresos: number[];
  despachos: number[];
}

export interface DistribucionInventario {
  labels: string[];
  data: number[];
}

export interface TopProveedores {
  labels: string[];
  data: number[];
}

export interface DespachoResumen {
  idDespacho: number;
  codigo: string;
  fecha: Date;
  servicio: string | null;
  usuario: string | null;
  totalCantidad: number;
  totalGeneral: number;
}

export interface DashboardResumenResponse {
  metrics: DashboardMetrics;
  charts: {
    ingresosVsDespachos: SerieTemporal;
    estadoInventario: DistribucionInventario;
    comprasPorProveedor: TopProveedores;
  };
  despachosRecientes: DespachoResumen[];
}
