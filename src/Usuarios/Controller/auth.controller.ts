import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../Services/auth.service';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.debug(`Intento de login para: ${loginDto.correo}`);

      const result = await this.authService.login(loginDto);

      this.logger.log(`Login exitoso para: ${loginDto.correo}`);
      return {
        success: true,
        data: result,
        message: 'Login exitoso',
      };
    } catch (error) {
      this.logger.error(
        `Error en login para ${loginDto.correo}: ${error.message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
