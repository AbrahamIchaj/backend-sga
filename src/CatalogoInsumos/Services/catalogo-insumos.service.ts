import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogoInsumos } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const { parse } = require('csv-parse');

interface CsvRecord {
  [key: string]: string;
}

@Injectable()
export class CatalogoInsumosService {
  private readonly logger = new Logger(CatalogoInsumosService.name);

  constructor(private prisma: PrismaService) {}

  async processCSVFile(filePath: string, abortSignal?: AbortSignal): Promise<{ success: number; errors: number; errorDetails: string[] }> {
    const results = { success: 0, errors: 0, errorDetails: [] as string[] };

    try {
      // Función para verificar cancelación
      const checkCancellation = () => {
        if (abortSignal?.aborted) {
          throw new Error('Procesamiento cancelado por el usuario');
        }
      };

      checkCancellation(); // Verificar antes de empezar
      
      // Verificar conexión a la base de datos y tabla
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        this.logger.log('Conexión a la base de datos verificada');
        checkCancellation(); // Verificar después de conectar DB
        
        try {
          const tablas = await this.prisma.$queryRaw`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
          `;
          this.logger.log(`Tablas disponibles: ${JSON.stringify(tablas)}`);
        } catch (error) {
          this.logger.error('Error al consultar tablas:', error.message);
        }
      } catch (dbConnError) {
        this.logger.error('Error de conexión a la base de datos:', dbConnError.message);
        throw new Error(`Error de conexión: ${dbConnError.message}`);
      }
      
      checkCancellation(); // Verificar antes de leer archivo
      // Leer archivo con codificación correcta para caracteres especiales
      const fileContent = await readFile(filePath, { encoding: 'utf-8' });
      
      // Eliminar la primera línea (título del catálogo)
      const lines = fileContent.split('\n');
      const contentWithoutHeader = lines.slice(1).join('\n');
      
      // Analizar CSV
      const records = await new Promise<CsvRecord[]>((resolve, reject) => {
        const results: CsvRecord[] = [];
        parse(contentWithoutHeader, {
          delimiter: ';',
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })
        .on('data', (record: CsvRecord) => results.push(record))
        .on('error', (err: Error) => reject(err))
        .on('end', () => resolve(results));
      });
      
      checkCancellation(); // Verificar después de parsear CSV
      
      this.logger.log(`Se encontraron ${records.length} registros en el CSV`);
      
      // Procesar cada registro
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        // Verificar cancelación cada 10 registros para mejor performance
        if (i % 10 === 0) {
          checkCancellation();
        }
        
        try {
          const codigoInsumoStr = record['CÓDIGO DE INSUMO'];
          if (!codigoInsumoStr) {
            throw new Error('Falta el código de insumo');
          }
          
          const codigoInsumo = parseInt(codigoInsumoStr, 10);
          if (isNaN(codigoInsumo)) {
            throw new Error(`Código de insumo inválido: ${codigoInsumoStr}`);
          }
          
          // Validar nombre de insumo
          const nombreInsumo = record['NOMBRE']?.trim();
          if (!nombreInsumo) {
            throw new Error(`Nombre de insumo vacío para código: ${codigoInsumo}`);
          }
          
          // Preparar otros campos
          let renglon: number | null = null;
          if (record['RENGLÓN']) {
            const renglonNum = parseInt(record['RENGLÓN'], 10);
            if (!isNaN(renglonNum)) {
              renglon = renglonNum;
            }
          }
          
          let codigoPresentacion: number | null = null;
          if (record['CÓDIGO DE PRESENTACIÓN']) {
            const cpNum = parseInt(record['CÓDIGO DE PRESENTACIÓN'], 10);
            if (!isNaN(cpNum)) {
              codigoPresentacion = cpNum;
            }
          }
          
          try {
            // Usar SQL directo con los nombres de columnas correctos
            const sqlSelect = `SELECT * FROM "CatalogoInsumos" WHERE "codigoInsumo" = $1`;
            const existingRecords = await this.prisma.$queryRawUnsafe(sqlSelect, codigoInsumo) as any[];
            
            if (existingRecords && existingRecords.length > 0) {
              // Se actualizaran los datos si ya existen
              const sqlUpdate = `
                UPDATE "CatalogoInsumos" SET 
                "nombreInsumo" = $1,
                "renglon" = $2,
                "caracteristicas" = $3,
                "nombrePresentacion" = $4,
                "unidadMedida" = $5,
                "codigoPresentacion" = $6
                WHERE "codigoInsumo" = $7
              `;
              
              await this.prisma.$executeRawUnsafe(
                sqlUpdate,
                nombreInsumo,
                renglon,
                record['CARACTERÍSTICAS']?.trim() || null,
                record['NOMBRE DE LA PRESENTACIÓN']?.trim() || null,
                record['CANTIDAD Y UNIDAD DE MEDIDA DE LA PRESENTACIÓN']?.trim() || null,
                codigoPresentacion,
                codigoInsumo
              );
              
              this.logger.debug(`Actualizado(s) ${existingRecords.length} insumo(s) con código: ${codigoInsumo}`);
            } else {
              // Crear un nuevo registro
              const sqlInsert = `
                INSERT INTO "CatalogoInsumos" (
                  "codigoInsumo", 
                  "nombreInsumo",
                  "renglon",
                  "caracteristicas",
                  "nombrePresentacion",
                  "unidadMedida",
                  "codigoPresentacion"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              `;
              
              await this.prisma.$executeRawUnsafe(
                sqlInsert,
                codigoInsumo,
                nombreInsumo,
                renglon,
                record['CARACTERÍSTICAS']?.trim() || null,
                record['NOMBRE DE LA PRESENTACIÓN']?.trim() || null,
                record['CANTIDAD Y UNIDAD DE MEDIDA DE LA PRESENTACIÓN']?.trim() || null,
                codigoPresentacion
              );
              
              this.logger.debug(`Creado nuevo insumo con código: ${codigoInsumo}`);
            }
          } catch (dbError) {
            throw new Error(`Error de base de datos: ${dbError.message}`);
          }
          
          results.success++;
        } catch (error) {
          results.errors++;
          results.errorDetails.push(`Error: ${error.message}`);
          this.logger.error(`Error procesando registro: ${error.message}`);
        }
      }
      
