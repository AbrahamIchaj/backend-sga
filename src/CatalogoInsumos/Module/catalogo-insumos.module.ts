import { Module } from '@nestjs/common';
import { CatalogoInsumosController } from '../Controller/catalogo-insumos.controller';
import { CatalogoInsumosApiController } from '../Controller/catalogo-insumos-api.controller';
import { CatalogoInsumosService } from '../Services/catalogo-insumos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogoInsumosController, CatalogoInsumosApiController],
  providers: [CatalogoInsumosService],
})
export class CatalogoInsumosModule {}