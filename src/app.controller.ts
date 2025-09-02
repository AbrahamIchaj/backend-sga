import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  getHello(): { message: string; timestamp: string; status: string } {
    return {
      message: this.appService.getHello(),
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  @HttpCode(HttpStatus.OK)
  getInfo(): {
    name: string;
    version: string;
    description: string;
    environment: string;
  } {
    return {
      name: 'Sistema de Gestión de Almacén (SGA)',
      version: '1.0.0',
      description: 'Backend API para gestión de almacenes e inventarios',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
