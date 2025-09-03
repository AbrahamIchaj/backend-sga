import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogoInsumosModule } from './CatalogoInsumos/Module/catalogo-insumos.module';

@Module({
  imports: [CatalogoInsumosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
