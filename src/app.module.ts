import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogoInsumosModule } from './CatalogoInsumos/Module/catalogo-insumos.module';
import { ServiciosModule } from './Servicios/Module/servicios.module';
import { PermisosModule } from './Permisos/Module/permisos.module';
import { RolesModule } from './Roles/Module/roles.module';
import { UsuariosModule } from './Usuarios/Module/usuarios.module';
import { ComprasModule } from './Compras/Module/compras.module';

@Module({
  imports: [
    CatalogoInsumosModule, 
    ServiciosModule, 
    PermisosModule, 
    RolesModule,
    UsuariosModule,
    ComprasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
