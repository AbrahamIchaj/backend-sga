import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogoInsumosModule } from './CatalogoInsumos/Module/catalogo-insumos.module';
import { ServiciosModule } from './Servicios/Module/servicios.module';
import { PermisosModule } from './Permisos/Module/permisos.module';
import { RolesModule } from './Roles/Module/roles.module';

@Module({
  imports: [CatalogoInsumosModule, ServiciosModule, PermisosModule, RolesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
