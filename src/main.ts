import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import { networkConfig, frontendBaseUrl, backendBaseUrl } from '@shared-config/network.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const PORT_AUX = networkConfig.backendPort ?? 3001;
  const HOST_AUX = networkConfig.host ?? '0.0.0.0';

  // Dirección de Prefijo global de las API's
  app.setGlobalPrefix('api/v1');

  // Configurar ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar CORS y otros middlewares
  const defaultOrigins = [frontendBaseUrl, backendBaseUrl];
  const allowedOrigins =
    process.env.CORS_ORIGIN?.split(',')?.filter(Boolean) ?? defaultOrigins;

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Upload-Id',
      'Cache-Control',
    ],
    exposedHeaders: ['X-Total-Count'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });

  // Registrar el plugin multipart  CatalogoInsumos
  const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;
  await fastifyInstance.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 52428800, // 50MB
      fieldSize: 52428800, // 50MB
      files: 1, // Número máximo de archivos
      fields: 5, // Número máximo de campos
    },
  });

  // Iniciar la aplicación
  const listenPort = Number(process.env.PORT ?? PORT_AUX);
  const listenHost = process.env.HOST ?? HOST_AUX;

  await app.listen(listenPort, listenHost);
}

void bootstrap();
