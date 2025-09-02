import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bienvenido al Sistema de Gestión de Almacén (SGA) - Backend API';
  }

  getSystemInfo() {
    return {
      name: 'SGA Backend',
      version: '1.0.0',
      framework: 'NestJS',
      platform: 'Fastify',
      database: 'No configurada aún',
      features: [
        'API REST con Fastify',
        'Arquitectura modular',
        'Validación de datos',
        'Manejo de errores',
        'Logging integrado',
        'CORS habilitado',
      ],
    };
  }

  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    };
  }
}
