import { Module } from '@nestjs/common';
import { UsuariosService } from '../Services/usuarios.service';
import { UsuariosController } from '../Controller/usuarios.controller';
import { UsuariosReportesController } from '../Controller/usuarios-reportes.controller';
import { GestionContrasenasController } from '../Controller/gestion-contrasenas.controller';
import { ActivarDesactivarUsuariosController } from '../Controller/activar-desactivar-Usuarios.controller';
import { AuthController } from '../Controller/auth.controller';
import { HashService } from '../Services/hash.service';
import { PasswordTemporalService } from '../Services/password-temporal.service';
import { AuthService } from '../Services/auth.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    UsuariosController,                     
    UsuariosReportesController,             
    GestionContrasenasController,            
    ActivarDesactivarUsuariosController,
    AuthController,    
  ],
  providers: [
    UsuariosService,
    HashService,
    PasswordTemporalService,
    AuthService,
  ],
  exports: [
    UsuariosService, 
    HashService,    
    PasswordTemporalService,
    AuthService,
  ],
})
export class UsuariosModule {}
