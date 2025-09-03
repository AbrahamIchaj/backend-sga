export class CreateCatalogoInsumoDto {
  renglon?: number | null;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas?: string;
  nombrePresentacion?: string;
  unidadMedida?: string;
  codigoPresentacion?: number | null;
}