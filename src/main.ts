import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { 
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  const PORT_AUX = 3001;

  // Dirección de Prefijo global de las API's
  app.setGlobalPrefix('api/v1');


  // Configurar CORS y otros middlewares
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });


  
  // Registrar el plugin multipart  CatalogoInsumos
  const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;
  await fastifyInstance.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 52428800, // 50MB
      fieldSize: 52428800, // 50MB
      files: 1, // Número máximo de archivos
      fields: 5 // Número máximo de campos
    }
  });


  // Iniciar la aplicación
  await app.listen(process.env.PORT ?? `${PORT_AUX}`, '0.0.0.0');
  
  console.log(
    `🚀 Aplicación SGA ejecutándose en: http://localhost:${process.env.PORT ?? PORT_AUX}`,
  );
  console.log(
    `📋 API disponible en: http://localhost:${process.env.PORT ?? PORT_AUX}/api/v1`,
  );
  console.log(
    `🔧 Endpoints disponibles:
    
    📦 CATÁLOGO INSUMOS:
    - GET    /api/v1/catalogo-insumos - Listar insumos
    - GET    /api/v1/catalogo-insumos/search?query=... - Buscar insumos
    - POST   /api/v1/catalogo-insumos/upload - Subir CSV
    - POST   /api/v1/catalogo-insumos/cancel-upload - Cancelar subida
    - GET    /api/v1/catalogo-insumos/debug - Debug DB
    
    🛠️ SERVICIOS:
    - GET    /api/v1/servicios - Listar servicios
    - GET    /api/v1/servicios/search?query=... - Buscar servicios
    - POST   /api/v1/servicios - Crear servicio
    - GET    /api/v1/servicios/:id - Obtener servicio
    - PATCH  /api/v1/servicios/:id - Actualizar servicio (parcial)
    - PUT    /api/v1/servicios/:id - Reemplazar servicio (completo)
    - DELETE /api/v1/servicios/:id - Eliminar servicio
    
    🔐 PERMISOS:
    - GET    /api/v1/permisos - Listar permisos
    - GET    /api/v1/permisos/search?query=... - Buscar permisos
    - GET    /api/v1/permisos/without-roles - Permisos sin roles asignados
    - GET    /api/v1/permisos/by-role/:roleId - Permisos de un rol específico
    - GET    /api/v1/permisos/by-name/:permiso - Buscar por nombre exacto
    - POST   /api/v1/permisos - Crear permiso
    - GET    /api/v1/permisos/:id - Obtener permiso
    - PATCH  /api/v1/permisos/:id - Actualizar permiso (parcial)
    - PUT    /api/v1/permisos/:id - Reemplazar permiso (completo)
    - DELETE /api/v1/permisos/:id - Eliminar permiso`,
  );
}

void bootstrap();
