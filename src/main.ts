import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { 
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Configurar CORS y otros middlewares
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });
  
  // Registrar el plugin multipart
  const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;
  await fastifyInstance.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 52428800, // 50MB
      fieldSize: 52428800, // 50MB
      files: 1, // Número máximo de archivos
      fields: 5 // Número máximo de campos
    }
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(
    `🚀 Aplicación SGA ejecutándose en: http://localhost:${process.env.PORT ?? 3000}`,
  );
}

void bootstrap();
