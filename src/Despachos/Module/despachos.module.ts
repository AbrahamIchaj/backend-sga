import { Module } from '@nestjs/common';
import { DespachosController } from '../Controller/despachos.controller';
import { DespachosService } from '../Services/despachos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DespachosController],
  providers: [DespachosService],
  exports: [DespachosService],
})
export class DespachosModule {}
