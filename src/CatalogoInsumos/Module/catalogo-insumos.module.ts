import { Module } from '@nestjs/common';
import { CatalogoInsumosController } from '../Controller/catalogo-insumos.controller';
import { CatalogoInsumosService } from '../Services/catalogo-insumos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogoInsumosController],
  providers: [CatalogoInsumosService],
})
export class CatalogoInsumosModule {}