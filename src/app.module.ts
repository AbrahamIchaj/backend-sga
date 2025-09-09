import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogoInsumosModule } from './CatalogoInsumos/Module/catalogo-insumos.module';
import { ServiciosModule } from './Servicios/Module/servicios.module';
import { PermisosModule } from './Permisos/Module/permisos.module';

@Module({
  imports: [CatalogoInsumosModule, ServiciosModule, PermisosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
