import { Controller, Post, Get, Req, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CatalogoInsumosService } from '../Services/catalogo-insumos.service';
import type { FastifyRequest } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import type { MultipartFile } from '@fastify/multipart';

// Convertir funciones de callback a promesas
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

interface MultipartRequest extends FastifyRequest {
  file(): Promise<MultipartFile>;
}

@Controller('catalogo-insumos')
export class CatalogoInsumosController {
  private readonly logger = new Logger(CatalogoInsumosController.name);
  
  constructor(private readonly catalogoInsumosService: CatalogoInsumosService) {}

  @Post('upload')
  async uploadFile(@Req() req: MultipartRequest) {
    let filepath: string | null = null;
    
    try {
      this.logger.log('Iniciando procesamiento de archivo CSV');
      
      // Obtener el archivo
      let data: MultipartFile;
      try {
        data = await req.file();
        
        if (!data) {
          throw new HttpException('No se ha proporcionado ningún archivo', HttpStatus.BAD_REQUEST);
        }
      } catch (fileError) {
        throw new HttpException('Error al recibir el archivo: ' + fileError.message, HttpStatus.BAD_REQUEST);
      }
      
      // Validar que el archivo es CSV
      const allowedMimeTypes = [
        'text/csv', 
        'application/vnd.ms-excel', 
        'application/csv', 
        'text/plain',
        'application/octet-stream'
      ];
      
      if (!allowedMimeTypes.includes(data.mimetype)) {
        this.logger.warn(`Archivo recibido con tipo MIME no esperado: ${data.mimetype}`);
        throw new HttpException(
          `El archivo debe ser CSV. Tipo recibido: ${data.mimetype}`, 
          HttpStatus.BAD_REQUEST
        );
      }
      
      // RUTA DEL DIRECTORIOOO
      await mkdir('./uploads', { recursive: true });
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomId = Math.round(Math.random() * 1e9);
      const filename = `${timestamp}-${randomId}.csv`;
      filepath = path.join('./uploads', filename);
      
      try {
        // Guardar el archivo en el servidor
        const buffer = await data.toBuffer();
        await writeFile(filepath, buffer);
        this.logger.log(`Archivo guardado en: ${filepath} (${buffer.length} bytes)`);
        
        if (buffer.length === 0) {
          throw new HttpException('El archivo CSV está vacío', HttpStatus.BAD_REQUEST);
        }
      } catch (fsError) {
        throw new HttpException(
          `Error al guardar el archivo: ${fsError.message}`, 
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      this.logger.log('Iniciando procesamiento del archivo CSV...');
      const results = await this.catalogoInsumosService.processCSVFile(filepath);
      
      // Eliminar el archivo temporal después de procesarlo
      try {
        await unlink(filepath);
        filepath = null; // Marcar como eliminado
        this.logger.log('Archivo temporal eliminado correctamente');
      } catch (unlinkError) {
        this.logger.warn(`No se pudo eliminar el archivo temporal: ${unlinkError.message}`);
      }
      
      // Mostrar los resultados
      return {
        success: true,
        message: results.errors > 0
          ? `Archivo procesado con ${results.errors} errores`
          : 'Archivo procesado correctamente',
        registrosExitosos: results.success,
        registrosTotales: results.success + results.errors,
        errores: results.errors,
        detallesErrores: results.errorDetails.length > 10 
          ? [...results.errorDetails.slice(0, 10), `... y ${results.errorDetails.length - 10} más`] 
          : results.errorDetails,
      };
    } catch (error) {

      if (filepath) {
        try {
          await unlink(filepath);
        } catch (unlinkError) {
          this.logger.warn(`No se pudo eliminar el archivo temporal: ${unlinkError.message}`);
        }
      }
      
      this.logger.error(`Error al procesar el archivo CSV: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          `Error al procesar el archivo: ${error.message}`, 
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  @Get()
  async findAll() {
    try {
      const resultado = await this.catalogoInsumosService.findAll();
      this.logger.log(`Se encontraron ${resultado.length} registros`);
      return resultado;
    } catch (error) {
      this.logger.error(`Error al obtener insumos: ${error.message}`);
      throw new HttpException(
        `Error al obtener datos: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Get('debug')
  async debugDatabase() {
    try {
      return await this.catalogoInsumosService.debugDatabase();
    } catch (error) {
      this.logger.error(`Error en depuración: ${error.message}`);
      throw new HttpException(
        `Error en depuración: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}