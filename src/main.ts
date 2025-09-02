import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true, // Habilitar logging de Fastify
    }),
  );

  // Configurar CORS para desarrollo
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });

  // Configurar prefijo global para la API
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(
    `🚀 Aplicación SGA ejecutándose en: http://localhost:${process.env.PORT ?? 3000}/api/v1`,
  );
}

void bootstrap();
