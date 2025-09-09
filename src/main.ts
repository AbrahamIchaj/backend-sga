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
}

void bootstrap();