      this.logger.log(`Proceso CSV completado: ${results.success} exitosos, ${results.errors} errores`);
      return results;
    } catch (error) {
      this.logger.error(`Error general en el proceso: ${error.message}`, error.stack);
      results.errors++;
      results.errorDetails.push(`Error general: ${error.message}`);
      return results;
    }
  }

  async findAll(): Promise<CatalogoInsumos[]> {
    try {
      // Usar SQL directo con los nombres de columnas correctos
      const sql = `
        SELECT * FROM "CatalogoInsumos" 
        ORDER BY "codigoInsumo" ASC, "idCatalogoInsumos" ASC
      `;
      
      const insumos = await this.prisma.$queryRawUnsafe(sql);
      return insumos as CatalogoInsumos[];
    } catch (error) {
      this.logger.error(`Error al obtener insumos: ${error.message}`);
      
      // Intentar diagnosticar el problema
      try {
        const sql = `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
        const tablas = await this.prisma.$queryRawUnsafe(sql);
        this.logger.log(`Tablas disponibles: ${JSON.stringify(tablas)}`);
      } catch (diagError) {
        this.logger.error(`Error al diagnosticar: ${diagError.message}`);
      }
      
      throw error;
    }
  }
  
  async search(query: string): Promise<CatalogoInsumos[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const insumos = await this.prisma.catalogoInsumos.findMany({
        where: {
          OR: [
            {
              nombreInsumo: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
            {
              codigoInsumo: {
                equals: parseInt(query.trim()) || undefined,
              },
            },
            {
              caracteristicas: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: {
          nombreInsumo: 'asc',
        },
        take: 50, // Limitar resultados para performance
      });

      this.logger.log(`Búsqueda "${query}" encontró ${insumos.length} resultados`);
      return insumos;
    } catch (error) {
      this.logger.error(`Error en búsqueda "${query}": ${error.message}`);
      throw error;
    }
  }

  async debugDatabase() {
    try {
      // 1. Probar conexión básica
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      // 2. Listar todas las tablas
      const tablas = await this.prisma.$queryRaw`
        SELECT tablename FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public'
      ` as Array<{tablename: string}>;
      
      // 3. Buscar la tabla de catálogo de insumos (sin importar mayúsculas/minúsculas)
      const nombreTablas = tablas.map(t => ({ 
        original: t.tablename, 
        lowercase: t.tablename.toLowerCase() 
      }));
      
      const tablasInsumos = nombreTablas.filter(t => 
        t.lowercase.includes('catalogo') && t.lowercase.includes('insumo')
      );
      
      // 4. Si encontramos la tabla, obtener detalles
      let estructuraTabla: any[] = [];
      let muestraRegistro: any[] = [];
      let totalRegistros = 0;
      let nombreTablaReal: string | null = null;
      
      if (tablasInsumos.length > 0) {
        nombreTablaReal = tablasInsumos[0].original;
        
        // Obtener estructura
        const sqlColumnas = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${nombreTablaReal}'
          ORDER BY ordinal_position
        `;
        const columnas = await this.prisma.$queryRawUnsafe(sqlColumnas) as any[];
        
        estructuraTabla = columnas;
        
        // Contar registros
        const sqlConteo = `SELECT COUNT(*) as total FROM "${nombreTablaReal}"`;
        const conteo = await this.prisma.$queryRawUnsafe(sqlConteo) as Array<{total: number}>;
        
        totalRegistros = conteo[0]?.total || 0;
        
        // Obtener muestra
        if (totalRegistros > 0) {
          const sqlMuestra = `SELECT * FROM "${nombreTablaReal}" LIMIT 1`;
          muestraRegistro = await this.prisma.$queryRawUnsafe(sqlMuestra) as any[];
        }
      }
      
      // Intentar consultas directas con diferentes nombres de tabla
      const pruebasNombres = ['catalogoinsumos', 'CatalogoInsumos', 'catalogoInsumos', 'catalogo_insumos'];
      const resultadosPruebas: Record<string, string> = {};
      
      for (const nombre of pruebasNombres) {
        try {
          // Usamos una forma alternativa de consulta SQL directa para evitar problemas con las comillas
          let sql = `SELECT COUNT(*) as total FROM "${nombre}"`;
          const resultado = await this.prisma.$queryRawUnsafe(sql) as Array<{total: number}>;
          resultadosPruebas[nombre] = `✅ OK (${resultado[0]?.total || 0} registros)`;
        } catch (error) {
          resultadosPruebas[nombre] = `❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`;
        }
      }
      
      // Devolver toda la información recopilada
      return {
        conexion: '✅ Conexión establecida',
        tablas: tablas.map(t => t.tablename),
        tablaCatalogo: nombreTablaReal || 'No encontrada',
        totalRegistros,
        estructuraTabla,
        muestraRegistro: muestraRegistro.length > 0 ? muestraRegistro[0] : null,
        pruebasNombres: resultadosPruebas
      };
    } catch (error) {
      this.logger.error(`Error de depuración: ${error.message}`);
      throw error;
    }
  }
}