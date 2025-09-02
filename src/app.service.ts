import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bienvenido al Sistema de Gestión de Almacén (SGA) - Backend API';
  }
}
